import staffApi from "./staffApi";
import type {
  DashboardResponse,
  FollowUpFilters,
  PendingValidationFilters,
  ValidationCreateRequest,
  ValidationHistoryFilters,
  ValidationMutationResponse,
  ValidationUpdateRequest,
  WorkflowActionResponse,
  WorkflowListResponse,
} from "../types/workflow";

const DOCTOR_BASE_PATH = "/api/v1/doctor/validations";
const HEAD_WORKER_BASE_PATH = "/api/v1/head-worker";

export async function getPendingValidations(
  filters: PendingValidationFilters = {},
): Promise<WorkflowListResponse> {
  const response = await staffApi.get<WorkflowListResponse>(
    `${DOCTOR_BASE_PATH}/pending`,
    { params: filters },
  );
  return response.data;
}

export async function getValidationHistory(
  filters: ValidationHistoryFilters = {},
): Promise<WorkflowListResponse> {
  const response = await staffApi.get<WorkflowListResponse>(
    `${DOCTOR_BASE_PATH}/history`,
    { params: filters },
  );
  return response.data;
}

export async function createValidation(
  request: ValidationCreateRequest,
): Promise<ValidationMutationResponse> {
  const response = await staffApi.post<ValidationMutationResponse>(
    DOCTOR_BASE_PATH,
    request,
  );
  return response.data;
}

export async function updateValidation(
  validationId: string,
  request: ValidationUpdateRequest,
): Promise<ValidationMutationResponse> {
  const response = await staffApi.patch<ValidationMutationResponse>(
    `${DOCTOR_BASE_PATH}/${encodeURIComponent(validationId)}`,
    request,
  );
  return response.data;
}

export async function getHeadWorkerDashboard(): Promise<DashboardResponse> {
  const response = await staffApi.get<DashboardResponse>(
    `${HEAD_WORKER_BASE_PATH}/dashboard`,
  );
  return response.data;
}

export async function getFollowUps(
  filters: FollowUpFilters = {},
): Promise<WorkflowListResponse> {
  const response = await staffApi.get<WorkflowListResponse>(
    `${HEAD_WORKER_BASE_PATH}/follow-ups`,
    { params: filters },
  );
  return response.data;
}

export async function isolateWorkflowCase(
  predictionId: string,
): Promise<WorkflowActionResponse> {
  const response = await staffApi.post<WorkflowActionResponse>(
    `${HEAD_WORKER_BASE_PATH}/follow-ups/${encodeURIComponent(predictionId)}/isolate`,
  );
  return response.data;
}

export async function startWorkflowTreatment(
  predictionId: string,
): Promise<WorkflowActionResponse> {
  const response = await staffApi.post<WorkflowActionResponse>(
    `${HEAD_WORKER_BASE_PATH}/follow-ups/${encodeURIComponent(predictionId)}/treatment/start`,
  );
  return response.data;
}

export async function completeWorkflowTreatment(
  predictionId: string,
): Promise<WorkflowActionResponse> {
  const response = await staffApi.post<WorkflowActionResponse>(
    `${HEAD_WORKER_BASE_PATH}/follow-ups/${encodeURIComponent(predictionId)}/treatment/complete`,
  );
  return response.data;
}
