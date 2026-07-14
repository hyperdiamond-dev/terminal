import { Handlers, PageProps } from "$fresh/server.ts";
import ModuleQuestionnaire from "../../islands/ModuleQuestionnaire.tsx";
import MediaContent from "../../components/MediaContent.tsx";
import Breadcrumbs, { BreadcrumbItem } from "../../components/Breadcrumbs.tsx";
import WarningBanner from "../../components/WarningBanner.tsx";
import { getAuthToken } from "../../lib/cookies.ts";
import { getTheme } from "../../lib/themes.ts";
import {
  API_BASE_URL,
  ApiError,
  apiRequest,
  type ContentItem,
  PUBLIC_API_BASE_URL,
} from "../../lib/api.ts";

interface ModuleProgress {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  started_at?: string;
  completed_at?: string;
  response_data?: Record<string, unknown>;
}

interface SubmoduleInfo {
  id: number;
  name: string;
  title: string;
  description: string | null;
  sequence_order: number;
  accessible: boolean;
  questions_count: number;
  progress: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    started_at?: string;
    completed_at?: string;
  } | null;
}

interface QuestionInfo {
  id: number;
  question_text: string;
  question_type:
    | "true_false"
    | "multiple_choice"
    | "fill_blank"
    | "free_form"
    | "file_upload"
    | "note";
  sequence_order: number;
  is_required: boolean;
  metadata: Record<string, unknown>;
  user_response: {
    response_value: unknown;
    answered_at: string;
  } | null;
}

interface ModuleData {
  module?: {
    id?: number;
    name: string;
    title: string;
    description: string | null;
    sequence_order: number;
    style_theme?: string | null;
  };
  progress?: ModuleProgress;
  accessible?: boolean;
  is_completed?: boolean;
  can_review?: boolean;
  submodules?: SubmoduleInfo[];
  questions?: QuestionInfo[];
  content?: ContentItem[];
  warnings?: string[];
  error?: string;
  errorStatus?: number;
  authToken?: string;
  apiBaseUrl?: string;
}

export const handler: Handlers<ModuleData> = {
  async GET(req, ctx) {
    const authToken = getAuthToken(req);

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    const { name } = ctx.params;

    try {
      // Fetch module details
      let moduleData: ModuleData;
      try {
        moduleData = await apiRequest<ModuleData>(
          API_BASE_URL,
          `/api/modules/${name}`,
          { token: authToken },
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/" },
          });
        }
        if (err instanceof ApiError && err.status === 403) {
          // Module not accessible - redirect to modules list
          return new Response(null, {
            status: 303,
            headers: { Location: "/modules" },
          });
        }
        throw err;
      }

      // Secondary fetches are non-blocking: failures surface as warnings
      const warnings: string[] = [];

      // Fetch submodules
      let submodules: SubmoduleInfo[] = [];
      try {
        const submodulesData = await apiRequest<
          { submodules?: SubmoduleInfo[] }
        >(API_BASE_URL, `/api/modules/${name}/submodules`, {
          token: authToken,
        });
        submodules = submodulesData.submodules || [];
      } catch {
        warnings.push("SECTIONS UNAVAILABLE");
      }

      // Fetch media content for this module
      let content: ContentItem[] = [];
      if (moduleData.module?.id) {
        try {
          const contentData = await apiRequest<{ content?: ContentItem[] }>(
            API_BASE_URL,
            `/api/content/module/${moduleData.module.id}`,
            { token: authToken },
          );
          content = contentData.content || [];
        } catch {
          warnings.push("MEDIA CONTENT UNAVAILABLE");
        }
      }

      // If no submodules, fetch questions directly
      let questions: QuestionInfo[] = [];
      if (submodules.length === 0) {
        try {
          const questionsData = await apiRequest<
            { questions?: QuestionInfo[] }
          >(API_BASE_URL, `/api/modules/${name}/questions`, {
            token: authToken,
          });
          questions = questionsData.questions || [];
        } catch {
          warnings.push("QUESTIONS UNAVAILABLE");
        }
      }

      ctx.state.resolvedTheme = await getTheme(moduleData.module?.style_theme);
      ctx.state.themeSource = "module";
      return ctx.render({
        module: moduleData.module,
        progress: moduleData.progress,
        accessible: moduleData.accessible,
        is_completed: moduleData.is_completed,
        can_review: moduleData.can_review,
        submodules,
        questions,
        content,
        warnings,
        authToken,
        apiBaseUrl: PUBLIC_API_BASE_URL,
      });
    } catch (error) {
      return ctx.render({
        error: error instanceof Error ? error.message : "Unknown error",
        errorStatus: error instanceof ApiError ? error.status : undefined,
      });
    }
  },
};

function SubmoduleCard(
  { submodule, moduleName }: { submodule: SubmoduleInfo; moduleName: string },
) {
  const statusConfig = {
    NOT_STARTED: {
      bg: "bg-t-text-muted/10",
      text: "text-t-text-muted",
      border: "border-t-text-muted",
    },
    IN_PROGRESS: {
      bg: "bg-t-accent/20",
      text: "text-t-accent",
      border: "border-t-accent",
    },
    COMPLETED: {
      bg: "bg-t-accent-secondary/20",
      text: "text-t-accent-secondary",
      border: "border-t-accent-secondary",
    },
  };

  const status = submodule.progress?.status || "NOT_STARTED";
  const config = statusConfig[status];

  return (
    <div
      class={`
        border-2 p-4 transition-all duration-300
        ${
        submodule.accessible
          ? status === "COMPLETED"
            ? "border-t-accent-secondary/50 bg-t-surface hover:bg-t-surface-light"
            : "border-t-accent bg-t-surface hover:bg-t-surface-light"
          : "border-t-border bg-t-surface opacity-60"
      }
      `}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-t-text-muted text-xs font-mono">
              [{String(submodule.sequence_order).padStart(2, "0")}]
            </span>
            <h3 class="text-lg font-bold text-t-text uppercase">
              {submodule.title}
            </h3>
          </div>

          {submodule.description && (
            <p class="text-t-text-dim text-sm mt-1">
              {submodule.description}
            </p>
          )}

          <p class="text-t-text-muted text-xs mt-2">
            {submodule.questions_count} QUESTIONS
          </p>
        </div>

        <div class="flex-shrink-0">
          {submodule.accessible
            ? (
              <a
                href={`/modules/${moduleName}/${submodule.name}`}
                class={`
                inline-block px-4 py-2 font-bold uppercase text-sm transition-all duration-200
                ${config.border} ${config.text} border-2 hover:${config.bg}
              `}
              >
                {status === "COMPLETED" ? "&gt; REVIEW" : "&gt; ENTER"}
              </a>
            )
            : (
              <span class="inline-block px-4 py-2 border-2 border-t-border text-t-text-muted font-bold uppercase text-sm cursor-not-allowed">
                LOCKED
              </span>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ModulePage({ data, url }: PageProps<ModuleData>) {
  if (data?.error) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-t-text text-shadow-t-accent my-6 uppercase">
              ERROR
            </h1>

            <div class="my-8 px-4 space-y-4" role="alert">
              <p class="text-lg text-t-text-dim">
                &gt; FAILED TO LOAD MODULE
              </p>
              <p class="text-lg text-t-accent text-shadow-t-accent">
                &gt; {data.error}
              </p>
              <p class="text-sm text-t-text-muted">
                &gt; {data.errorStatus ? `HTTP ${data.errorStatus}` : "NETWORK"}
              </p>
            </div>

            <div class="my-8 flex flex-wrap justify-center gap-4">
              <a
                href={url.pathname}
                class="inline-block border-2 border-t-accent px-8 py-4 text-t-accent font-bold uppercase text-lg transition-colors shadow-t-glow bg-t-surface hover:bg-t-surface-light"
              >
                &gt; RETRY
              </a>
              <a
                href="/modules"
                class="inline-block border-2 border-t-accent-secondary px-8 py-4 text-t-accent-secondary font-bold uppercase text-lg transition-colors shadow-t-glow bg-t-surface hover:bg-t-surface-light"
              >
                &gt; RETURN TO MODULES
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    module,
    progress,
    is_completed,
    can_review,
    submodules = [],
    questions = [],
    content = [],
    warnings = [],
    authToken,
    apiBaseUrl,
  } = data;

  const hasSubmodules = submodules.length > 0;
  const hasQuestions = questions.length > 0;
  const hasContent = content.length > 0;

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "[◆]" },
    { label: "Modules", href: "/modules", icon: "[▣]" },
    { label: module?.title || "Module", icon: "[►]" },
  ];

  return (
    <>
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} />

          <WarningBanner warnings={warnings} />

          {/* Module Header */}
          <div class="text-center my-8">
            <p class="text-t-text-muted text-sm mb-2">
              MODULE {String(module?.sequence_order || 0).padStart(2, "0")}
            </p>
            <h1 class="text-4xl font-bold text-t-text text-shadow-t-accent my-4 uppercase tracking-wider">
              {module?.title}
            </h1>
            {module?.description && (
              <p class="text-t-text-dim text-base max-w-lg mx-auto">
                {module.description}
              </p>
            )}

            {/* Status indicator */}
            <div class="mt-6">
              {is_completed
                ? (
                  <span class="inline-block px-4 py-2 border-2 border-t-accent-secondary bg-t-accent-secondary/20 text-t-accent-secondary font-bold uppercase text-sm">
                    COMPLETED
                  </span>
                )
                : progress?.status === "IN_PROGRESS"
                ? (
                  <span class="inline-block px-4 py-2 border-2 border-t-accent bg-t-accent/20 text-t-accent font-bold uppercase text-sm">
                    IN PROGRESS
                  </span>
                )
                : (
                  <span class="inline-block px-4 py-2 border-2 border-t-text-muted bg-t-text-muted/10 text-t-text-muted font-bold uppercase text-sm">
                    NOT STARTED
                  </span>
                )}
            </div>
          </div>

          {/* Media Content */}
          {hasContent && (
            <div class="my-8">
              <MediaContent content={content} />
            </div>
          )}

          {/* Submodules List */}
          {hasSubmodules && (
            <div class="my-8">
              <h2 class="text-xl font-bold text-t-text-dim uppercase mb-4">
                &gt; SECTIONS
              </h2>
              <div class="space-y-3">
                {submodules.map((submodule) => (
                  <SubmoduleCard
                    key={submodule.id}
                    submodule={submodule}
                    moduleName={module?.name || ""}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Direct Questions (via Island for interactivity) */}
          {!hasSubmodules && hasQuestions && (
            <ModuleQuestionnaire
              moduleName={module?.name || ""}
              questions={questions}
              isCompleted={is_completed || false}
              canReview={can_review || false}
              authToken={authToken || ""}
              apiBaseUrl={apiBaseUrl || ""}
            />
          )}

          {/* No content message */}
          {!hasSubmodules && !hasQuestions && (
            <div class="text-center my-16">
              <p class="text-t-text-dim text-lg">
                &gt; NO CONTENT AVAILABLE
              </p>
              <p class="text-t-text-muted text-sm mt-2">
                &gt; THIS MODULE HAS NO QUESTIONS OR SECTIONS
              </p>
            </div>
          )}

          {/* Navigation */}
          <div class="my-8 text-center">
            <a
              href="/modules"
              class="text-t-text-muted hover:text-t-text-dim text-sm transition-colors"
            >
              &gt; BACK TO MODULES
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
