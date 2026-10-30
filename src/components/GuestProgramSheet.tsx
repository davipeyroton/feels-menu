import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { ptBR } from "../i18n/pt-BR";
import { HubArrowIcon } from "../components/icons";
import {
  requestLoyaltyWalletCard,
  submitGuestEnrollment,
  verifyEnrollmentCode,
  type GuestEnrollment,
  type GuestProgram,
} from "../loyalty/guestEnrollment";

type FieldErrors = {
  name?: string;
  phone?: string;
  birthDate?: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatBrazilPhone(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length < 3) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (digits.length <= 6) return `(${ddd}) ${rest}`;
  if (digits.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

function isValidBirthDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900) return false;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

function validate(input: {
  name: string;
  phone: string;
  birthDate: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.trim().length < 2) errors.name = ptBR.hub.guestNameError;
  const phoneDigits = digitsOnly(input.phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.phone = ptBR.hub.guestPhoneError;
  }
  if (!isValidBirthDate(input.birthDate)) {
    errors.birthDate = ptBR.hub.guestBirthDateError;
  }
  return errors;
}

const CODE_LENGTH = 5;

function SampleQr() {
  return (
    <svg className="guest-pass__qr" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="6" fill="#fff" />
      <path
        fill="#171717"
        d="M6 6h16v16H6zm4 4v8h8V10zm36-4h16v16H46zm4 4v8h8V10zM6 42h16v16H6zm4 4v8h8v-8zM28 6h6v6h-6zm8 0h4v4h-4zM28 16h4v6h-4zm10-4h6v8h-6zM46 28h6v6h-6zm6 8h6v6h-6zM28 28h8v4h-8zm0 8h4v10h-4zm8-4h6v6h-6zm-8 16h6v6h-6zm10 0h4v8h-4zm8-2h12v4H46zm0 8h6v6h-6zm8 0h6v10h-6z"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#8fb56a" />
      <path
        fill="#f7f3ea"
        d="M8 9.2h6.2a2.3 2.3 0 0 1 0 4.6H13v.7a3.2 3.2 0 0 1-3.2 3.2H8.6V9.2zm1.6 1.5v4.4h.6a1.6 1.6 0 0 0 1.6-1.6v-.5H8.6a.9.9 0 0 1 0-1.8h1z"
      />
    </svg>
  );
}

const STAMP_COUNT = 10;

function StampMug({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path
        d="M7.5 11.2h11.2v7.6a3.7 3.7 0 0 1-3.7 3.7h-3.8a3.7 3.7 0 0 1-3.7-3.7v-7.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.6}
      />
      <path
        d="M18.6 14.2h2.1a2.6 2.6 0 0 1 0 5.2h-2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StampGrid() {
  return (
    <div
      className="guest-pass__stamps"
      role="img"
      aria-label="1 de 10 carimbos. A primeira visita já está carimbada."
    >
      {Array.from({ length: STAMP_COUNT }, (_, index) => {
        const collected = index === 0;
        return (
          <span
            key={index}
            className={
              collected
                ? "guest-pass__stamp guest-pass__stamp--on"
                : "guest-pass__stamp"
            }
          >
            <StampMug filled={collected} />
          </span>
        );
      })}
    </div>
  );
}

function LoyaltyPointsCard({ holder }: { holder: string }) {
  const displayName = holder.trim() || ptBR.hub.guestName;

  return (
    <article className="guest-pass" aria-label={ptBR.hub.guestPassSample}>
      <header className="guest-pass__top">
        <p className="guest-pass__brand">
          <span className="guest-pass__mark">
            <BrandMark />
          </span>
          {ptBR.discover.brandName}
        </p>
        <p className="guest-pass__tier">
          <span>{ptBR.hub.guestPassTierLabel}</span>
          {ptBR.hub.guestPassTier}
        </p>
      </header>
      <StampGrid />
      <div className="guest-pass__meta">
        <p>
          <span>{ptBR.hub.guestPassHolder}</span>
          {displayName}
        </p>
        <p>
          <span>{ptBR.hub.guestPassNext}</span>
          {ptBR.hub.guestPassNextValue}
        </p>
      </div>
      <SampleQr />
      <p className="guest-pass__sample">{ptBR.hub.guestPassSample}</p>
    </article>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="13"
        rx="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M3 10.5h18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="14.75" r="1.05" fill="currentColor" />
    </svg>
  );
}

function EnrollmentCode({ onConfirmed }: { onConfirmed?: () => void }) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: CODE_LENGTH }, () => ""),
  );
  const [status, setStatus] = useState<"idle" | "confirmed" | "invalid">("idle");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const requestRef = useRef(0);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const check = (code: string) => {
    const requestId = ++requestRef.current;
    void verifyEnrollmentCode(code).then((result) => {
      if (requestId !== requestRef.current) return;
      setStatus(result);
      if (result === "confirmed") onConfirmed?.();
    });
  };

  const commit = (next: string[], focusIndex: number) => {
    setDigits(next);
    const focusAt = Math.max(0, Math.min(focusIndex, CODE_LENGTH - 1));
    queueMicrotask(() => inputsRef.current[focusAt]?.focus());

    if (next.some((digit) => digit.length !== 1)) {
      requestRef.current += 1;
      setStatus("idle");
      return;
    }
    check(next.join(""));
  };

  const fillFrom = (start: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "").slice(0, CODE_LENGTH - start);
    if (!incoming) {
      const cleared = digits.slice();
      cleared[start] = "";
      commit(cleared, start);
      return;
    }
    const next = digits.slice();
    incoming.split("").forEach((char, offset) => {
      next[start + offset] = char;
    });
    commit(next, start + incoming.length);
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
      return;
    }
    if (event.key !== "Backspace") return;
    event.preventDefault();
    if (digits[index]) {
      const next = digits.slice();
      next[index] = "";
      commit(next, index);
      return;
    }
    if (index === 0) return;
    const next = digits.slice();
    next[index - 1] = "";
    commit(next, index - 1);
  };

  return (
    <div className="guest-code">
      <div
        className="guest-code__boxes"
        role="group"
        aria-label={ptBR.hub.guestCodeLabel}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputsRef.current[index] = node;
            }}
            className="guest-code__digit"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={ptBR.hub.guestCodeDigit(index + 1)}
            value={digit}
            onChange={(event) => fillFrom(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
            onFocus={(event) => event.currentTarget.select()}
          />
        ))}
      </div>
      {status === "confirmed" ? (
        <p className="guest-code__result guest-code__result--ok" role="status">
          {ptBR.hub.guestCodeConfirmed}
        </p>
      ) : null}
      {status === "invalid" ? (
        <p className="guest-code__result guest-code__result--bad" role="alert">
          {ptBR.hub.guestCodeInvalid}
        </p>
      ) : null}
    </div>
  );
}

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function GuestProgramSheet({
  open,
  program,
  onClose,
}: {
  open: boolean;
  program: GuestProgram | null;
  onClose: () => void;
}) {
  const nameId = useId();
  const phoneId = useId();
  const birthId = useId();
  const dragRef = useRef({ active: false, startY: 0 });
  const [dragY, setDragY] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [codeConfirmed, setCodeConfirmed] = useState(false);
  const [sessionProgram, setSessionProgram] = useState(program);

  if (program !== sessionProgram) {
    setSessionProgram(program);
    setName("");
    setPhone("");
    setBirthDate("");
    setErrors({});
    setSubmitted(false);
    setSubmitting(false);
    setCodeConfirmed(false);
    setDragY(0);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !program || typeof document === "undefined") return null;

  const title =
    program === "cashback"
      ? ptBR.hub.guestCashbackTitle
      : ptBR.hub.guestLoyaltyTitle;
  const reward =
    program === "cashback"
      ? ptBR.hub.guestCashbackReward
      : ptBR.hub.guestLoyaltyReward;

  const onPanelPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, button, a, label")) return;
    dragRef.current = { active: true, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPanelPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    setDragY(Math.max(0, event.clientY - dragRef.current.startY));
  };

  const onPanelPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const distance = Math.max(0, event.clientY - dragRef.current.startY);
    if (distance > 72) {
      onClose();
      return;
    }
    setDragY(0);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate({ name, phone, birthDate });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await submitGuestEnrollment({
        program,
        name: name.trim(),
        phone: digitsOnly(phone),
        birthDate,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="wifi-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={ptBR.hub.guestSheetAria(title)}
    >
      <button
        type="button"
        className="wifi-sheet__backdrop"
        aria-label={ptBR.hub.close}
        onClick={onClose}
      />
      <div
        className={[
          "wifi-sheet__panel guest-sheet",
          dragY > 0 ? "guest-sheet--dragging" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div
          className="guest-sheet__grab"
          onPointerDown={onPanelPointerDown}
          onPointerMove={onPanelPointerMove}
          onPointerUp={onPanelPointerUp}
          onPointerCancel={onPanelPointerUp}
        >
          <div className="wifi-sheet__handle" aria-hidden />
        </div>
        {submitted && program === "loyalty" && codeConfirmed ? (
          <div className="guest-sheet__body guest-sheet__body--pass">
            <p className="wifi-sheet__eyebrow">{title}</p>
            <LoyaltyPointsCard holder={name} />
            <button
              type="button"
              className="guest-wallet__button"
              onClick={() => {
                const enrollment: GuestEnrollment = {
                  program,
                  name: name.trim(),
                  phone: digitsOnly(phone),
                  birthDate,
                };
                void requestLoyaltyWalletCard(enrollment).then((card) => {
                  if (card.passUrl) window.location.assign(card.passUrl);
                });
              }}
            >
              <WalletIcon />
              {ptBR.hub.guestAddToWallet}
            </button>
          </div>
        ) : submitted ? (
          <div className="guest-sheet__body">
            <p className="wifi-sheet__eyebrow">{title}</p>
            <p className="guest-sheet__reward">{reward}</p>
            <div className="guest-sheet__success">
              <p className="guest-sheet__success-title">
                {ptBR.hub.guestSuccessTitle}
              </p>
              <p className="guest-sheet__lead">{ptBR.hub.guestSuccessBody}</p>
              <EnrollmentCode
                onConfirmed={() => setCodeConfirmed(true)}
              />
            </div>
          </div>
        ) : (
          <form
            className="guest-sheet__form"
            onSubmit={(event) => void onSubmit(event)}
          >
            <div className="guest-sheet__body">
            <p className="wifi-sheet__eyebrow">{title}</p>
            <p className="guest-sheet__reward">{reward}</p>
            <div className="guest-sheet__fields">
            <h2 className="guest-sheet__form-heading">{ptBR.hub.guestJoin}</h2>

            <label className="guest-sheet__field" htmlFor={nameId}>
              <span className="wifi-sheet__label">{ptBR.hub.guestName}</span>
              <input
                id={nameId}
                className="guest-sheet__input"
                name="name"
                autoComplete="name"
                value={name}
                aria-invalid={errors.name ? true : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              {errors.name ? (
                <span className="guest-sheet__error" role="alert">
                  {errors.name}
                </span>
              ) : null}
            </label>

            <label className="guest-sheet__field" htmlFor={phoneId}>
              <span className="wifi-sheet__label">{ptBR.hub.guestPhone}</span>
              <input
                id={phoneId}
                className="guest-sheet__input"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={ptBR.hub.guestPhonePlaceholder}
                value={phone}
                aria-invalid={errors.phone ? true : undefined}
                onChange={(event) =>
                  setPhone(formatBrazilPhone(event.target.value))
                }
              />
              {errors.phone ? (
                <span className="guest-sheet__error" role="alert">
                  {errors.phone}
                </span>
              ) : null}
            </label>

            <label className="guest-sheet__field" htmlFor={birthId}>
              <span className="wifi-sheet__label">{ptBR.hub.guestBirthDate}</span>
              <input
                id={birthId}
                className="guest-sheet__input"
                name="bday"
                type="date"
                autoComplete="bday"
                max={todayInputValue()}
                value={birthDate}
                aria-invalid={errors.birthDate ? true : undefined}
                onChange={(event) => setBirthDate(event.target.value)}
              />
              {errors.birthDate ? (
                <span className="guest-sheet__error" role="alert">
                  {errors.birthDate}
                </span>
              ) : null}
            </label>
            </div>
            </div>
            <div className="guest-sheet__actions">
              <button
                type="submit"
                className="guest-sheet__submit"
                aria-label={ptBR.hub.guestSubmit}
                disabled={submitting}
              >
                <HubArrowIcon size={20} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
