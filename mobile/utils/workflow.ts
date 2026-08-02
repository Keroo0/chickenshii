import type {
  DiseaseClass,
  ValidationVerdict,
  WorkflowAction,
  WorkflowActionAvailability,
  WorkflowApiErrorInfo,
  WorkflowHttpStatus,
  WorkflowItem,
  WorkflowStatus,
} from "../types/workflow";
import { colors } from "../constants/colors.ts";

export const DISEASE_CLASSES: readonly DiseaseClass[] = [
  "Coccidiosis",
  "Healthy",
  "New Castle Disease",
  "Salmonellosis",
] as const;

export const VALIDATION_VERDICTS: readonly ValidationVerdict[] = [
  "matching",
  "incorrect",
  "uncertain",
] as const;

export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  "pending_isolation",
  "pending_validation",
  "requires_examination",
  "ready_for_treatment",
  "active_treatment",
  "treatment_completed",
  "auto_closed",
] as const;

export interface WorkflowDiseasePalette {
  color: string;
  soft: string;
}

export const WORKFLOW_DISEASE_PALETTE: Record<
  DiseaseClass,
  WorkflowDiseasePalette
> = {
  Healthy: { color: colors.healthy, soft: colors.healthySoft },
  Coccidiosis: { color: colors.danger, soft: colors.dangerSoft },
  Salmonellosis: { color: colors.danger, soft: colors.dangerSoft },
  "New Castle Disease": { color: colors.warning, soft: colors.warningSoft },
};

export function getWorkflowDiseasePalette(
  disease: string | null | undefined,
): WorkflowDiseasePalette {
  if (disease && disease in WORKFLOW_DISEASE_PALETTE) {
    return WORKFLOW_DISEASE_PALETTE[disease as DiseaseClass];
  }
  return { color: colors.muted, soft: colors.mutedSoft };
}

const DISEASE_LABELS: Record<DiseaseClass, string> = {
  Coccidiosis: "Coccidiosis",
  Healthy: "Healthy",
  "New Castle Disease": "New Castle Disease",
  Salmonellosis: "Salmonellosis",
};

const VERDICT_LABELS: Record<ValidationVerdict, string> = {
  matching: "Sesuai",
  incorrect: "Tidak sesuai",
  uncertain: "Tidak dapat dipastikan",
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending_isolation: "Menunggu pemisahan",
  pending_validation: "Menunggu validasi",
  requires_examination: "Perlu pemeriksaan lebih lanjut",
  ready_for_treatment: "Siap ditangani",
  active_treatment: "Penanganan aktif",
  treatment_completed: "Selesai",
  auto_closed: "Ditutup otomatis",
};

const ACTION_LABELS: Record<WorkflowAction, string> = {
  isolate: "Sudah dipisahkan",
  start_treatment: "Mulai penanganan",
  complete_treatment: "Penanganan selesai",
};

export function getDiseaseLabel(disease: DiseaseClass | null | undefined): string {
  return disease ? DISEASE_LABELS[disease] : "Belum tersedia";
}

export function getDiseaseCorrectionOptions(
  aiClass: DiseaseClass | null | undefined,
): DiseaseClass[] {
  return DISEASE_CLASSES.filter((disease) => disease !== aiClass);
}

export function getValidationVerdictLabel(
  verdict: ValidationVerdict | null | undefined,
): string {
  return verdict ? VERDICT_LABELS[verdict] : "Belum divalidasi";
}

export function getWorkflowStatusLabel(
  status: WorkflowStatus | null | undefined,
): string {
  return status ? STATUS_LABELS[status] : "Status belum tersedia";
}

export function getWorkflowActionLabel(action: WorkflowAction): string {
  return ACTION_LABELS[action];
}

export function getWorkflowDisplayClass(
  item: Pick<WorkflowItem, "effective_class" | "ai_class">,
): DiseaseClass | null {
  return item.effective_class ?? item.ai_class ?? null;
}

export function formatWorkflowConfidence(
  confidence: number | null | undefined,
): string {
  if (
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 100
  ) {
    return "Tidak tersedia";
  }
  const rounded = Math.round(confidence * 10) / 10;
  return `${rounded.toFixed(1).replace(/\.0$/, "")}%`;
}

export function formatWorkflowDate(
  value: string | null | undefined,
  fallback = "Belum tersedia",
): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(date);
}

export function getValidationInputError(input: {
  verdict: ValidationVerdict | null;
  correctedPrediction?: DiseaseClass | null;
  aiClass?: DiseaseClass | null;
  note?: string | null;
}): string | null {
  if (!input.verdict) return "Pilih hasil validasi terlebih dahulu.";

  if (input.verdict === "incorrect") {
    if (!input.correctedPrediction) {
      return "Pilih label koreksi untuk hasil yang tidak sesuai.";
    }
    if (input.correctedPrediction === input.aiClass) {
      return "Label koreksi harus berbeda dari hasil AI.";
    }
  } else if (input.correctedPrediction) {
    return "Label koreksi hanya digunakan untuk hasil yang tidak sesuai.";
  }

  if ((input.note?.length ?? 0) > 5000) {
    return "Catatan tidak boleh lebih dari 5.000 karakter.";
  }
  return null;
}

export function isValidationInputValid(
  input: Parameters<typeof getValidationInputError>[0],
): boolean {
  return getValidationInputError(input) === null;
}

function readHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const response = "response" in error ? error.response : null;
  if (!response || typeof response !== "object" || !("status" in response)) {
    return null;
  }
  return typeof response.status === "number" ? response.status : null;
}

function hasRequestWithoutResponse(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "request" in error &&
      !("response" in error && error.response),
  );
}

export function toWorkflowApiError(error: unknown): WorkflowApiErrorInfo {
  const status = readHttpStatus(error);

  switch (status) {
    case 401:
      return {
        kind: "unauthenticated",
        status,
        title: "Sesi berakhir",
        message: "Silakan masuk kembali untuk melanjutkan.",
        retryable: false,
      };
    case 403:
      return {
        kind: "forbidden",
        status,
        title: "Akses ditolak",
        message: "Akun ini tidak memiliki izin untuk melakukan tindakan tersebut.",
        retryable: false,
      };
    case 404:
      return {
        kind: "not_found",
        status,
        title: "Data tidak ditemukan",
        message: "Kasus mungkin telah berubah atau tidak lagi tersedia. Muat ulang daftar.",
        retryable: false,
      };
    case 409:
      return {
        kind: "conflict",
        status,
        title: "Status sudah berubah",
        message: "Kasus telah diperbarui oleh pengguna lain. Muat ulang untuk melihat status terbaru.",
        retryable: false,
      };
    case 422:
      return {
        kind: "invalid_request",
        status,
        title: "Data belum valid",
        message: "Periksa kembali pilihan dan isian sebelum melanjutkan.",
        retryable: false,
      };
    case 503:
      return {
        kind: "unavailable",
        status,
        title: "Layanan sementara tidak tersedia",
        message: "Coba lagi beberapa saat lagi.",
        retryable: true,
      };
    default:
      if (hasRequestWithoutResponse(error)) {
        return {
          kind: "network",
          status: null,
          title: "Tidak dapat terhubung",
          message: "Periksa koneksi internet, lalu coba lagi.",
          retryable: true,
        };
      }
      return {
        kind: "unknown",
        status: null,
        title: "Terjadi kesalahan",
        message: "Permintaan belum dapat diproses. Silakan coba lagi.",
        retryable: true,
      };
  }
}

export function getWorkflowApiErrorMessage(error: unknown): string {
  return toWorkflowApiError(error).message;
}

export function isWorkflowHttpStatus(
  error: unknown,
  status: WorkflowHttpStatus,
): boolean {
  return readHttpStatus(error) === status;
}

export function isTerminalWorkflowStatus(
  status: WorkflowStatus | null | undefined,
): boolean {
  return status === "treatment_completed" || status === "auto_closed";
}

export function getWorkflowActionAvailability(
  item: Pick<WorkflowItem, "status" | "isolated_at" | "closed_at">,
): WorkflowActionAvailability {
  const status = item.status ?? null;
  const isClosed = Boolean(item.closed_at) || isTerminalWorkflowStatus(status);
  const canIsolate = Boolean(status) && !isClosed && !item.isolated_at;
  const canStartTreatment = !isClosed && status === "ready_for_treatment";
  const canCompleteTreatment = !isClosed && status === "active_treatment";

  return {
    isolate: {
      action: "isolate",
      label: ACTION_LABELS.isolate,
      available: canIsolate,
      unavailableReason: canIsolate
        ? null
        : item.isolated_at
          ? "Pemisahan sudah dicatat."
          : !status
            ? "Status kasus belum tersedia. Muat ulang data terlebih dahulu."
          : "Kasus ini sudah ditutup atau selesai.",
    },
    startTreatment: {
      action: "start_treatment",
      label: ACTION_LABELS.start_treatment,
      available: canStartTreatment,
      unavailableReason: canStartTreatment
        ? null
        : status === "requires_examination"
          ? "Hasil dokter belum dapat dipastikan dan memerlukan pemeriksaan lebih lanjut."
          : status === "pending_isolation"
            ? "Catat pemisahan sebelum memulai penanganan."
            : status === "pending_validation"
              ? "Tunggu hasil validasi dokter sebelum memulai penanganan."
              : "Penanganan hanya dapat dimulai pada kasus yang siap ditangani.",
    },
    completeTreatment: {
      action: "complete_treatment",
      label: ACTION_LABELS.complete_treatment,
      available: canCompleteTreatment,
      unavailableReason: canCompleteTreatment
        ? null
        : "Penyelesaian hanya dapat dicatat saat penanganan sedang aktif.",
    },
  };
}
