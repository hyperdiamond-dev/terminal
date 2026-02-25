import { Handlers, PageProps } from "$fresh/server.ts";
import ModuleQuestionnaire from "../../islands/ModuleQuestionnaire.tsx";
import MediaContent from "../../components/MediaContent.tsx";
import { getAuthToken } from "../../lib/cookies.ts";

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
  question_type: "true_false" | "multiple_choice" | "fill_blank" | "free_form";
  sequence_order: number;
  is_required: boolean;
  metadata: Record<string, unknown>;
  user_response: {
    response_value: unknown;
    answered_at: string;
  } | null;
}

interface ContentItem {
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

interface ModuleData {
  module?: {
    id?: number;
    name: string;
    title: string;
    description: string | null;
    sequence_order: number;
  };
  progress?: ModuleProgress;
  accessible?: boolean;
  is_completed?: boolean;
  can_review?: boolean;
  submodules?: SubmoduleInfo[];
  questions?: QuestionInfo[];
  content?: ContentItem[];
  error?: string;
  authToken?: string;
  apiBaseUrl?: string;
}

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

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
      const moduleResponse = await fetch(
        `${API_BASE_URL}/api/modules/${name}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!moduleResponse.ok) {
        if (moduleResponse.status === 401) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/" },
          });
        }
        if (moduleResponse.status === 403) {
          // Module not accessible - redirect to modules list
          return new Response(null, {
            status: 303,
            headers: { Location: "/modules" },
          });
        }
        throw new Error("Failed to fetch module");
      }

      const moduleData = await moduleResponse.json();

      // Fetch submodules
      const submodulesResponse = await fetch(
        `${API_BASE_URL}/api/modules/${name}/submodules`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let submodules: SubmoduleInfo[] = [];
      if (submodulesResponse.ok) {
        const submodulesData = await submodulesResponse.json();
        submodules = submodulesData.submodules || [];
      }

      // Fetch media content for this module
      let content: ContentItem[] = [];
      if (moduleData.module?.id) {
        const contentResponse = await fetch(
          `${API_BASE_URL}/api/content/module/${moduleData.module.id}`,
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

      // If no submodules, fetch questions directly
      let questions: QuestionInfo[] = [];
      if (submodules.length === 0) {
        const questionsResponse = await fetch(
          `${API_BASE_URL}/api/questions/modules/${name}/questions`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          questions = questionsData.questions || [];
        }
      }

      return ctx.render({
        module: moduleData.module,
        progress: moduleData.progress,
        accessible: moduleData.accessible,
        is_completed: moduleData.is_completed,
        can_review: moduleData.can_review,
        submodules,
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

function SubmoduleCard(
  { submodule, moduleName }: { submodule: SubmoduleInfo; moduleName: string },
) {
  const statusConfig = {
    NOT_STARTED: {
      bg: "bg-vhs-gray-dark/50",
      text: "text-vhs-gray",
      border: "border-vhs-gray-dark",
    },
    IN_PROGRESS: {
      bg: "bg-analog-purple/20",
      text: "text-analog-purple",
      border: "border-analog-purple",
    },
    COMPLETED: {
      bg: "bg-analog-blue/20",
      text: "text-analog-blue",
      border: "border-analog-blue",
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
            ? "border-analog-blue/50 bg-decay-smoke/20 hover:bg-decay-smoke/40"
            : "border-analog-purple bg-decay-smoke/30 hover:bg-decay-smoke/50"
          : "border-vhs-gray-dark bg-decay-ash/30 opacity-60"
      }
      `}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-vhs-gray text-xs font-mono">
              [{String(submodule.sequence_order).padStart(2, "0")}]
            </span>
            <h3 class="text-lg font-bold text-vhs-white uppercase">
              {submodule.title}
            </h3>
          </div>

          {submodule.description && (
            <p class="text-vhs-white-dim text-sm mt-1">
              {submodule.description}
            </p>
          )}

          <p class="text-vhs-gray text-xs mt-2">
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
              <span class="inline-block px-4 py-2 border-2 border-vhs-gray-dark text-vhs-gray font-bold uppercase text-sm cursor-not-allowed">
                LOCKED
              </span>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ModulePage({ data }: PageProps<ModuleData>) {
  if (data?.error) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
              ERROR
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-vhs-white-dim">
                &gt; FAILED TO LOAD MODULE
              </p>
              <p class="text-lg text-analog-red text-shadow-vhs-red">
                &gt; {data.error}
              </p>
            </div>

            <div class="my-8">
              <a
                href="/modules"
                class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-lg transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
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
    authToken,
    apiBaseUrl,
  } = data;

  const hasSubmodules = submodules.length > 0;
  const hasQuestions = questions.length > 0;
  const hasContent = content.length > 0;

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto">
        {/* Module Header */}
        <div class="text-center my-8">
          <p class="text-vhs-gray text-sm mb-2">
            MODULE {String(module?.sequence_order || 0).padStart(2, "0")}
          </p>
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-purple my-4 uppercase tracking-wider">
            {module?.title}
          </h1>
          {module?.description && (
            <p class="text-vhs-white-dim text-base max-w-lg mx-auto">
              {module.description}
            </p>
          )}

          {/* Status indicator */}
          <div class="mt-6">
            {is_completed
              ? (
                <span class="inline-block px-4 py-2 border-2 border-analog-blue bg-analog-blue/20 text-analog-blue font-bold uppercase text-sm">
                  COMPLETED
                </span>
              )
              : progress?.status === "IN_PROGRESS"
              ? (
                <span class="inline-block px-4 py-2 border-2 border-analog-purple bg-analog-purple/20 text-analog-purple font-bold uppercase text-sm">
                  IN PROGRESS
                </span>
              )
              : (
                <span class="inline-block px-4 py-2 border-2 border-vhs-gray bg-vhs-gray-dark/50 text-vhs-gray font-bold uppercase text-sm">
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
            <h2 class="text-xl font-bold text-vhs-white-dim uppercase mb-4">
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
            <p class="text-vhs-white-dim text-lg">
              &gt; NO CONTENT AVAILABLE
            </p>
            <p class="text-vhs-gray text-sm mt-2">
              &gt; THIS MODULE HAS NO QUESTIONS OR SECTIONS
            </p>
          </div>
        )}

        {/* Navigation */}
        <div class="my-8 text-center">
          <a
            href="/modules"
            class="text-vhs-gray hover:text-vhs-white-dim text-sm transition-colors"
          >
            &gt; BACK TO MODULES
          </a>
        </div>
      </div>
    </div>
  );
}
