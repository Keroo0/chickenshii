import assert from "node:assert/strict";
import test from "node:test";

import type {
  DiseaseClass,
  WorkflowStatus,
} from "../types/workflow.ts";
import {
  DISEASE_CLASSES,
  formatWorkflowConfidence,
  getDiseaseCorrectionOptions,
  getDiseaseLabel,
  getValidationInputError,
  getValidationVerdictLabel,
  getWorkflowActionAvailability,
  getWorkflowApiErrorMessage,
  getWorkflowDisplayClass,
  getWorkflowStatusLabel,
  isTerminalWorkflowStatus,
  isValidationInputValid,
  toWorkflowApiError,
} from "../utils/workflow.ts";

test("formats backend confidence values as a 0-100 percentage", () => {
  assert.equal(formatWorkflowConfidence(0), "0%");
  assert.equal(formatWorkflowConfidence(9), "9%");
  assert.equal(formatWorkflowConfidence(94.54), "94.5%");
  assert.equal(formatWorkflowConfidence(94.55), "94.6%");
  assert.equal(formatWorkflowConfidence(100), "100%");
});

test("rejects missing, non-finite, and out-of-range confidence values", () => {
  for (const confidence of [undefined, null, Number.NaN, Infinity, -Infinity, -0.1, 100.1]) {
    assert.equal(formatWorkflowConfidence(confidence), "Tidak tersedia");
  }
});

test("uses the effective class before the original AI class", () => {
  assert.equal(
    getWorkflowDisplayClass({
      ai_class: "Coccidiosis",
      effective_class: "Salmonellosis",
    }),
    "Salmonellosis",
  );
  assert.equal(
    getWorkflowDisplayClass({ ai_class: "New Castle Disease" }),
    "New Castle Disease",
  );
  assert.equal(getWorkflowDisplayClass({}), null);
});

test("offers every disease correction except the current AI result", () => {
  for (const aiClass of DISEASE_CLASSES) {
    const options = getDiseaseCorrectionOptions(aiClass);
    assert.equal(options.includes(aiClass), false);
    assert.deepEqual(
      [...options].sort(),
      DISEASE_CLASSES.filter((disease) => disease !== aiClass).sort(),
    );
  }

  assert.deepEqual(getDiseaseCorrectionOptions(null), [...DISEASE_CLASSES]);
  assert.deepEqual(getDiseaseCorrectionOptions(undefined), [...DISEASE_CLASSES]);
});

test("enforces every validation input rule", () => {
  const fiveThousandCharacters = "a".repeat(5000);

  const cases: Array<{
    name: string;
    input: Parameters<typeof getValidationInputError>[0];
    error: string | null;
  }> = [
    {
      name: "verdict is required",
      input: { verdict: null },
      error: "Pilih hasil validasi terlebih dahulu.",
    },
    {
      name: "incorrect requires a correction",
      input: { verdict: "incorrect", aiClass: "Coccidiosis" },
      error: "Pilih label koreksi untuk hasil yang tidak sesuai.",
    },
    {
      name: "incorrect correction must differ from AI",
      input: {
        verdict: "incorrect",
        aiClass: "Coccidiosis",
        correctedPrediction: "Coccidiosis",
      },
      error: "Label koreksi harus berbeda dari hasil AI.",
    },
    {
      name: "matching must not contain a correction",
      input: {
        verdict: "matching",
        correctedPrediction: "Healthy",
      },
      error: "Label koreksi hanya digunakan untuk hasil yang tidak sesuai.",
    },
    {
      name: "uncertain must not contain a correction",
      input: {
        verdict: "uncertain",
        correctedPrediction: "Salmonellosis",
      },
      error: "Label koreksi hanya digunakan untuk hasil yang tidak sesuai.",
    },
    {
      name: "note may contain exactly 5000 characters",
      input: { verdict: "matching", note: fiveThousandCharacters },
      error: null,
    },
    {
      name: "note may not exceed 5000 characters",
      input: { verdict: "matching", note: `${fiveThousandCharacters}a` },
      error: "Catatan tidak boleh lebih dari 5.000 karakter.",
    },
    {
      name: "matching may omit its optional note",
      input: { verdict: "matching" },
      error: null,
    },
    {
      name: "uncertain may include an optional note",
      input: { verdict: "uncertain", note: "Perlu pemeriksaan laboratorium." },
      error: null,
    },
    {
      name: "incorrect accepts a different correction",
      input: {
        verdict: "incorrect",
        aiClass: "Coccidiosis",
        correctedPrediction: "Healthy",
        note: "Tidak ditemukan gejala penyakit.",
      },
      error: null,
    },
  ];

  for (const { name, input, error } of cases) {
    assert.equal(getValidationInputError(input), error, name);
    assert.equal(isValidationInputValid(input), error === null, name);
  }
});

test("maps all disease and validation verdict labels with safe fallbacks", () => {
  const diseaseLabels: Record<DiseaseClass, string> = {
    Coccidiosis: "Coccidiosis",
    Healthy: "Healthy",
    "New Castle Disease": "New Castle Disease",
    Salmonellosis: "Salmonellosis",
  };
  for (const [disease, label] of Object.entries(diseaseLabels)) {
    assert.equal(getDiseaseLabel(disease as DiseaseClass), label);
  }
  assert.equal(getDiseaseLabel(null), "Belum tersedia");
  assert.equal(getDiseaseLabel(undefined), "Belum tersedia");

  assert.equal(getValidationVerdictLabel("matching"), "Sesuai");
  assert.equal(getValidationVerdictLabel("incorrect"), "Tidak sesuai");
  assert.equal(
    getValidationVerdictLabel("uncertain"),
    "Tidak dapat dipastikan",
  );
  assert.equal(getValidationVerdictLabel(null), "Belum divalidasi");
  assert.equal(getValidationVerdictLabel(undefined), "Belum divalidasi");
});

test("maps every workflow status label and identifies terminal statuses", () => {
  const statusLabels: Record<WorkflowStatus, string> = {
    pending_isolation: "Menunggu pemisahan",
    pending_validation: "Menunggu validasi",
    requires_examination: "Perlu pemeriksaan lebih lanjut",
    ready_for_treatment: "Siap ditangani",
    active_treatment: "Penanganan aktif",
    treatment_completed: "Selesai",
    auto_closed: "Ditutup otomatis",
  };

  for (const [status, label] of Object.entries(statusLabels)) {
    const workflowStatus = status as WorkflowStatus;
    assert.equal(getWorkflowStatusLabel(workflowStatus), label);
    assert.equal(
      isTerminalWorkflowStatus(workflowStatus),
      workflowStatus === "treatment_completed" || workflowStatus === "auto_closed",
    );
  }
  assert.equal(getWorkflowStatusLabel(null), "Status belum tersedia");
  assert.equal(getWorkflowStatusLabel(undefined), "Status belum tersedia");
  assert.equal(isTerminalWorkflowStatus(null), false);
  assert.equal(isTerminalWorkflowStatus(undefined), false);
});

test("gates actions for every canonical follow-up state", () => {
  const cases: Array<{
    name: string;
    item: {
      status?: WorkflowStatus;
      isolated_at?: string;
      closed_at?: string;
    };
    isolate: boolean;
    start: boolean;
    complete: boolean;
  }> = [
    {
      name: "pending isolation",
      item: { status: "pending_isolation" },
      isolate: true,
      start: false,
      complete: false,
    },
    {
      name: "isolated pending validation",
      item: {
        status: "pending_validation",
        isolated_at: "2026-08-02T08:00:00Z",
      },
      isolate: false,
      start: false,
      complete: false,
    },
    {
      name: "uncertain result",
      item: {
        status: "requires_examination",
        isolated_at: "2026-08-02T08:00:00Z",
      },
      isolate: false,
      start: false,
      complete: false,
    },
    {
      name: "ready for treatment",
      item: {
        status: "ready_for_treatment",
        isolated_at: "2026-08-02T08:00:00Z",
      },
      isolate: false,
      start: true,
      complete: false,
    },
    {
      name: "active treatment",
      item: {
        status: "active_treatment",
        isolated_at: "2026-08-02T08:00:00Z",
      },
      isolate: false,
      start: false,
      complete: true,
    },
    {
      name: "completed treatment",
      item: {
        status: "treatment_completed",
        isolated_at: "2026-08-02T08:00:00Z",
      },
      isolate: false,
      start: false,
      complete: false,
    },
    {
      name: "healthy correction auto-closed",
      item: {
        status: "auto_closed",
        isolated_at: "2026-08-02T08:00:00Z",
        closed_at: "2026-08-02T09:00:00Z",
      },
      isolate: false,
      start: false,
      complete: false,
    },
  ];

  for (const expected of cases) {
    const actual = getWorkflowActionAvailability(expected.item);
    assert.equal(actual.isolate.available, expected.isolate, `${expected.name}: isolate`);
    assert.equal(
      actual.startTreatment.available,
      expected.start,
      `${expected.name}: start`,
    );
    assert.equal(
      actual.completeTreatment.available,
      expected.complete,
      `${expected.name}: complete`,
    );

    for (const action of [
      actual.isolate,
      actual.startTreatment,
      actual.completeTreatment,
    ]) {
      assert.equal(
        action.available ? action.unavailableReason : null,
        null,
        `${expected.name}: available actions have no unavailable reason`,
      );
      if (!action.available) {
        assert.equal(
          typeof action.unavailableReason,
          "string",
          `${expected.name}: disabled actions explain why`,
        );
      }
    }
  }
});

test("does not allow actions without status or on an explicitly closed case", () => {
  const missingStatus = getWorkflowActionAvailability({});
  assert.equal(missingStatus.isolate.available, false);
  assert.match(missingStatus.isolate.unavailableReason ?? "", /Status kasus belum tersedia/);

  const explicitlyClosed = getWorkflowActionAvailability({
    status: "ready_for_treatment",
    closed_at: "2026-08-02T09:00:00Z",
  });
  assert.equal(explicitlyClosed.isolate.available, false);
  assert.equal(explicitlyClosed.startTreatment.available, false);
  assert.equal(explicitlyClosed.completeTreatment.available, false);
});

test("maps supported HTTP, network, and unknown errors to sanitized UI errors", () => {
  const cases = [
    {
      name: "401",
      error: { response: { status: 401, data: { detail: "secret auth detail" } } },
      kind: "unauthenticated",
      status: 401,
      retryable: false,
    },
    {
      name: "403",
      error: { response: { status: 403, data: { detail: "secret role detail" } } },
      kind: "forbidden",
      status: 403,
      retryable: false,
    },
    {
      name: "404",
      error: { response: { status: 404, data: { detail: "secret row detail" } } },
      kind: "not_found",
      status: 404,
      retryable: false,
    },
    {
      name: "409",
      error: { response: { status: 409, data: { detail: "secret conflict detail" } } },
      kind: "conflict",
      status: 409,
      retryable: false,
    },
    {
      name: "422",
      error: { response: { status: 422, data: { detail: "secret validation detail" } } },
      kind: "invalid_request",
      status: 422,
      retryable: false,
    },
    {
      name: "503",
      error: { response: { status: 503, data: { detail: "secret outage detail" } } },
      kind: "unavailable",
      status: 503,
      retryable: true,
    },
    {
      name: "network",
      error: { request: { internal: "secret request detail" }, message: "secret network detail" },
      kind: "network",
      status: null,
      retryable: true,
    },
    {
      name: "unsupported server status",
      error: { response: { status: 500, data: { detail: "secret database detail" } } },
      kind: "unknown",
      status: null,
      retryable: true,
    },
    {
      name: "unknown Error instance",
      error: new Error("secret thrown detail"),
      kind: "unknown",
      status: null,
      retryable: true,
    },
  ] as const;

  for (const expected of cases) {
    const mapped = toWorkflowApiError(expected.error);
    assert.equal(mapped.kind, expected.kind, expected.name);
    assert.equal(mapped.status, expected.status, expected.name);
    assert.equal(mapped.retryable, expected.retryable, expected.name);
    assert.equal(getWorkflowApiErrorMessage(expected.error), mapped.message, expected.name);
    assert.equal(JSON.stringify(mapped).includes("secret"), false, expected.name);
    assert.equal(mapped.title.length > 0, true, expected.name);
    assert.equal(mapped.message.length > 0, true, expected.name);
  }
});
