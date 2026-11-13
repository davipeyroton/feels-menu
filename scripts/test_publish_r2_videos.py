#!/usr/bin/env python3
"""Local tests for the R2 publisher. They use a fake bucket and do not open a socket."""

from __future__ import annotations

import importlib.util
import io
import json
import socket
import sys
import tempfile
import traceback
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SCRIPT = Path(__file__).with_name("publish-r2-videos.py")
SPEC = importlib.util.spec_from_file_location("publish_r2_videos", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
publisher = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = publisher
SPEC.loader.exec_module(publisher)

KEYS = (
    "brand/intro-menu.mp4",
    "menu/espresso-duplo.mp4",
    "menu/cappuccino.mp4",
)
ACCESS_KEY = "AKIATESTACCESSKEY12"
SECRET_KEY = "supersecretvalue99"
SIGNATURE = "deadbeefcafebabe"


def _refuse_connection(*_args, **_kwargs):
    raise AssertionError("teste tentou abrir conexão de rede")


socket.create_connection = _refuse_connection  # type: ignore[assignment]


class FakeR2:
    def __init__(self, store: dict[str, bytes]) -> None:
        self.store = dict(store)
        self.public = dict(store)
        self.events: list[tuple[str, str, str]] = []
        self.put_counts: dict[str, int] = {}
        self.put_errors: dict[tuple[str, int], BaseException] = {}
        self.bad_reads: dict[str, int] = {}
        self.public_hold: set[str] = set()

    def head(self, key: str) -> dict[str, str]:
        if key not in self.store:
            raise publisher.OperationError(f"HEAD {key} retornou 404")
        return {"content-length": str(len(self.store[key]))}

    def get(self, key: str) -> bytes:
        if self.put_counts.get(key, 0) >= 1 and self.bad_reads.get(key, 0) > 0:
            self.bad_reads[key] -= 1
            return b"leitura-autenticada-invalida"
        if key not in self.store:
            raise publisher.OperationError(f"GET {key} retornou 404")
        return self.store[key]

    def put(self, key: str, payload: bytes) -> None:
        attempt = self.put_counts.get(key, 0)
        self.put_counts[key] = attempt + 1
        self.events.append(("put", key, publisher.sha256_bytes(payload)))
        error = self.put_errors.get((key, attempt))
        if error is not None:
            raise error
        self.store[key] = payload
        if key not in self.public_hold:
            self.public[key] = payload

    def copy(self, source_key: str, dest_key: str) -> None:
        if source_key not in self.store:
            raise publisher.OperationError(f"COPY {source_key} retornou 404")
        self.store[dest_key] = self.store[source_key]
        self.events.append(("copy", dest_key, publisher.sha256_bytes(self.store[dest_key])))

    def public_get(self, key: str) -> bytes:
        if key not in self.public:
            raise publisher.OperationError(f"GET público {key} retornou 404")
        return self.public[key]


class PublishSafetyTests(unittest.TestCase):
    def setUp(self) -> None:
        publisher.clear_secrets()
        publisher.silence_http_debug()

    def test_01_falha_no_primeiro_put(self) -> None:
        report, text, fake, originals, _optimized = self._publish(fail_put=(KEYS[0], 0))

        self.assertEqual(report["resultado"], "rollback_concluido")
        self.assertIn("ROLLBACK CONCLUÍDO", text)
        self.assertNotIn("ROLLBACK INCOMPLETO", text)
        self.assert_no_publicado(text)
        self.assertEqual(self._states(report), ["restaurado", "inalterado", "inalterado"])
        self.assertEqual(report["ainda_podem_estar_com_versao_nova"], [])
        self.assertEqual(fake.store[KEYS[0]], originals[KEYS[0]])
        self.assertEqual([key for _kind, key, _sha in fake.events if _kind == "put"], [KEYS[0], KEYS[0]])

    def test_02_falha_no_segundo_put(self) -> None:
        report, text, fake, originals, optimized = self._publish(fail_put=(KEYS[1], 0))

        self.assertEqual(report["resultado"], "rollback_concluido")
        self.assertIn("ROLLBACK CONCLUÍDO", text)
        self.assert_no_publicado(text)
        self.assertEqual(self._states(report), ["restaurado", "restaurado", "inalterado"])
        self.assertEqual(fake.store[KEYS[0]], originals[KEYS[0]])
        self.assertNotEqual(fake.store[KEYS[0]], optimized[KEYS[0]])
        self.assertEqual(fake.store[KEYS[2]], originals[KEYS[2]])
        put_keys = [key for kind, key, _sha in fake.events if kind == "put"]
        self.assertEqual(put_keys, [KEYS[0], KEYS[1], KEYS[0], KEYS[1]])

    def test_03_falha_no_terceiro_put(self) -> None:
        report, text, fake, originals, _optimized = self._publish(fail_put=(KEYS[2], 0))

        self.assertEqual(report["resultado"], "rollback_concluido")
        self.assertIn("ROLLBACK CONCLUÍDO", text)
        self.assert_no_publicado(text)
        self.assertEqual(self._states(report), ["restaurado", "restaurado", "restaurado"])
        self.assertEqual([fake.store[key] for key in KEYS], [originals[key] for key in KEYS])
        put_keys = [key for kind, key, _sha in fake.events if kind == "put"]
        self.assertEqual(put_keys, [KEYS[0], KEYS[1], KEYS[2], KEYS[0], KEYS[1], KEYS[2]])

    def test_04_falha_na_validacao_autenticada(self) -> None:
        report, text, fake, originals, _optimized = self._publish(bad_read=KEYS[1])

        self.assertEqual(report["resultado"], "rollback_concluido")
        self.assertIn("ROLLBACK CONCLUÍDO", text)
        self.assert_no_publicado(text)
        self.assertEqual(report["objetos"][1]["estado_publicacao"], "falha")
        self.assertEqual(report["objetos"][1]["verificacao_autenticada"], "confere")
        self.assertEqual(fake.put_counts.get(KEYS[2], 0), 0)
        self.assertEqual([fake.store[key] for key in KEYS], [originals[key] for key in KEYS])
        self.assertTrue(any("GET autenticado divergente" in error for error in report["erros"]))

    def test_05_cache_publico_antigo_nao_reverte(self) -> None:
        report, text, fake, originals, optimized = self._publish(hold_public=True)

        self.assertEqual(report["resultado"], "ok")
        self.assertNotIn("ROLLBACK", text)
        self.assert_no_publicado(text)
        self.assertIn("URL pública ainda serve o conteúdo anterior", text)
        self.assertEqual(report["ainda_podem_estar_com_versao_nova"], [])
        objects = report["objetos"]
        self.assertEqual(len(objects), len(KEYS))
        for item, key in zip(objects, KEYS):
            self.assertEqual(item["estado_publicacao"], "conferido")
            self.assertEqual(item["verificacao_autenticada"], "confere")
            self.assertEqual(item["verificacao_publica"], "cache_antigo")
            self.assertEqual(item["hash_bucket"], publisher.sha256_bytes(optimized[key]))
            self.assertEqual(item["hash_publico"], publisher.sha256_bytes(originals[key]))
            self.assertEqual(item["estado_rollback"], "nao_aplicavel")
        self.assertEqual([fake.put_counts[key] for key in KEYS], [1, 1, 1])
        self.assertEqual([fake.store[key] for key in KEYS], [optimized[key] for key in KEYS])
        self.assertEqual([fake.public[key] for key in KEYS], [originals[key] for key in KEYS])

    def test_06_falha_em_uma_restauracao_continua_as_demais(self) -> None:
        report, text, fake, originals, optimized = self._publish(
            bad_read=KEYS[2],
            fail_put=(KEYS[1], 1),
        )

        self.assertEqual(report["resultado"], "rollback_incompleto")
        self.assertIn("ROLLBACK INCOMPLETO", text)
        self.assertNotIn("ROLLBACK CONCLUÍDO", text)
        self.assert_no_publicado(text)
        self.assertEqual(self._states(report), ["restaurado", "ainda_versao_nova", "restaurado"])
        self.assertEqual(report["ainda_podem_estar_com_versao_nova"], [KEYS[1]])
        self.assertIn(f"{KEYS[1]}: ainda_versao_nova", text)
        self.assertIn("Ainda podem estar com a versão nova: " + KEYS[1], text)
        self.assertEqual(fake.store[KEYS[0]], originals[KEYS[0]])
        self.assertEqual(fake.store[KEYS[1]], optimized[KEYS[1]])
        self.assertEqual(fake.store[KEYS[2]], originals[KEYS[2]])
        put_keys = [key for kind, key, _sha in fake.events if kind == "put"]
        self.assertEqual(put_keys, [KEYS[0], KEYS[1], KEYS[2], KEYS[0], KEYS[1], KEYS[2]])

        command = self._rollback_command(fail_put=(KEYS[1], 0))
        self.assertEqual(command["report"]["resultado"], "rollback_incompleto")
        self.assertIn("ROLLBACK INCOMPLETO", command["text"])
        self.assert_no_publicado(command["text"])
        self.assertEqual(
            [item["estado_rollback"] for item in command["report"]["objetos"]],
            ["restaurado", "ainda_versao_nova", "restaurado"],
        )
        self.assertEqual(command["fake"].store[KEYS[1]], optimized[KEYS[1]])
        self.assertEqual(command["fake"].store[KEYS[0]], originals[KEYS[0]])
        self.assertEqual(command["fake"].store[KEYS[2]], originals[KEYS[2]])
        command_puts = [key for kind, key, _sha in command["fake"].events if kind == "put"]
        self.assertEqual(command_puts, list(KEYS))

    def test_07_rollback_recusa_hash_local_incorreto(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            specs, _fake, originals, _optimized, backup_dir, report_path = self._materials(root)
            self._write_manifest(backup_dir, "feels-test", specs, originals)
            tampered = backup_dir / KEYS[1].replace("/", "__")
            tampered.write_bytes(b"arquivo-adulterado")
            fake = FakeR2(originals)
            calls: list[str] = []

            def confirmer(expected: str, _prompt: str) -> None:
                calls.append(expected)

            report, text = self._run(
                lambda: publisher.rollback_run(
                    client=fake,
                    backup_dir=backup_dir,
                    report_path=report_path,
                    bucket="feels-test",
                    confirmer=confirmer,
                )
            )

        self.assertEqual(report["resultado"], "rollback_recusado")
        self.assertIn("hash divergente", text)
        self.assertIn("Nenhum objeto foi enviado", text)
        self.assertNotIn("ROLLBACK CONCLUÍDO", text)
        self.assert_no_publicado(text)
        self.assertEqual(fake.events, [])
        self.assertEqual(calls, [])

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            specs, _fake, originals, _optimized, backup_dir, report_path = self._materials(root)
            self._write_manifest(backup_dir, "feels-test", specs, originals)
            (backup_dir / KEYS[0].replace("/", "__")).unlink()
            fake = FakeR2(originals)
            report, text = self._run(
                lambda: publisher.rollback_run(
                    client=fake,
                    backup_dir=backup_dir,
                    report_path=report_path,
                    bucket="feels-test",
                    confirmer=lambda _expected, _prompt: None,
                )
            )
        self.assertEqual(report["resultado"], "rollback_recusado")
        self.assertIn("arquivo ausente", text)
        self.assertEqual(fake.events, [])

    def test_08_excecao_http_nao_vaza_segredo(self) -> None:
        publisher.register_secrets(ACCESS_KEY, SECRET_KEY, SIGNATURE)
        leaked = (
            f"falha {SECRET_KEY} Authorization: AWS4-HMAC-SHA256 "
            f"Credential={ACCESS_KEY}/20261113/auto/s3/aws4_request, "
            f"SignedHeaders=host, Signature={SIGNATURE} "
            f"AWS_SECRET_ACCESS_KEY={SECRET_KEY}"
        )
        report, text, _fake, _originals, _optimized = self._publish(
            fail_put=(KEYS[0], 0),
            error=RuntimeError(leaked),
        )
        report_text = json.dumps(report, ensure_ascii=False)
        combined = text + report_text
        for secret in (ACCESS_KEY, SECRET_KEY, SIGNATURE, "AWS4-HMAC-SHA256"):
            self.assertNotIn(secret, combined)
        self.assertNotIn("Authorization:", combined)
        self.assertIn("[redigido]", combined)
        self.assert_no_publicado(combined)
        self.assertEqual(report["resultado"], "rollback_concluido")

        source = SCRIPT.read_text()
        self.assertNotIn("publicado", source)
        self.assertNotIn("body[:", source)

        publisher.http.client.HTTPConnection.debuglevel = 1
        body = (
            b"AWS_SECRET_ACCESS_KEY="
            + SECRET_KEY.encode()
            + b" Authorization: AWS4-HMAC-SHA256 Credential="
            + ACCESS_KEY.encode()
            + b" Signature="
            + SIGNATURE.encode()
        )

        class Forbidden:
            def __init__(self, *_args, **_kwargs) -> None:
                if publisher.http.client.HTTPConnection.debuglevel != 0:
                    raise AssertionError("debug HTTP permaneceu ligado")

            def request(self, *_args, **_kwargs) -> None:
                return None

            def getresponse(self) -> object:
                return FakeResponse(403, body)

            def close(self) -> None:
                return None

        client = publisher.R2Client(
            "account",
            "feels-test",
            ACCESS_KEY,
            SECRET_KEY,
            connection_factory=Forbidden,
        )
        with self.assertRaises(publisher.OperationError) as caught:
            client.put(KEYS[0], b"optimized-1")
        rendered = "".join(
            traceback.format_exception(type(caught.exception), caught.exception, caught.exception.__traceback__)
        )
        self.assertIn("retornou 403", str(caught.exception))
        self.assert_secrets_absent(rendered)
        self.assertEqual(publisher.http.client.HTTPConnection.debuglevel, 0)

        class Exploding:
            def __init__(self, *_args, **_kwargs) -> None:
                return None

            def request(self, *_args, **_kwargs) -> None:
                raise RuntimeError(leaked)

            def close(self) -> None:
                return None

        publisher.http.client.HTTPConnection.debuglevel = 1
        exploding = publisher.R2Client(
            "account",
            "feels-test",
            ACCESS_KEY,
            SECRET_KEY,
            connection_factory=Exploding,
        )
        with self.assertRaises(publisher.OperationError) as caught:
            exploding.put(KEYS[0], b"optimized-1")
        rendered = "".join(
            traceback.format_exception(type(caught.exception), caught.exception, caught.exception.__traceback__)
        )
        self.assert_secrets_absent(rendered)
        self.assertIn("[redigido]", rendered)
        self.assertEqual(publisher.http.client.HTTPConnection.debuglevel, 0)
        self.assertIsNone(caught.exception.__cause__)

    def assert_no_publicado(self, text: str) -> None:
        self.assertNotIn("publicado", text.lower())

    def assert_secrets_absent(self, text: str) -> None:
        for secret in (ACCESS_KEY, SECRET_KEY, SIGNATURE, "AWS4-HMAC-SHA256", "Authorization:"):
            self.assertNotIn(secret, text)

    def _states(self, report: dict[str, object]) -> list[str]:
        return [str(item["estado_rollback"]) for item in report["objetos"]]  # type: ignore[index]

    def _publish(
        self,
        *,
        fail_put: tuple[str, int] | None = None,
        bad_read: str | None = None,
        hold_public: bool = False,
        error: BaseException | None = None,
    ) -> tuple[dict[str, object], str, FakeR2, dict[str, bytes], dict[str, bytes]]:
        with tempfile.TemporaryDirectory() as directory:
            specs, fake, originals, optimized, backup_dir, report_path = self._materials(Path(directory))
            if fail_put is not None:
                fake.put_errors[fail_put] = error or ConnectionError("falha de rede")
            if bad_read is not None:
                fake.bad_reads[bad_read] = 1
            if hold_public:
                fake.public_hold.update(KEYS)
            report, text = self._run(
                lambda: publisher.publish_run(
                    client=fake,
                    objects=specs,
                    backup_dir=backup_dir,
                    report_path=report_path,
                    bucket="feels-test",
                    confirmer=lambda _expected, _prompt: None,
                )
            )
            return report, text, fake, originals, optimized

    def _rollback_command(self, *, fail_put: tuple[str, int]) -> dict[str, object]:
        with tempfile.TemporaryDirectory() as directory:
            specs, _fake, originals, optimized, backup_dir, report_path = self._materials(Path(directory))
            self._write_manifest(backup_dir, "feels-test", specs, originals)
            fake = FakeR2(optimized)
            fake.put_errors[fail_put] = ConnectionError("falha de restauracao")
            report, text = self._run(
                lambda: publisher.rollback_run(
                    client=fake,
                    backup_dir=backup_dir,
                    report_path=report_path,
                    bucket="feels-test",
                    confirmer=lambda expected, _prompt: self.assertEqual(expected, "RESTAURAR"),
                )
            )
            return {"report": report, "text": text, "fake": fake}

    def _materials(
        self, root: Path
    ) -> tuple[list[publisher.ObjectSpec], FakeR2, dict[str, bytes], dict[str, bytes], Path, Path]:
        backup_dir = root / "backup"
        backup_dir.mkdir()
        originals: dict[str, bytes] = {}
        optimized: dict[str, bytes] = {}
        specs: list[publisher.ObjectSpec] = []
        for index, key in enumerate(KEYS, start=1):
            old = f"original-{index}".encode()
            new = f"optimized-{index}".encode()
            path = root / key.replace("/", "__")
            path.write_bytes(new)
            specs.append(publisher.ObjectSpec(key, path, len(new), publisher.sha256_bytes(new)))
            originals[key] = old
            optimized[key] = new
        return specs, FakeR2(originals), originals, optimized, backup_dir, root / "report.json"

    def _write_manifest(
        self,
        backup_dir: Path,
        bucket: str,
        specs: list[publisher.ObjectSpec],
        originals: dict[str, bytes],
    ) -> None:
        objects = []
        for spec in specs:
            filename = spec.key.replace("/", "__")
            payload = originals[spec.key]
            (backup_dir / filename).write_bytes(payload)
            objects.append(
                {
                    "chave": spec.key,
                    "arquivo": filename,
                    "hash_original": publisher.sha256_bytes(payload),
                    "tamanho_original": len(payload),
                    "hash_otimizado": spec.sha256,
                    "tamanho_otimizado": spec.size,
                }
            )
        (backup_dir / "manifest.json").write_text(
            json.dumps({"criado_em": "2026-11-13T00:00:00Z", "bucket": bucket, "objetos": objects})
        )

    def _run(self, operation: object) -> tuple[dict[str, object], str]:
        stdout = io.StringIO()
        stderr = io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            report = operation()  # type: ignore[operator]
        text = stdout.getvalue() + stderr.getvalue()
        self.assertNotIn(SECRET_KEY, text)
        self.assertNotIn(ACCESS_KEY, text)
        self.assertIsInstance(report, dict)
        self.assertIn("criado_em", report)
        self.assertEqual(report["bucket"], "feels-test")
        return report, text


class RemoteBackupClient:
    def __init__(self, source: bytes, dest: bytes | None = None) -> None:
        self.source_key = "menu/espresso-duplo.mp4"
        self.dest_key = publisher.ROLLBACK_PREFIX + self.source_key
        self.store = {self.source_key: source}
        if dest is not None:
            self.store[self.dest_key] = dest
        self.events: list[str] = []
        self.fail_copies = 0
        self.write_before_timeout = False
        self.probe_timeouts = 0

    def head(self, key: str) -> dict[str, str]:
        self._probe("head", key)
        if key not in self.store:
            raise publisher.OperationError(f"HEAD {key} retornou 404")
        return {"content-length": str(len(self.store[key]))}

    def get(self, key: str) -> bytes:
        self._probe("get", key)
        if key not in self.store:
            raise publisher.OperationError(f"GET {key} retornou 404")
        return self.store[key]

    def put(self, key: str, payload: bytes) -> None:
        raise AssertionError(f"PUT de produção não permitido: {key} {len(payload)}")

    def copy(self, source_key: str, dest_key: str) -> None:
        self.events.append(f"copy {dest_key}")
        if self.fail_copies > 0:
            self.fail_copies -= 1
            if self.write_before_timeout:
                self.store[dest_key] = self.store[source_key]
            raise publisher.OperationError("PUT /bucket/key: timeout: The read operation timed out")
        self.store[dest_key] = self.store[source_key]

    def _probe(self, kind: str, key: str) -> None:
        copy_started = any(event.startswith("copy ") for event in self.events)
        if key == self.dest_key and copy_started and self.probe_timeouts > 0:
            self.probe_timeouts -= 1
            self.events.append(f"{kind} timeout {key}")
            raise publisher.OperationError(f"{kind.upper()} {key}: timeout: The read operation timed out")
        self.events.append(f"{kind} {key}")


class RemoteBackupTests(unittest.TestCase):
    def setUp(self) -> None:
        publisher.clear_secrets()
        self.source = b"original-backup"
        self.expected = publisher.sha256_bytes(self.source)

    def test_timeout_before_backup_is_stored(self) -> None:
        client = RemoteBackupClient(self.source)
        client.fail_copies = 1
        outcome = publisher.ensure_remote_backup(
            client,
            client.source_key,
            client.dest_key,
            self.expected,
            len(self.source),
            sleep=lambda _seconds: None,
        )
        self.assertEqual(outcome, "gravado")
        self.assertEqual(client.store[client.dest_key], self.source)
        self.assertEqual(client.events.count(f"copy {client.dest_key}"), 2)
        self.assertEqual(client.store[client.source_key], self.source)

    def test_timeout_after_backup_is_stored(self) -> None:
        client = RemoteBackupClient(self.source)
        client.fail_copies = 1
        client.write_before_timeout = True
        outcome = publisher.ensure_remote_backup(
            client,
            client.source_key,
            client.dest_key,
            self.expected,
            len(self.source),
            sleep=lambda _seconds: None,
        )
        self.assertEqual(outcome, "gravado")
        self.assertEqual(client.events.count(f"copy {client.dest_key}"), 1)
        self.assertEqual(client.store[client.dest_key], self.source)

    def test_retry_reads_before_copying_again(self) -> None:
        client = RemoteBackupClient(self.source)
        client.fail_copies = 1
        client.probe_timeouts = 1
        outcome = publisher.ensure_remote_backup(
            client,
            client.source_key,
            client.dest_key,
            self.expected,
            len(self.source),
            sleep=lambda _seconds: None,
        )
        self.assertEqual(outcome, "gravado")
        copy_at = [index for index, event in enumerate(client.events) if event.startswith("copy ")]
        timeout_at = [index for index, event in enumerate(client.events) if "timeout" in event]
        self.assertEqual(len(copy_at), 2)
        self.assertTrue(timeout_at)
        self.assertLess(copy_at[0], timeout_at[0])
        self.assertLess(timeout_at[0], copy_at[1])
        self.assertIn(f"head {client.dest_key}", client.events[timeout_at[0] + 1])

    def test_existing_backup_with_matching_hash_is_reused(self) -> None:
        client = RemoteBackupClient(self.source, dest=self.source)
        outcome = publisher.ensure_remote_backup(
            client,
            client.source_key,
            client.dest_key,
            self.expected,
            len(self.source),
            sleep=lambda _seconds: None,
        )
        self.assertEqual(outcome, "reutilizado")
        self.assertNotIn(f"copy {client.dest_key}", client.events)
        self.assertEqual(list(client.store), [client.source_key, client.dest_key])

    def test_existing_backup_with_wrong_hash_is_replaced_in_place(self) -> None:
        client = RemoteBackupClient(self.source, dest=b"backup-errado")
        outcome = publisher.ensure_remote_backup(
            client,
            client.source_key,
            client.dest_key,
            self.expected,
            len(self.source),
            sleep=lambda _seconds: None,
        )
        self.assertEqual(outcome, "gravado")
        self.assertEqual(client.events.count(f"copy {client.dest_key}"), 1)
        self.assertEqual(client.store[client.dest_key], self.source)
        self.assertEqual(list(client.store), [client.source_key, client.dest_key])

    def test_local_backup_is_reused_and_production_is_not_downloaded_again(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            specs, fake, originals, _optimized, backup_dir, report_path = PublishSafetyTests._materials(
                PublishSafetyTests(), root
            )
            PublishSafetyTests._write_manifest(PublishSafetyTests(), backup_dir, "feels-test", specs, originals)
            preserved = (backup_dir / KEYS[0].replace("/", "__")).read_bytes()
            gets: list[str] = []
            original_get = fake.get

            def tracing_get(key: str) -> bytes:
                gets.append(key)
                return original_get(key)

            def confirmer(expected: str, _prompt: str) -> None:
                if expected == "PUBLICAR":
                    raise publisher.Stop("confirmação PUBLICAR recusada")

            fake.get = tracing_get  # type: ignore[method-assign]
            report, text = PublishSafetyTests._run(
                PublishSafetyTests(),
                lambda: publisher.publish_run(
                    client=fake,
                    objects=specs,
                    backup_dir=backup_dir,
                    report_path=report_path,
                    bucket="feels-test",
                    confirmer=confirmer,
                ),
            )
            self.assertEqual((backup_dir / KEYS[0].replace("/", "__")).read_bytes(), preserved)
        self.assertEqual(report["resultado"], "falha_antes_da_substituicao")
        self.assertIn("PUBLICAR", text)
        self.assertNotIn(KEYS[0], gets)
        self.assertFalse(any(event[0] == "put" for event in fake.events))
        self.assertTrue(any(event[1].startswith(publisher.ROLLBACK_PREFIX) for event in fake.events if event[0] == "copy"))

    def test_connect_and_read_timeouts_are_separate(self) -> None:
        seen: dict[str, object] = {}

        class Sock:
            def __init__(self) -> None:
                self.timeout = None

            def settimeout(self, value: float) -> None:
                self.timeout = value

            def setsockopt(self, *_args: object) -> None:
                return None

        def fake_connect(self: object) -> None:
            seen["connect_timeout"] = getattr(self, "timeout")
            setattr(self, "sock", Sock())

        original = publisher.http.client.HTTPConnection.connect
        publisher.http.client.HTTPConnection.connect = fake_connect  # type: ignore[method-assign]
        try:
            connection = publisher.BoundedHTTPSConnection("example.r2.cloudflarestorage.com")
            connection._context.wrap_socket = lambda sock, server_hostname=None: sock  # type: ignore[method-assign]
            connection.connect()
        finally:
            publisher.http.client.HTTPConnection.connect = original  # type: ignore[method-assign]
        self.assertEqual(seen["connect_timeout"], publisher.CONNECT_TIMEOUT_SECONDS)
        self.assertEqual(connection.sock.timeout, publisher.READ_TIMEOUT_SECONDS)
        self.assertEqual(publisher.CONNECT_TIMEOUT_SECONDS, 10)
        self.assertEqual(publisher.READ_TIMEOUT_SECONDS, 180)


class FakeResponse:
    def __init__(self, status: int, body: bytes) -> None:
        self.status = status
        self._body = body

    def read(self) -> bytes:
        return self._body

    def getheaders(self) -> list[tuple[str, str]]:
        return []


if __name__ == "__main__":
    unittest.main(verbosity=2)
