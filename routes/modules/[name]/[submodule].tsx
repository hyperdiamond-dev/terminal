import { Handlers, PageProps } from "$fresh/server.ts";
import SubmoduleQuestionnaire from "../../../islands/SubmoduleQuestionnaire.tsx";
import MediaContent from "../../../components/MediaContent.tsx";
import Breadcrumbs, {
  BreadcrumbItem,
} from "../../../components/Breadcrumbs.tsx";
import { getAuthToken } from "../../../lib/cookies.ts";
import { getTheme } from "../../../lib/themes.ts";
import type { ContentItem } from "../../../lib/api.ts";

interface SubmoduleProgress {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  started_at?: string;
  completed_at?: string;
}

interface QuestionInfo {
  id: number;
  question_text: string;
  question_type: "true_false" | "multiple_choice" | "fill_blank" | "free_form";
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
  error?: string;
  authToken?: string;
  apiBaseUrl?: string;
}

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

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
      // Fetch parent module to get style_theme
      const parentModuleResponse = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      let parentStyleTheme: string | null = null;
      if (parentModuleResponse.ok) {
        const parentData = await parentModuleResponse.json();
        parentStyleTheme = parentData.module?.style_theme || null;
      }

      // Fetch submodule details
      const submoduleResponse = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}/submodules/${submoduleName}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!submoduleResponse.ok) {
        if (submoduleResponse.status === 401) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/" },
          });
        }
        if (submoduleResponse.status === 403) {
          // Submodule not accessible - redirect to module
          return new Response(null, {
            status: 303,
            headers: { Location: `/modules/${moduleName}` },
          });
        }
        throw new Error("Failed to fetch submodule");
      }

      const submoduleData = await submoduleResponse.json();

      // Fetch questions for submodule
      const questionsResponse = await fetch(
        `${API_BASE_URL}/api/questions/submodules/${submoduleName}/questions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let questions: QuestionInfo[] = [];
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        questions = questionsData.questions || [];
      }

      // Fetch media content for this submodule
      let content: ContentItem[] = [];
      if (submoduleData.submodule?.id) {
        const contentResponse = await fetch(
          `${API_BASE_URL}/api/content/submodule/${submoduleData.submodule.id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          content = contentData.content || [];
        }
      }

      ctx.state.resolvedTheme = await getTheme(parentStyleTheme);
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
        authToken,
        apiBaseUrl: API_BASE_URL,
      });
    } catch (error) {
      return ctx.render({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};

export default function SubmodulePage({ data }: PageProps<SubmoduleData>) {
  if (data?.error) {
    return (
      <>
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div class="text-center">
              <h1 class="text-4xl font-bold text-t-text text-shadow-t-accent my-6 uppercase">
                ERROR
              </h1>

              <div class="my-8 px-4 space-y-4">
                <p class="text-lg text-t-text-dim">
                  &gt; FAILED TO LOAD SECTION
                </p>
                <p class="text-lg text-t-accent text-shadow-t-accent">
                  &gt; {data.error}
                </p>
              </div>

              <div class="my-8">
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
