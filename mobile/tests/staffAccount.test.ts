import assert from "node:assert/strict";
import test from "node:test";

import { validateStaffAccountForm } from "../utils/staffAccount.ts";

test("normalizes a valid staff account form for the API", () => {
  assert.deepEqual(
    validateStaffAccountForm({
      full_name: "  dr. Sari  ",
      email: "  SARI@EXAMPLE.COM ",
      password: "rahasia8",
      role: "veterinarian",
    }),
    {
      ok: true,
      data: {
        full_name: "dr. Sari",
        email: "sari@example.com",
        password: "rahasia8",
        role: "veterinarian",
      },
    },
  );
});

test("rejects blank names, invalid email, and passwords shorter than eight characters", () => {
  assert.deepEqual(
    validateStaffAccountForm({
      full_name: "   ",
      email: "not-an-email",
      password: "1234567",
      role: "head_worker",
    }),
    {
      ok: false,
      errors: {
        full_name: "Nama lengkap harus diisi",
        email: "Format email tidak valid",
        password: "Password minimal 8 karakter",
      },
    },
  );
});

test("rejects roles outside veterinarian and head_worker", () => {
  assert.deepEqual(
    validateStaffAccountForm({
      full_name: "Admin Baru",
      email: "admin@example.com",
      password: "rahasia8",
      role: "admin",
    }),
    {
      ok: false,
      errors: { role: "Peran akun staf tidak valid" },
    },
  );
});
