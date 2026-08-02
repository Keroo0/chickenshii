export type DiseaseClass =
  | "Coccidiosis"
  | "Healthy"
  | "New Castle Disease"
  | "Salmonellosis";

export type ValidationVerdict = "matching" | "incorrect" | "uncertain";

export type WorkflowStatus =
  | "pending_isolation"
  | "pending_validation"
  | "requires_examination"
  | "ready_for_treatment"
  | "active_treatment"
  | "treatment_completed"
  | "auto_closed";

export type WorkflowCloseReason = "corrected_healthy";

export type WorkflowRecommendationData = Record<string, string> & {
  description?: string;
  cause?: string;
  immediate_action?: string;
};

export type WorkflowValidationData = Record<string, unknown>;
export type WorkflowFollowUpData = Record<string, unknown>;

/** Mirrors WorkflowItemResponse. Optional keys account for response_model_exclude_none. */
export interface WorkflowItem {
  prediction_id: string;
  image_url?: string;
  ai_class?: DiseaseClass;
  ai_confidence?: number;
  ai_probabilities?: Record<string, number>;
  worker_id?: string;
  worker_name?: string;
  created_at?: string;
  validation?: WorkflowValidationData;
  validation_id?: string;
  verdict?: ValidationVerdict;
  corrected_prediction?: DiseaseClass;
  veterinarian_id?: string;
  validation_note?: string;
  validation_created_at?: string;
  validation_updated_at?: string;
  effective_class?: DiseaseClass;
  requires_examination?: boolean;
  status?: WorkflowStatus;
  recommendation_data?: WorkflowRecommendationData;
  followup?: WorkflowFollowUpData;
  isolated_at?: string;
  isolated_by?: string;
  treatment_started_at?: string;
  treatment_started_by?: string;
  treatment_completed_at?: string;
  treatment_completed_by?: string;
  closed_at?: string;
  close_reason?: WorkflowCloseReason;
  closed_by?: string;
  followup_created_at?: string;
  followup_updated_at?: string;
  treatment_started?: boolean;
  editable?: boolean;
}

export type WorkflowItemResponse = WorkflowItem;

export interface WorkflowListData {
  items: WorkflowItem[];
  limit: number;
  offset: number;
}

export interface WorkflowListResponse {
  status: "success";
  data: WorkflowListData;
}

export interface WorkflowActionResponse {
  status: "success";
  data: WorkflowItem;
}

interface MatchingOrUncertainValidationFields {
  verdict: "matching" | "uncertain";
  corrected_prediction?: null;
  note?: string | null;
}

interface IncorrectValidationFields {
  verdict: "incorrect";
  corrected_prediction: DiseaseClass;
  note?: string | null;
}

export type ValidationFields =
  | MatchingOrUncertainValidationFields
  | IncorrectValidationFields;

export type ValidationCreateRequest = ValidationFields & {
  prediction_id: string;
};

export type ValidationUpdateRequest = ValidationFields;

export interface ValidationRecord {
  id: string;
  prediction_id?: string;
  veterinarian_id?: string;
  verdict?: ValidationVerdict;
  corrected_prediction?: DiseaseClass;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export type ValidationRecordResponse = ValidationRecord;

export interface ValidationMutationResponse {
  status: "success";
  data: ValidationRecord;
}

export interface DashboardCounts {
  total_disease_cases: number;
  pending_isolation: number;
  pending_validation: number;
  active_treatment: number;
}

export type DashboardCountsResponse = DashboardCounts;

export interface DashboardData {
  counts: DashboardCounts;
  latest_cases: WorkflowItem[];
}

export type DashboardDataResponse = DashboardData;

export interface DashboardResponse {
  status: "success";
  data: DashboardData;
}

export interface WorkflowPaginationFilters {
  limit?: number;
  offset?: number;
}

export interface WorkflowDateFilters {
  /** Calendar date in YYYY-MM-DD format. */
  date_from?: string;
  /** Calendar date in YYYY-MM-DD format. */
  date_to?: string;
}

export interface PendingValidationFilters
  extends WorkflowPaginationFilters,
    WorkflowDateFilters {
  disease?: DiseaseClass;
}

export interface ValidationHistoryFilters extends PendingValidationFilters {
  verdict?: ValidationVerdict;
}

export type DoctorPendingValidationFilters = PendingValidationFilters;
export type DoctorValidationHistoryFilters = ValidationHistoryFilters;

export interface FollowUpFilters
  extends WorkflowPaginationFilters,
    WorkflowDateFilters {
  status?: WorkflowStatus;
  disease?: DiseaseClass;
}

export type HeadWorkerFollowUpFilters = FollowUpFilters;

export type WorkflowAction =
  | "isolate"
  | "start_treatment"
  | "complete_treatment";

export type WorkflowHttpStatus = 401 | 403 | 404 | 409 | 422 | 503;

export type WorkflowApiErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid_request"
  | "unavailable"
  | "network"
  | "unknown";

export interface WorkflowApiErrorInfo {
  kind: WorkflowApiErrorKind;
  status: WorkflowHttpStatus | null;
  title: string;
  message: string;
  retryable: boolean;
}

export interface WorkflowActionState {
  action: WorkflowAction;
  label: string;
  available: boolean;
  unavailableReason: string | null;
}

export interface WorkflowActionAvailability {
  isolate: WorkflowActionState;
  startTreatment: WorkflowActionState;
  completeTreatment: WorkflowActionState;
}
