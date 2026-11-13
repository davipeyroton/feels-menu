#!/usr/bin/env python3
"""Publish the three validated Feels Menu MP4s to the existing R2 keys.

This script does not read .env files and does not print credentials.
Pass them only in the current shell, for example:

  read -r R2_ACCOUNT_ID
  read -r R2_BUCKET
  read -r AWS_ACCESS_KEY_ID
  read -s AWS_SECRET_ACCESS_KEY
  echo
  export R2_ACCOUNT_ID R2_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
  python3 scripts/publish-r2-videos.py

Do not put those values in the command line, a committed file, or shell history.
`read -s` keeps the secret out of the terminal echo. Close the shell when finished
so the variables disappear.

Modes:
  python3 scripts/publish-r2-videos.py --check-local
  python3 scripts/publish-r2-videos.py
  python3 scripts/publish-r2-videos.py --rollback

The authenticated bucket read is the proof that a write landed. A stale public
URL is recorded and does not restore production. If a production write may have
landed and a later step fails, every possibly modified object is restored.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import http.client
import json
import re
import socket
import sys
import time
import urllib.parse
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

PUBLIC_ORIGIN = "https://pub-be112af91ac14243a02460c769b4037c.r2.dev"
CONTENT_TYPE = "video/mp4"
CACHE_CONTROL = "public, max-age=3600"
ROLLBACK_PREFIX = "_rollback/20261113/"
# One socket timeout used to cover both connect and read. The failed run stalled
# for the whole 120s while reading the first remote-backup response.
CONNECT_TIMEOUT_SECONDS = 10
READ_TIMEOUT_SECONDS = 180
BACKUP_READ_ATTEMPTS = 3
BACKUP_COPY_ATTEMPTS = 3
PUBLIC_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
)

ROOT = Path(__file__).resolve().parents[1]
BACKUP_DIR = ROOT / "tmp" / "video-optimization" / "rollback" / "20261113"
REPORT_PATH = ROOT / "tmp" / "video-optimization" / "publish-report.json"

# Sizes and hashes of the validated local encodes. A different file must not be published.
OBJECTS = (
    {
        "key": "brand/intro-menu.mp4",
        "local": ROOT / "tmp" / "video-optimization" / "out" / "intro-menu.mp4",
        "size": 1631792,
        "sha256": "bc097121c03c1ec1daabbb2b3c9d6cdf923b36af7e77b719e0ba6263f947c88e",
    },
    {
        "key": "menu/espresso-duplo.mp4",
        "local": ROOT / "tmp" / "video-optimization" / "out" / "espresso-duplo.mp4",
        "size": 2237297,
        "sha256": "49c8b442739e8d53beaaf5f8eb2ff09bfda5874f5c1ed61daea9c952b15ccf12",
    },
    {
        "key": "menu/cappuccino.mp4",
        "local": ROOT / "tmp" / "video-optimization" / "out" / "cappuccino.mp4",
        "size": 1118866,
        "sha256": "759ddc4bfe3643e74ce0a6c1864c85181d9bca37352ed928ea91b8c98abec0e0",
    },
)

PROVEN_ROLLBACK = {"restaurado", "inalterado"}
RISKY_ROLLBACK = {"ainda_versao_nova", "verificacao_falhou", "divergente"}
_SECRET_PATTERNS = (
    re.compile(r"(?i)authorization\s*[:=].*"),
    re.compile(r"(?i)aws4-hmac-sha256\S*"),
    re.compile(r"(?i)credential=[^\s,]+"),
    re.compile(r"(?i)signature=[0-9a-f]+"),
    re.compile(r"(?i)signedheaders=[^\s,]+"),
    re.compile(r"(?i)aws_secret_access_key\s*[=:]\s*\S+"),
    re.compile(r"(?i)aws_access_key_id\s*[=:]\s*\S+"),
    re.compile(r"(?i)x-amz-security-token\s*[=:]\s*\S+"),
)
_SECRETS: list[str] = []
Confirmer = Callable[[str, str], None]


class Stop(Exception):
    pass


class OperationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(sanitize(message))


def silence_http_debug() -> None:
    http.client.HTTPConnection.debuglevel = 0
    http.client.HTTPSConnection.debuglevel = 0


silence_http_debug()


def register_secrets(*values: str) -> None:
    for value in values:
        if value and len(value) >= 8 and value not in _SECRETS:
            _SECRETS.append(value)


def clear_secrets() -> None:
    _SECRETS.clear()


def sanitize(text: str) -> str:
    redacted = str(text)
    for secret in sorted(_SECRETS, key=len, reverse=True):
        redacted = redacted.replace(secret, "[redigido]")
    for pattern in _SECRET_PATTERNS:
        redacted = pattern.sub("[redigido]", redacted)
    return redacted


def describe(error: BaseException) -> str:
    return sanitize(f"{type(error).__name__}: {error}")


def say(message: str, *, error: bool = False) -> None:
    print(sanitize(message), file=sys.stderr if error else sys.stdout)


def fail(message: str) -> None:
    raise Stop(sanitize(message))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def encode_key(key: str) -> str:
    return "/".join(urllib.parse.quote(part, safe="-_.~") for part in key.split("/"))


def backup_filename(key: str) -> str:
    parts = key.split("/")
    if not key or key.startswith("/") or any(part in {"", ".", ".."} for part in parts):
        raise OperationError("chave de objeto inválida")
    return key.replace("/", "__")


def request_confirm(expected: str, prompt: str) -> None:
    if not sys.stdin.isatty():
        fail("confirmação exigida em um terminal interativo")
    typed = input(prompt)
    if typed != expected:
        fail("confirmação recusada; nenhum objeto de produção foi alterado")


def sign(
    *,
    method: str,
    canonical_uri: str,
    headers: dict[str, str],
    payload_hash: str,
    access_key: str,
    secret_key: str,
    amz_date: str,
) -> str:
    signed = sorted(headers)
    canonical_headers = "".join(f"{name}:{headers[name].strip()}\n" for name in signed)
    canonical_request = "\n".join(
        (
            method,
            canonical_uri,
            "",
            canonical_headers,
            ";".join(signed),
            payload_hash,
        )
    )
    datestamp = amz_date[:8]
    scope = f"{datestamp}/auto/s3/aws4_request"
    string_to_sign = "\n".join(
        (
            "AWS4-HMAC-SHA256",
            amz_date,
            scope,
            hashlib.sha256(canonical_request.encode()).hexdigest(),
        )
    )

    def keyed(key: bytes, message: str) -> bytes:
        return hmac.new(key, message.encode(), hashlib.sha256).digest()

    signing_key = keyed(
        keyed(keyed(keyed(("AWS4" + secret_key).encode(), datestamp), "auto"), "s3"),
        "aws4_request",
    )
    signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()
    return (
        "AWS4-HMAC-SHA256 "
        f"Credential={access_key}/{scope}, "
        f"SignedHeaders={';'.join(signed)}, "
        f"Signature={signature}"
    )


class BoundedHTTPSConnection(http.client.HTTPSConnection):
    """Connect quickly, then wait longer for an SSL read to return bytes."""

    def connect(self) -> None:
        self.timeout = CONNECT_TIMEOUT_SECONDS
        super().connect()
        if self.sock is not None:
            self.sock.settimeout(READ_TIMEOUT_SECONDS)


def s3_request(
    *,
    account_id: str,
    method: str,
    canonical_uri: str,
    payload: bytes,
    access_key: str,
    secret_key: str,
    extra_headers: dict[str, str] | None = None,
    connection_factory: Callable[..., http.client.HTTPConnection] | None = None,
) -> tuple[int, dict[str, str], bytes]:
    silence_http_debug()
    host = f"{account_id}.r2.cloudflarestorage.com"
    payload_hash = sha256_bytes(payload)
    amz_date = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    headers = {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    if extra_headers:
        headers.update({name.lower(): value for name, value in extra_headers.items()})
    authorization = sign(
        method=method,
        canonical_uri=canonical_uri,
        headers=dict(headers),
        payload_hash=payload_hash,
        access_key=access_key,
        secret_key=secret_key,
        amz_date=amz_date,
    )
    wire_headers = {**extra_headers} if extra_headers else {}
    wire_headers.update(
        {
            "Host": host,
            "x-amz-content-sha256": payload_hash,
            "x-amz-date": amz_date,
            "Authorization": authorization,
        }
    )
    factory = connection_factory or BoundedHTTPSConnection
    connection = None
    try:
        connection = factory(host, timeout=CONNECT_TIMEOUT_SECONDS)
        connection.request(method, canonical_uri, body=payload, headers=wire_headers)
        response = connection.getresponse()
        body = response.read()
        response_headers = {name.lower(): value for name, value in response.getheaders()}
        return response.status, response_headers, body
    except OperationError:
        raise
    except Exception as error:
        raise OperationError(f"{method} {canonical_uri}: {describe(error)}") from None
    finally:
        if connection is not None:
            connection.close()


def object_uri(bucket: str, key: str) -> str:
    return f"/{encode_key(bucket)}/{encode_key(key)}"


class R2Client:
    """S3 client. Authentication material stays inside the signed request."""

    def __init__(
        self,
        account_id: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        connection_factory: Callable[..., http.client.HTTPConnection] | None = None,
    ) -> None:
        register_secrets(access_key, secret_key)
        self.account_id = account_id
        self.bucket = bucket
        self._access_key = access_key
        self._secret_key = secret_key
        self._connection_factory = connection_factory

    def head(self, key: str) -> dict[str, str]:
        status, headers, _body = self._call("HEAD", key, b"")
        if status != 200:
            raise OperationError(f"HEAD {key} retornou {status}")
        return headers

    def get(self, key: str) -> bytes:
        status, headers, body = self._call("GET", key, b"")
        if status != 200:
            raise OperationError(f"GET {key} retornou {status}")
        length = headers.get("content-length")
        if length is not None and length.isdigit() and int(length) != len(body):
            raise OperationError(f"GET {key} com tamanho divergente")
        return body

    def put(self, key: str, payload: bytes) -> None:
        status, _headers, _body = self._call(
            "PUT",
            key,
            payload,
            {"content-type": CONTENT_TYPE, "cache-control": CACHE_CONTROL},
        )
        if status not in (200, 201):
            raise OperationError(f"PUT {key} retornou {status}")

    def copy(self, source_key: str, dest_key: str) -> None:
        source = f"/{self.bucket}/{source_key}"
        status, _headers, _body = self._call(
            "PUT",
            dest_key,
            b"",
            {"x-amz-copy-source": urllib.parse.quote(source, safe="/")},
        )
        if status not in (200, 201):
            raise OperationError(f"COPY {source_key} retornou {status}")

    def public_get(self, key: str) -> bytes:
        silence_http_debug()
        url = urllib.parse.urlsplit(f"{PUBLIC_ORIGIN}/{encode_key(key)}")
        request_target = url.path or "/"
        connection = None
        try:
            connection = BoundedHTTPSConnection(url.hostname, timeout=CONNECT_TIMEOUT_SECONDS)
            connection.request(
                "GET",
                request_target,
                headers={
                    "User-Agent": PUBLIC_UA,
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache",
                },
            )
            response = connection.getresponse()
            body = response.read()
            if response.status != 200:
                raise OperationError(f"GET público {key} retornou {response.status}")
            return body
        except OperationError:
            raise
        except Exception as error:
            raise OperationError(f"GET público {key}: {describe(error)}") from None
        finally:
            if connection is not None:
                connection.close()

    def _call(
        self,
        method: str,
        key: str,
        payload: bytes,
        extra_headers: dict[str, str] | None = None,
    ) -> tuple[int, dict[str, str], bytes]:
        try:
            return s3_request(
                account_id=self.account_id,
                method=method,
                canonical_uri=object_uri(self.bucket, key),
                payload=payload,
                access_key=self._access_key,
                secret_key=self._secret_key,
                extra_headers=extra_headers,
                connection_factory=self._connection_factory,
            )
        except OperationError:
            raise
        except Exception as error:
            raise OperationError(f"{method} {key}: {describe(error)}") from None


def require_env() -> tuple[str, str, str, str]:
    import os

    names = ("R2_ACCOUNT_ID", "R2_BUCKET", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY")
    missing = [name for name in names if not os.environ.get(name, "").strip()]
    if missing:
        fail("variáveis ausentes: " + ", ".join(missing))
    account_id, bucket, access_key, secret_key = (os.environ[name].strip() for name in names)
    if "/" in bucket or " " in bucket or "/" in account_id or not bucket or not account_id:
        fail("R2_ACCOUNT_ID ou R2_BUCKET inválido")
    register_secrets(access_key, secret_key)
    say(f"Destino: account {account_id}, bucket {bucket}")
    return account_id, bucket, access_key, secret_key


@dataclass(frozen=True)
class ObjectSpec:
    key: str
    local: Path
    size: int
    sha256: str


@dataclass
class Tracked:
    key: str
    local: Path
    optimized_sha256: str
    optimized_size: int
    original_sha256: Optional[str] = None
    original_size: Optional[int] = None
    backup_path: Optional[Path] = None
    publish_state: str = "nao_iniciado"
    rollback_state: str = "nao_aplicavel"
    authenticated_verification: str = "nao_executada"
    public_verification: str = "nao_executada"
    bucket_sha256: Optional[str] = None
    public_sha256: Optional[str] = None
    errors: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def as_dict(self, *, rollback_ran: bool) -> dict[str, object]:
        risky = rollback_ran and self.rollback_state in RISKY_ROLLBACK
        return {
            "chave": self.key,
            "hash_original": self.original_sha256,
            "hash_otimizado": self.optimized_sha256,
            "estado_publicacao": self.publish_state,
            "estado_rollback": self.rollback_state,
            "verificacao_autenticada": self.authenticated_verification,
            "verificacao_publica": self.public_verification,
            "hash_bucket": self.bucket_sha256,
            "hash_publico": self.public_sha256,
            "pode_estar_com_versao_nova": risky,
            "erros": list(self.errors),
            "avisos": list(self.notes),
        }


def production_specs() -> tuple[ObjectSpec, ...]:
    return tuple(
        ObjectSpec(
            key=str(item["key"]),
            local=Path(item["local"]),
            size=int(item["size"]),
            sha256=str(item["sha256"]),
        )
        for item in OBJECTS
    )


def validate_spec(spec: ObjectSpec) -> None:
    if not spec.local.is_file():
        raise OperationError(f"arquivo local ausente: {spec.local.name}")
    size = spec.local.stat().st_size
    digest = sha256_file(spec.local)
    if size != spec.size or digest != spec.sha256:
        raise OperationError(
            f"{spec.local.name} não é a versão validada (tamanho {size}, sha256 {digest})"
        )


def check_local() -> None:
    for spec in production_specs():
        validate_spec(spec)
        say(f"local ok {spec.key} {spec.size} {spec.sha256}")


def now_stamp() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def blank_report(bucket: str, mode: str) -> dict[str, object]:
    return {
        "criado_em": now_stamp(),
        "bucket": bucket,
        "modo": mode,
        "resultado": "",
        "origem_publica": PUBLIC_ORIGIN,
        "prefixo_rollback": ROLLBACK_PREFIX,
        "objetos": [],
        "erros": [],
        "ainda_podem_estar_com_versao_nova": [],
    }


def scrub(value: object) -> object:
    if isinstance(value, str):
        return sanitize(value)
    if isinstance(value, list):
        return [scrub(item) for item in value]
    if isinstance(value, dict):
        return {key: scrub(item) for key, item in value.items()}
    return value


def emit(report: dict[str, object]) -> None:
    for item in report["objetos"]:
        assert isinstance(item, dict)
        for note in item["avisos"]:
            say(f"AVISO: {item['chave']}: {note}")
        for problem in item["erros"]:
            say(f"ERRO: {item['chave']}: {problem}", error=True)
    for problem in report["erros"]:
        say(f"ERRO: {problem}", error=True)

    outcome = report["resultado"]
    if outcome == "ok":
        for item in report["objetos"]:
            assert isinstance(item, dict)
            say(
                f"bucket conferido {item['chave']} "
                f"{item['verificacao_autenticada']} {item['hash_bucket']}"
            )
        say("Gravação conferida no bucket.")
        return

    if outcome == "rollback_concluido":
        if report["modo"] == "publish":
            say("A gravação não foi concluída.", error=True)
        say("ROLLBACK CONCLUÍDO")
        for item in report["objetos"]:
            assert isinstance(item, dict)
            say(f"{item['chave']}: {item['estado_rollback']}")
        return

    if outcome == "rollback_incompleto":
        say("A gravação não foi concluída.", error=True)
        say("ROLLBACK INCOMPLETO", error=True)
        for item in report["objetos"]:
            assert isinstance(item, dict)
            suffix = ""
            if item["pode_estar_com_versao_nova"]:
                suffix = "; pode estar com a versão nova"
            say(f"{item['chave']}: {item['estado_rollback']}{suffix}", error=True)
        pending = report["ainda_podem_estar_com_versao_nova"]
        say("Ainda podem estar com a versão nova: " + ", ".join(pending), error=True)
        return

    if outcome == "rollback_recusado":
        say("Restauração recusada. Nenhum objeto foi enviado.", error=True)
        return

    say("Nenhum objeto de produção foi substituído.", error=True)


def write_report(report: dict[str, object], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    say(f"relatório {path}")


def finish(report: dict[str, object], tracked: Sequence[Tracked], path: Path, *, rollback_ran: bool) -> dict[str, object]:
    report["objetos"] = [item.as_dict(rollback_ran=rollback_ran) for item in tracked]
    report["ainda_podem_estar_com_versao_nova"] = [
        item.key for item in tracked if rollback_ran and item.rollback_state in RISKY_ROLLBACK
    ]
    scrubbed = scrub(report)
    assert isinstance(scrubbed, dict)
    emit(scrubbed)
    write_report(scrubbed, path)
    return scrubbed


def backoff_seconds(attempt: int) -> float:
    return min(8.0, 0.5 * (2 ** attempt))


def is_timeout(error: BaseException) -> bool:
    if isinstance(error, (TimeoutError, socket.timeout)):
        return True
    text = str(error).lower()
    return "timed out" in text or "timeout" in text


def is_not_found(error: BaseException) -> bool:
    return "404" in str(error)


def is_transient(error: BaseException) -> bool:
    if is_timeout(error):
        return True
    text = str(error).lower()
    transient_marks = (
        "retornou 500",
        "retornou 502",
        "retornou 503",
        "retornou 429",
        "connection reset",
        "remote end closed",
        "temporarily unavailable",
    )
    return any(mark in text for mark in transient_marks)


def observe_remote(
    client: object,
    key: str,
    expected_sha: str,
    expected_size: int,
    sleep: Callable[[float], None],
) -> tuple[str, Optional[str], Optional[int]]:
    """Return match, missing, mismatch, or unknown without writing."""
    for attempt in range(BACKUP_READ_ATTEMPTS):
        try:
            headers = client.head(key)  # type: ignore[attr-defined]
        except Exception as error:
            if is_not_found(error):
                return "missing", None, None
            if is_transient(error) and attempt + 1 < BACKUP_READ_ATTEMPTS:
                sleep(backoff_seconds(attempt))
                continue
            if is_transient(error):
                return "unknown", None, None
            raise
        length_text = str(headers.get("content-length", ""))
        if length_text.isdigit() and int(length_text) != expected_size:
            return "mismatch", None, int(length_text)
        try:
            body = client.get(key)  # type: ignore[attr-defined]
        except Exception as error:
            if is_not_found(error):
                return "missing", None, None
            if is_transient(error) and attempt + 1 < BACKUP_READ_ATTEMPTS:
                sleep(backoff_seconds(attempt))
                continue
            if is_transient(error):
                return "unknown", None, None
            raise
        digest = sha256_bytes(body)
        if digest == expected_sha and len(body) == expected_size:
            return "match", digest, len(body)
        return "mismatch", digest, len(body)
    return "unknown", None, None


def ensure_remote_backup(
    client: object,
    source_key: str,
    dest_key: str,
    expected_sha: str,
    expected_size: int,
    sleep: Callable[[float], None] = time.sleep,
) -> str:
    """Copy onto one fixed key. A timed-out copy is checked before another copy."""
    copied = False
    for attempt in range(BACKUP_COPY_ATTEMPTS):
        state, _digest, _size = observe_remote(client, dest_key, expected_sha, expected_size, sleep)
        if state == "match":
            return "reutilizado" if not copied else "gravado"
        if state == "unknown":
            raise OperationError(
                f"backup remoto {dest_key} indeterminado após timeout de leitura; "
                "nenhuma cópia adicional foi feita"
            )
        try:
            client.copy(source_key, dest_key)  # type: ignore[attr-defined]
        except Exception as error:
            if not is_transient(error):
                raise
            copied = True
            sleep(backoff_seconds(attempt))
            continue
        copied = True
    state, _digest, _size = observe_remote(client, dest_key, expected_sha, expected_size, sleep)
    if state == "match":
        return "gravado"
    if state == "unknown":
        raise OperationError(
            f"backup remoto {dest_key} indeterminado após timeout de leitura; "
            "nenhuma cópia adicional foi feita"
        )
    raise OperationError(f"backup remoto divergente {dest_key}")


def preserved_backup(backup_dir: Path, bucket: str, key: str) -> Optional[tuple[Path, str, int]]:
    manifest_path = backup_dir / "manifest.json"
    path = backup_dir / backup_filename(key)
    if not manifest_path.is_file() or not path.is_file():
        return None
    try:
        manifest = json.loads(manifest_path.read_text())
    except json.JSONDecodeError:
        return None
    if not isinstance(manifest, dict) or manifest.get("bucket") != bucket:
        return None
    objects = manifest.get("objetos")
    if not isinstance(objects, list):
        return None
    for entry in objects:
        if not isinstance(entry, dict) or entry.get("chave") != key:
            continue
        expected_name = backup_filename(key)
        if entry.get("arquivo") != expected_name:
            return None
        expected_sha = str(entry.get("hash_original", ""))
        expected_size = entry.get("tamanho_original")
        if not isinstance(expected_size, int) or expected_size < 0:
            return None
        if path.stat().st_size != expected_size or sha256_file(path) != expected_sha:
            return None
        return path, expected_sha, expected_size
    return None


def confirm_production_size(
    client: object,
    key: str,
    expected_size: int,
    sleep: Callable[[float], None],
) -> None:
    for attempt in range(BACKUP_READ_ATTEMPTS):
        try:
            headers = client.head(key)  # type: ignore[attr-defined]
        except Exception as error:
            if is_transient(error) and attempt + 1 < BACKUP_READ_ATTEMPTS:
                sleep(backoff_seconds(attempt))
                continue
            raise
        length_text = str(headers.get("content-length", ""))
        if not length_text.isdigit():
            raise OperationError(f"HEAD sem Content-Length para {key}")
        if int(length_text) != expected_size:
            raise OperationError(
                f"{key}: produção tem {length_text} bytes; o backup local tem {expected_size} e foi preservado"
            )
        return
    raise OperationError(f"HEAD {key} não respondeu")


def store_backup(path: Path, body: bytes) -> str:
    digest = sha256_bytes(body)
    if path.exists():
        current = sha256_file(path)
        if current != digest:
            raise OperationError(f"backup local preservado difere do download: {path.name}")
        return current
    temporary = path.with_name(path.name + ".partial")
    temporary.write_bytes(body)
    try:
        if sha256_file(temporary) != digest:
            raise OperationError(f"falha ao gravar backup local de {path.name}")
        temporary.replace(path)
    except Exception:
        if temporary.exists():
            temporary.unlink()
        raise
    return digest


def record_public(client: object, tracked: Tracked) -> None:
    try:
        body = client.public_get(tracked.key)  # type: ignore[attr-defined]
    except Exception as error:
        tracked.public_verification = "erro"
        tracked.notes.append(f"leitura pública falhou: {describe(error)}")
        return
    digest = sha256_bytes(body)
    tracked.public_sha256 = digest
    if digest == tracked.optimized_sha256:
        tracked.public_verification = "atualizado"
        return
    if digest == tracked.original_sha256:
        tracked.public_verification = "cache_antigo"
        tracked.notes.append(
            "URL pública ainda serve o conteúdo anterior. "
            "O bucket está correto e a restauração não foi iniciada."
        )
        return
    tracked.public_verification = "divergente"
    tracked.notes.append(
        "URL pública serve conteúdo diferente do bucket e do backup. "
        "O bucket está correto e a restauração não foi iniciada."
    )


def restore_all(client: object, tracked: Sequence[Tracked], keys: Sequence[str]) -> bool:
    selected = set(keys)
    put_errors: dict[str, str] = {}
    for item in tracked:
        if item.key not in selected:
            continue
        try:
            if item.backup_path is None or item.original_sha256 is None or item.original_size is None:
                raise OperationError(f"backup local ausente para {item.key}")
            payload = item.backup_path.read_bytes()
            digest = sha256_bytes(payload)
            if digest != item.original_sha256 or len(payload) != item.original_size:
                raise OperationError(f"backup local divergente para {item.key}")
            client.put(item.key, payload)  # type: ignore[attr-defined]
        except Exception as error:
            put_errors[item.key] = describe(error)

    proven = True
    for item in tracked:
        try:
            body = client.get(item.key)  # type: ignore[attr-defined]
        except Exception as error:
            item.rollback_state = "verificacao_falhou"
            item.authenticated_verification = "erro"
            item.errors.append(describe(error))
            if item.key in put_errors:
                item.errors.append(put_errors[item.key])
            proven = False
            continue
        digest = sha256_bytes(body)
        item.bucket_sha256 = digest
        if item.original_sha256 is not None and digest == item.original_sha256 and len(body) == item.original_size:
            item.rollback_state = "restaurado" if item.key in selected else "inalterado"
            item.authenticated_verification = "confere"
            if item.key in put_errors:
                item.notes.append(
                    "A escrita da restauração falhou, mas o GET autenticado confere com o backup."
                )
            continue
        proven = False
        item.authenticated_verification = "divergente"
        if digest == item.optimized_sha256 and len(body) == item.optimized_size:
            item.rollback_state = "ainda_versao_nova"
        else:
            item.rollback_state = "divergente"
        if item.key in put_errors:
            item.errors.append(put_errors[item.key])
    return proven


def publish_run(
    *,
    client: object,
    objects: Sequence[ObjectSpec],
    backup_dir: Path,
    report_path: Path,
    bucket: str,
    confirmer: Confirmer,
) -> dict[str, object]:
    silence_http_debug()
    report = blank_report(bucket, "publish")
    tracked = [
        Tracked(
            key=spec.key,
            local=spec.local,
            optimized_sha256=spec.sha256,
            optimized_size=spec.size,
        )
        for spec in objects
    ]
    possibly_modified: list[str] = []
    try:
        for item in tracked:
            validate_spec(
                ObjectSpec(item.key, item.local, item.optimized_size, item.optimized_sha256)
            )
        backup_dir.mkdir(parents=True, exist_ok=True)
        manifest_objects = []
        for item in tracked:
            kept = preserved_backup(backup_dir, bucket, item.key)
            if kept is not None:
                path, digest, size = kept
                confirm_production_size(client, item.key, size, time.sleep)
                say(f"backup local reutilizado {item.key} {size} {digest}")
            else:
                headers = client.head(item.key)  # type: ignore[attr-defined]
                content_length = headers.get("content-length")
                if content_length is None or not str(content_length).isdigit():
                    raise OperationError(f"HEAD sem Content-Length para {item.key}")
                body = client.get(item.key)  # type: ignore[attr-defined]
                if str(len(body)) != str(content_length):
                    raise OperationError(
                        f"{item.key}: download {len(body)} bytes, HEAD Content-Length {content_length}"
                    )
                path = backup_dir / backup_filename(item.key)
                digest = store_backup(path, body)
                size = len(body)
                say(f"backup local {item.key} {size} {digest}")
            item.original_sha256 = digest
            item.original_size = size
            item.backup_path = path
            manifest_objects.append(
                {
                    "chave": item.key,
                    "arquivo": path.name,
                    "hash_original": digest,
                    "tamanho_original": size,
                    "hash_otimizado": item.optimized_sha256,
                    "tamanho_otimizado": item.optimized_size,
                }
            )
        manifest = {
            "criado_em": now_stamp(),
            "bucket": bucket,
            "objetos": manifest_objects,
        }
        (backup_dir / "manifest.json").write_text(
            json.dumps(scrub(manifest), indent=2, ensure_ascii=False) + "\n"
        )
        confirmer(bucket, f"Digite o nome do bucket ({bucket}) para gravar o backup remoto: ")
        for item in tracked:
            rollback_key = f"{ROLLBACK_PREFIX}{item.key}"
            if item.original_sha256 is None or item.original_size is None:
                raise OperationError(f"backup local ausente para {item.key}")
            outcome = ensure_remote_backup(
                client,
                item.key,
                rollback_key,
                item.original_sha256,
                item.original_size,
            )
            say(f"backup remoto {outcome} {rollback_key} {item.original_sha256}")
        confirmer(
            "PUBLICAR",
            "Backup conferido. Digite PUBLICAR para substituir os objetos de produção: ",
        )
    except Exception as error:
        report["resultado"] = "falha_antes_da_substituicao"
        report["erros"].append(describe(error))
        return finish(report, tracked, report_path, rollback_ran=False)

    try:
        for item in tracked:
            payload = item.local.read_bytes()
            digest = sha256_bytes(payload)
            if digest != item.optimized_sha256 or len(payload) != item.optimized_size:
                raise OperationError(f"arquivo local mudou durante a operação: {item.key}")
            possibly_modified.append(item.key)
            try:
                client.put(item.key, payload)  # type: ignore[attr-defined]
            except Exception:
                item.publish_state = "falha"
                raise
            try:
                observed = client.get(item.key)  # type: ignore[attr-defined]
            except Exception:
                item.publish_state = "falha"
                item.authenticated_verification = "erro"
                raise
            observed_sha = sha256_bytes(observed)
            item.bucket_sha256 = observed_sha
            if observed_sha != item.optimized_sha256 or observed != payload:
                item.publish_state = "falha"
                item.authenticated_verification = "divergente"
                raise OperationError(
                    f"GET autenticado divergente em {item.key}: "
                    f"esperado {item.optimized_sha256}, observado {observed_sha}"
                )
            item.publish_state = "conferido"
            item.authenticated_verification = "confere"
            record_public(client, item)
    except Exception as error:
        report["erros"].append(describe(error))
        if not possibly_modified:
            report["resultado"] = "falha_antes_da_substituicao"
            return finish(report, tracked, report_path, rollback_ran=False)
        proven = False
        try:
            proven = restore_all(client, tracked, possibly_modified)
        except Exception as restore_error:
            report["erros"].append(describe(restore_error))
            proven = False
        report["resultado"] = "rollback_concluido" if proven else "rollback_incompleto"
        return finish(report, tracked, report_path, rollback_ran=True)

    report["resultado"] = "ok"
    return finish(report, tracked, report_path, rollback_ran=False)


def _load_manifest(backup_dir: Path, bucket: str) -> list[dict[str, object]]:
    path = backup_dir / "manifest.json"
    if not path.is_file():
        raise OperationError("manifesto do backup ausente")
    try:
        manifest = json.loads(path.read_text())
    except json.JSONDecodeError as error:
        raise OperationError(f"manifesto ilegível: {error}") from None
    if not isinstance(manifest, dict) or manifest.get("bucket") != bucket:
        raise OperationError("manifesto não pertence a este bucket")
    objects = manifest.get("objetos")
    if not isinstance(objects, list) or not objects:
        raise OperationError("manifesto sem objetos")
    return objects


def rollback_run(
    *,
    client: object,
    backup_dir: Path,
    report_path: Path,
    bucket: str,
    confirmer: Confirmer,
) -> dict[str, object]:
    silence_http_debug()
    report = blank_report(bucket, "rollback")
    tracked: list[Tracked] = []
    try:
        entries = _load_manifest(backup_dir, bucket)
    except Exception as error:
        report["resultado"] = "rollback_recusado"
        report["erros"].append(describe(error))
        return finish(report, tracked, report_path, rollback_ran=False)

    problems: list[str] = []
    for entry in entries:
        key = str(entry.get("chave", ""))
        filename = str(entry.get("arquivo", ""))
        try:
            expected_name = backup_filename(key)
        except OperationError as error:
            problems.append(describe(error))
            continue
        if filename != expected_name or "/" in filename or filename in {".", ".."}:
            problems.append(f"{key or filename}: nome de backup inválido")
            continue
        item = Tracked(
            key=key,
            local=backup_dir / filename,
            optimized_sha256=str(entry.get("hash_otimizado", "")),
            optimized_size=int(entry.get("tamanho_otimizado", 0) or 0),
            original_sha256=str(entry.get("hash_original", "")),
            original_size=int(entry.get("tamanho_original", -1)),
            backup_path=backup_dir / filename,
        )
        tracked.append(item)
        path = item.backup_path
        assert path is not None
        if not path.is_file():
            problems.append(f"{key}: arquivo ausente")
            continue
        payload = path.read_bytes()
        digest = sha256_bytes(payload)
        if digest != item.original_sha256 or len(payload) != item.original_size:
            problems.append(f"{key}: hash divergente do manifesto")

    if problems or len(tracked) != len(entries):
        report["resultado"] = "rollback_recusado"
        report["erros"].extend(problems or ["backup incompleto"])
        return finish(report, tracked, report_path, rollback_ran=False)

    try:
        confirmer("RESTAURAR", "Digite RESTAURAR para recolocar os backups nas URLs de produção: ")
    except Exception as error:
        report["resultado"] = "rollback_recusado"
        report["erros"].append(describe(error))
        return finish(report, tracked, report_path, rollback_ran=False)

    keys = [item.key for item in tracked]
    try:
        proven = restore_all(client, tracked, keys)
    except Exception as error:
        report["erros"].append(describe(error))
        proven = False
    report["resultado"] = "rollback_concluido" if proven else "rollback_incompleto"
    return finish(report, tracked, report_path, rollback_ran=True)


def exit_code(report: dict[str, object]) -> int:
    if report["resultado"] == "ok":
        return 0
    if report["modo"] == "rollback" and report["resultado"] == "rollback_concluido":
        return 0
    return 1


def main() -> int:
    silence_http_debug()
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if len(sys.argv) > 2 or mode not in ("", "--check-local", "--rollback"):
        say(
            "uso: python3 scripts/publish-r2-videos.py [--check-local|--rollback]",
            error=True,
        )
        return 2
    try:
        if mode == "--check-local":
            check_local()
            say("Arquivos locais conferidos. Nenhum upload foi feito.")
            return 0
        account_id, bucket, access_key, secret_key = require_env()
        client = R2Client(account_id, bucket, access_key, secret_key)
        if mode == "--rollback":
            report = rollback_run(
                client=client,
                backup_dir=BACKUP_DIR,
                report_path=REPORT_PATH,
                bucket=bucket,
                confirmer=request_confirm,
            )
        else:
            report = publish_run(
                client=client,
                objects=production_specs(),
                backup_dir=BACKUP_DIR,
                report_path=REPORT_PATH,
                bucket=bucket,
                confirmer=request_confirm,
            )
        return exit_code(report)
    except Stop as error:
        say(f"ERRO: {sanitize(str(error))}", error=True)
        return 1
    except Exception as error:
        say(f"ERRO: {describe(error)}", error=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
