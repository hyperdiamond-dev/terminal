/**
 * API Client for Utopia Backend
 *
 * This module provides a type-safe client for interacting with the Utopia research platform API.
 */

// Guarded Deno access: this module is also bundled into islands, where
// Deno does not exist (islands receive the base URL via props instead).
const env = (name: string): string | undefined =>
  typeof Deno !== "undefined" ? Deno.env.get(name) : undefined;

export const API_BASE_URL = env("API_BASE_URL") ||
  "http://localhost:3001";

// Browser-facing API URL, passed to islands for client-side fetches. Needed
// when the server-side URL is not reachable from the browser (e.g. Docker
// service hostnames like http://utopia:3001).
export const PUBLIC_API_BASE_URL = env("PUBLIC_API_BASE_URL") ||
  API_BASE_URL;

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Error thrown by API calls. `status` is the HTTP status code, or 0 for
 * network failures and timeouts (no response received).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500 ||
      this.status === 408 || this.status === 429;
  }
}

/**
 * Standalone request helper for route handlers and islands that talk to the
 * API outside the singleton client. Throws ApiError with the same semantics
 * as ApiClient.request().
 */
export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  opts: {
    method?: string;
    token?: string;
    body?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError("REQUEST TIMED OUT", 0);
    }
    throw new ApiError("NETWORK ERROR — BACKEND UNREACHABLE", 0);
  }

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({
      error: "An unknown error occurred",
    }));
    throw new ApiError(body.error, response.status, body.details);
  }

  return response.json();
}

export interface User {
  uuid: string;
  friendlyAlias: string;
  firebaseUid?: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    uuid: string;
    username: string;
  };
}

export interface AnonymousUserResponse {
  success: boolean;
  credentials: {
    username: string;
    password: string;
  };
  message: string;
}

export interface Module {
  id: number;
  name: string;
  title: string;
  description: string | null;
  sequence_order: number;
  is_required: boolean;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface Submodule {
  id: number;
  name: string;
  title: string;
  description: string | null;
  sequence_order: number;
  is_required: boolean;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface Question {
  id: number;
  question_text: string;
  question_type:
    | "true_false"
    | "multiple_choice"
    | "checkbox_multi_select"
    | "fill_blank"
    | "free_form"
    | "file_upload"
    | "note";
  is_required: boolean;
  sequence_order: number;
  metadata: Record<string, unknown>;
}

export interface QuestionWithResponse extends Question {
  user_response: {
    response_value: string;
    answered_at: string;
  } | null;
}

export interface QuestionListResponse {
  questions: QuestionWithResponse[];
}

export interface FileUploadMeta {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_url: string;
  created_at: string;
}

export interface QuestionResponse {
  id: number;
  question_id: number;
  response_value: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: number;
  content_type: "video" | "image" | "audio";
  title: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sequence_order: number;
  is_external: boolean;
  metadata: Record<string, unknown>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new ApiError("REQUEST TIMED OUT", 0);
      }
      throw new ApiError("NETWORK ERROR — BACKEND UNREACHABLE", 0);
    }

    if (!response.ok) {
      const error: ApiErrorBody = await response.json().catch(() => ({
        error: "An unknown error occurred",
      }));
      throw new ApiError(error.error, response.status, error.details);
    }

    return response.json();
  }

  // Auth endpoints
  // deno-lint-ignore require-await
  async createAnonymousUser(clientIp?: string): Promise<AnonymousUserResponse> {
    return this.request<AnonymousUserResponse>("/api/auth/create-anonymous", {
      method: "POST",
      headers: clientIp ? { "x-forwarded-for": clientIp } : undefined,
    });
  }

  // deno-lint-ignore require-await
  async login(
    username: string,
    password: string,
    clientIp?: string,
  ): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: clientIp ? { "x-forwarded-for": clientIp } : undefined,
    });
  }

  // deno-lint-ignore require-await
  async getProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>("/api/profile");
  }

  // Module endpoints
  // deno-lint-ignore require-await
  async getModules(): Promise<Module[]> {
    return this.request<Module[]>("/api/modules");
  }

  // deno-lint-ignore require-await
  async getCurrentModule(): Promise<Module | null> {
    return this.request<Module | null>("/api/modules/current");
  }

  // deno-lint-ignore require-await
  async getModule(moduleName: string): Promise<Module> {
    return this.request<Module>(`/api/modules/${moduleName}`);
  }

  // deno-lint-ignore require-await
  async startModule(moduleName: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/api/modules/${moduleName}/start`,
      {
        method: "POST",
      },
    );
  }

  // deno-lint-ignore require-await
  async completeModule(moduleName: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/api/modules/${moduleName}/complete`,
      {
        method: "POST",
      },
    );
  }

  // Submodule endpoints
  // deno-lint-ignore require-await
  async getSubmodule(
    moduleName: string,
    submoduleName: string,
  ): Promise<Submodule> {
    return this.request<Submodule>(
      `/api/submodules/${moduleName}/${submoduleName}`,
    );
  }

  // deno-lint-ignore require-await
  async startSubmodule(
    moduleName: string,
    submoduleName: string,
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/api/submodules/${moduleName}/${submoduleName}/start`,
      {
        method: "POST",
      },
    );
  }

  // deno-lint-ignore require-await
  async completeSubmodule(
    moduleName: string,
    submoduleName: string,
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/api/submodules/${moduleName}/${submoduleName}/complete`,
      {
        method: "POST",
      },
    );
  }

  // Question endpoints
  async getModuleQuestions(
    moduleName: string,
  ): Promise<QuestionWithResponse[]> {
    const response = await this.request<QuestionListResponse>(
      `/api/modules/${moduleName}/questions`,
    );
    return response.questions || [];
  }

  async getSubmoduleQuestions(
    submoduleName: string,
  ): Promise<QuestionWithResponse[]> {
    const response = await this.request<QuestionListResponse>(
      `/api/submodules/${submoduleName}/questions`,
    );
    return response.questions || [];
  }

  // deno-lint-ignore require-await
  async getQuestion(questionId: number): Promise<Question> {
    return this.request<Question>(`/api/questions/${questionId}`);
  }

  // deno-lint-ignore require-await
  async submitResponse(
    questionId: number,
    responseValue: string,
  ): Promise<QuestionResponse> {
    return this.request<QuestionResponse>(
      `/api/questions/${questionId}/respond`,
      {
        method: "POST",
        body: JSON.stringify({ response_value: responseValue }),
      },
    );
  }

  // deno-lint-ignore require-await
  async submitBatchResponses(
    responses: Array<{ question_id: number; response_value: string }>,
  ): Promise<QuestionResponse[]> {
    return this.request<QuestionResponse[]>("/api/questions/respond/batch", {
      method: "POST",
      body: JSON.stringify({ responses }),
    });
  }

  // deno-lint-ignore require-await
  async getResponse(questionId: number): Promise<QuestionResponse | null> {
    return this.request<QuestionResponse | null>(
      `/api/questions/${questionId}/response`,
    );
  }

  // Content endpoints
  async getModuleContent(moduleId: number): Promise<ContentItem[]> {
    const response = await this.request<{ content: ContentItem[] }>(
      `/api/content/module/${moduleId}`,
    );
    return response.content || [];
  }

  async getSubmoduleContent(submoduleId: number): Promise<ContentItem[]> {
    const response = await this.request<{ content: ContentItem[] }>(
      `/api/content/submodule/${submoduleId}`,
    );
    return response.content || [];
  }
}

// Export a singleton instance
export const api = new ApiClient();
