/**
 * Central API service for CCMS Frontend → FastAPI Backend communication.
 * All routes talk to NEXT_PUBLIC_API_URL (defaults to http://localhost:8000).
 */

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `API error ${res.status}`;
    try {
      const body = await res.json();
      errorMsg = body?.detail?.error ?? body?.detail ?? errorMsg;
    } catch {
      // ignore json parse errors on error body
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch("/health");
}

// ─── Extractions (cases list for the Cases/Extraction page) ──────────────────

export interface ApiCase {
  id: string;
  caseNumber: string;
  cisId: string;
  title: string;
  bench: string;
  department: string;
  nodalOfficer: string;
  orderDate: string;
  ingestionTime: string;
  pages: number;
  sourceType: "Digital PDF" | "Scanned PDF + OCR";
  petitioner: string;
  respondent: string;
  reviewStatus: "Approved" | "Needs Review" | "Edited" | "Rejected";
  risk: "Critical" | "High" | "Medium";
  confidence: number;
  actionType: string;
  actionSummary: string;
  dueDate: string;
  limitationDate: string;
  timelineBasis: string;
  responsibleOffice: string;
  responsible_officer?: string;
  directions: string[];
  actionPlan: {
    title: string;
    owner: string;
    due: string;
    status: "Ready" | "In Progress" | "Blocked" | "Queued";
  }[];
  highlights: {
    id: string;
    label: string;
    page: number;
    confidence: number;
    quote: string;
    field: string;
    box: { x: number; y: number; width: number; height: number };
  }[];
  pdfUrl?: string;
}

export async function listExtractions(): Promise<ApiCase[]> {
  return apiFetch<ApiCase[]>("/api/extractions/");
}

export async function getExtraction(caseId: string): Promise<ApiCase> {
  return apiFetch<ApiCase>(`/api/extractions/${caseId}`);
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResponse {
  job_id: string;
  status: string;
}

export async function uploadPDF(
  file: File,
  language: "English" | "Hindi" | "Kannada" = "English"
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${BASE_URL}/api/upload/?language=${language}`;
  const res = await fetch(url, { method: "POST", body: formData });

  if (!res.ok) {
    let errorMsg = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      errorMsg = body?.detail?.error ?? body?.detail ?? errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  case_id?: string;
  result?: Record<string, unknown> | null;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/api/jobs/${jobId}`);
}

// ─── Verification ─────────────────────────────────────────────────────────────

export interface VerifyPayload {
  decision: "Approved" | "Rejected" | "Needs Review" | "Edited";
  fields?: Record<string, string>;
}

export interface VerifyResponse {
  message: string;
  case: ApiCase;
}

export async function verifyCase(
  caseId: string,
  payload: VerifyPayload
): Promise<VerifyResponse> {
  return apiFetch<VerifyResponse>(`/api/verify/${caseId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardCases(): Promise<ApiCase[]> {
  return apiFetch<ApiCase[]>("/api/dashboard/");
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PipelineStep {
  title: string;
  count: number;
  detail: string;
  iconName: string;
}

export interface ReviewerQueueItem {
  label: string;
  value: number;
  detail: string;
  iconName: string;
}

export interface DepartmentSummaryItem {
  name: string;
  compliance: number;
  pending: number;
  overdue: number;
}

export interface AnalyticsData {
  pipelineSteps: PipelineStep[];
  reviewerQueue: ReviewerQueueItem[];
  departmentSummary: DepartmentSummaryItem[];
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>("/api/analytics/");
}
