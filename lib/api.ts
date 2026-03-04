/**
 * API Client for Utopia Backend
 *
 * This module provides a type-safe client for interacting with the Utopia research platform API.
 */

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface User {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
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
  display_name: string;
  description: string;
  sequence_order: number;
  is_required: boolean;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface Submodule {
  id: number;
  name: string;
  display_name: string;
  description: string;
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
    | "fill_blank"
    | "free_form"
    | "file_upload";
  is_required: boolean;
  sequence_order: number;
  metadata: Record<string, unknown>;
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
      throw new Error(error.error);
    }

    return response.json();
  }

  // Auth endpoints
  // deno-lint-ignore require-await
  async createAnonymousUser(): Promise<AnonymousUserResponse> {
    return this.request<AnonymousUserResponse>("/api/auth/create-anonymous", {
      method: "POST",
    });
  }

  // deno-lint-ignore require-await
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  // deno-lint-ignore require-await
  async getCurrentUser(): Promise<User> {
    return this.request<User>("/api/auth/user");
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
  // deno-lint-ignore require-await
  async getModuleQuestions(moduleName: string): Promise<Question[]> {
    return this.request<Question[]>(
      `/api/questions/modules/${moduleName}/questions`,
    );
  }

  // deno-lint-ignore require-await
  async getSubmoduleQuestions(submoduleName: string): Promise<Question[]> {
    return this.request<Question[]>(
      `/api/questions/submodules/${submoduleName}/questions`,
    );
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
}

// Export a singleton instance
export const api = new ApiClient();
