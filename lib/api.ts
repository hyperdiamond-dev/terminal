/**
 * API Client for Utopia Backend
 *
 * This module provides a type-safe client for interacting with the Utopia research platform API.
 */

export const API_BASE_URL = Deno.env.get("API_BASE_URL") ||
  "http://localhost:3001";

// Browser-facing API URL, passed to islands for client-side fetches. Needed
// when the server-side URL is not reachable from the browser (e.g. Docker
// service hostnames like http://utopia:3001).
export const PUBLIC_API_BASE_URL = Deno.env.get("PUBLIC_API_BASE_URL") ||
  API_BASE_URL;

export interface ApiError {
  error: string;
  details?: unknown;
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: "An unknown error occurred",
      }));
      throw new Error(`${error.error} (HTTP ${response.status})`);
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
