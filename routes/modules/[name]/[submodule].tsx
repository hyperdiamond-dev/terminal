import { Handlers, PageProps } from "$fresh/server.ts";
import SubmoduleQuestionnaire from "../../../islands/SubmoduleQuestionnaire.tsx";
import MediaContent from "../../../components/MediaContent.tsx";
import Breadcrumbs, {
  BreadcrumbItem,
} from "../../../components/Breadcrumbs.tsx";
import WarningBanner from "../../../components/WarningBanner.tsx";
import { getAuthToken } from "../../../lib/cookies.ts";
import { getTheme } from "../../../lib/themes.ts";
import {
  API_BASE_URL,
  ApiError,
  apiRequest,
  type ContentItem,
  PUBLIC_API_BASE_URL,
} from "../../../lib/api.ts";

interface SubmoduleProgress {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  started_at?: string;
  completed_at?: string;
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

interface SubmoduleData {
  module?: {
    name: string;
    title: string;
    style_theme?: string | null;
  };
  submodule?: {
    id?: number;
    name: string;
    title: string;
    description: string | null;
    sequence_order: number;
  };
  progress?: SubmoduleProgress;
  accessible?: boolean;
  is_completed?: boolean;
  questions?: QuestionInfo[];
  content?: ContentItem[];
  warnings?: string[];
  error?: string;
  errorStatus?: number;
  authToken?: string;
  apiBaseUrl?: string;
}

export const handler: Handlers<SubmoduleData> = {
  async GET(req, ctx) {
    const authToken = getAuthToken(req);

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    const { name: moduleName, submodule: submoduleName } = ctx.params;

    try {
      // Secondary fetches are non-blocking: failures surface as warnings
      const warnings: string[] = [];

      // Fetch parent module to get style_theme
      let parentStyleTheme: string | null = null;
      try {
        const parentData = await apiRequest<
          { module?: { style_theme?: string | null } }
        >(API_BASE_URL, `/api/modules/${moduleName}`, { token: authToken });
        parentStyleTheme = parentData.module?.style_theme || null;
      } catch {
        // Theme falls back to default; page still renders
      }

      // Fetch submodule details
      let submoduleData: SubmoduleData;
      try {
        submoduleData = await apiRequest<SubmoduleData>(
          API_BASE_URL,
          `/api/modules/${moduleName}/submodules/${submoduleName}`,
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
          // Submodule not accessible - redirect to module
          return new Response(null, {
            status: 303,
            headers: { Location: `/modules/${moduleName}` },
          });
        }
        throw err;
      }

      // Fetch questions for submodule
      let questions: QuestionInfo[] = [];
      try {
        const questionsData = await apiRequest<{ questions?: QuestionInfo[] }>(
          API_BASE_URL,
          `/api/submodules/${submoduleName}/questions`,
          { token: authToken },
        );
        questions = questionsData.questions || [];
      } catch {
        warnings.push("QUESTIONS UNAVAILABLE");
      }

      // Fetch media content for this submodule
      let content: ContentItem[] = [];
      if (submoduleData.submodule?.id) {
        try {
          const contentData = await apiRequest<{ content?: ContentItem[] }>(
            API_BASE_URL,
            `/api/content/submodule/${submoduleData.submodule.id}`,
            { token: authToken },
          );
          content = contentData.content || [];
        } catch {
          warnings.push("MEDIA CONTENT UNAVAILABLE");
        }
      }

      ctx.state.resolvedTheme = await getTheme(parentStyleTheme);
      ctx.state.themeSource = "module";
      return ctx.render({
        module: {
          name: moduleName,
          title: submoduleData.module?.title || moduleName,
          style_theme: parentStyleTheme,
        },
        submodule: submoduleData.submodule,
        progress: submoduleData.progress,
        accessible: submoduleData.accessible,
        is_completed: submoduleData.progress?.status === "COMPLETED",
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

export default function SubmodulePage(
  { data, url }: PageProps<SubmoduleData>,
) {
  if (data?.error) {
    return (
      <>
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div class="text-center">
              <h1 class="text-4xl font-bold text-t-text text-shadow-t-accent my-6 uppercase">
                ERROR
              </h1>

              <div class="my-8 px-4 space-y-4" role="alert">
                <p class="text-lg text-t-text-dim">
                  &gt; FAILED TO LOAD SECTION
                </p>
                <p class="text-lg text-t-accent text-shadow-t-accent">
                  &gt; {data.error}
                </p>
                <p class="text-sm text-t-text-muted">
                  &gt;{" "}
                  {data.errorStatus ? `HTTP ${data.errorStatus}` : "NETWORK"}
                </p>
              </div>

              <div class="my-8 flex flex-wrap justify-center gap-4">
                <a
                  href={url.pathname}
                  class="inline-block border-2 border-t-accent px-8 py-4 text-t-accent font-bold uppercase text-lg transition-colors shadow-t-glow text-shadow-void-text bg-t-surface hover:bg-t-surface-light"
                >
                  &gt; RETRY
                </a>
                <a
                  href={`/modules/${data.module?.name || ""}`}
                  class="inline-block border-2 border-t-accent-secondary px-8 py-4 text-t-accent-secondary font-bold uppercase text-lg transition-colors shadow-t-glow text-shadow-void-text bg-t-surface hover:bg-t-surface-light"
                >
                  &gt; RETURN TO MODULE
                </a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const {
    module,
    submodule,
    progress,
    is_completed,
    questions = [],
    content = [],
    warnings = [],
    authToken,
    apiBaseUrl,
  } = data;

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "[◆]" },
    { label: "Modules", href: "/modules", icon: "[▣]" },
    {
      label: module?.title || "Module",
      href: module?.name ? `/modules/${module.name}` : undefined,
      icon: "[►]",
    },
    { label: submodule?.title || "Section", icon: "[●]" },
  ];

  return (
    <>
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} />

          <WarningBanner warnings={warnings} />

          {/* Submodule Header */}
          <div class="text-center my-8">
            <p class="text-t-text-muted text-sm mb-2">
              SECTION {String(submodule?.sequence_order || 0).padStart(2, "0")}
            </p>
            <h1 class="text-3xl font-bold text-t-text text-shadow-t-accent my-4 uppercase tracking-wider">
              {submodule?.title}
            </h1>
            {submodule?.description && (
              <p class="text-t-text-dim text-base max-w-lg mx-auto">
                {submodule.description}
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
          {content.length > 0 && (
            <div class="my-8">
              <MediaContent content={content} />
            </div>
          )}

          {/* Questionnaire */}
          {questions.length > 0
            ? (
              <SubmoduleQuestionnaire
                moduleName={module?.name || ""}
                submoduleName={submodule?.name || ""}
                questions={questions}
                isCompleted={is_completed || false}
                authToken={authToken || ""}
                apiBaseUrl={apiBaseUrl || ""}
              />
            )
            : (
              <div class="text-center my-16">
                <p class="text-t-text-dim text-lg">
                  &gt; NO QUESTIONS IN THIS SECTION
                </p>
              </div>
            )}

          {/* Navigation */}
          <div class="my-8 text-center">
            <a
              href={`/modules/${module?.name}`}
              class="text-t-text-muted hover:text-t-text-dim text-sm transition-colors"
            >
              &gt; BACK TO MODULE
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
