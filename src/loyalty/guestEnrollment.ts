export type GuestProgram = "cashback" | "loyalty";

export type GuestEnrollment = {
  program: GuestProgram;
  name: string;
  phone: string;
  birthDate: string;
};

/**
 * Cadastro local do formulário.
 * A chamada à API da plataforma de fidelidade entra neste ponto.
 */
export async function submitGuestEnrollment(
  enrollment: GuestEnrollment,
): Promise<GuestEnrollment> {
  return enrollment;
}

export type EnrollmentCodeResult = "confirmed" | "invalid";

/**
 * Confere o código de 5 dígitos.
 * A API da plataforma, que envia o código no WhatsApp, entra neste ponto.
 */
export async function verifyEnrollmentCode(
  code: string,
): Promise<EnrollmentCodeResult> {
  return /^\d{5}$/.test(code) ? "confirmed" : "invalid";
}

export type LoyaltyWalletCard = {
  enrollment: GuestEnrollment;
  /** URL do passe na carteira. O serviço externo preenche este campo. */
  passUrl: string | null;
};

/**
 * Pede o cartão de fidelidade para a carteira do celular.
 * O serviço externo do programa entra neste ponto. Ainda não há passe próprio.
 */
export async function requestLoyaltyWalletCard(
  enrollment: GuestEnrollment,
): Promise<LoyaltyWalletCard> {
  return { enrollment, passUrl: null };
}
