export type CreatableStaffRole = "veterinarian" | "head_worker";

export interface StaffAccountFormInput {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export interface StaffAccountPayload {
  full_name: string;
  email: string;
  password: string;
  role: CreatableStaffRole;
}

type StaffAccountFormErrors = Partial<Record<keyof StaffAccountFormInput, string>>;

export type StaffAccountValidationResult =
  | { ok: true; data: StaffAccountPayload }
  | { ok: false; errors: StaffAccountFormErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStaffAccountForm(
  form: StaffAccountFormInput,
): StaffAccountValidationResult {
  const fullName = form.full_name.trim();
  const email = form.email.trim().toLowerCase();
  const errors: StaffAccountFormErrors = {};

  if (!fullName) errors.full_name = "Nama lengkap harus diisi";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Format email tidak valid";
  if (form.password.length < 8) errors.password = "Password minimal 8 karakter";
  if (form.role !== "veterinarian" && form.role !== "head_worker") {
    errors.role = "Peran akun staf tidak valid";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      full_name: fullName,
      email,
      password: form.password,
      role: form.role as CreatableStaffRole,
    },
  };
}
