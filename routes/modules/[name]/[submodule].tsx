import { Handlers, PageProps } from "$fresh/server.ts";
import SubmoduleQuestionnaire from "../../../islands/SubmoduleQuestionnaire.tsx";

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
  };
  submodule?: {
    name: string;
    title: string;
    description: string | null;
    sequence_order: number;
  };
  progress?: SubmoduleProgress;
  accessible?: boolean;
  is_completed?: boolean;
  questions?: QuestionInfo[];
  error?: string;
  authToken?: string;
}

const API_BASE_URL =
  Deno.env.get("API_BASE_URL") || "http://localhost:8000";

export const handler: Handlers<SubmoduleData> = {
  async GET(req, ctx) {
    const cookies = req.headers.get("cookie");
    const authToken = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1];

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    const { name: moduleName, submodule: submoduleName } = ctx.params;

    try {
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

      return ctx.render({
        module: {
          name: moduleName,
          title: submoduleData.module?.title || moduleName,
        },
        submodule: submoduleData.submodule,
        progress: submoduleData.progress,
        accessible: submoduleData.accessible,
        is_completed: submoduleData.progress?.status === "COMPLETED",
        questions,
        authToken,
      });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  },
};

export default function SubmodulePage({ data }: PageProps<SubmoduleData>) {
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
                &gt; FAILED TO LOAD SECTION
              </p>
              <p class="text-lg text-analog-red text-shadow-vhs-red">
                &gt; {data.error}
              </p>
            </div>

            <div class="my-8">
              <a
                href={`/modules/${data.module?.name || ""}`}
                class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-lg transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; RETURN TO MODULE
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    module,
    submodule,
    progress,
    is_completed,
    questions = [],
    authToken,
  } = data;

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto">
        {/* Breadcrumb */}
        <div class="mb-6">
          <a
            href={`/modules/${module?.name}`}
            class="text-vhs-gray hover:text-vhs-white-dim text-sm transition-colors"
          >
            &lt; BACK TO {module?.title?.toUpperCase() || "MODULE"}
          </a>
        </div>

        {/* Submodule Header */}
        <div class="text-center my-8">
          <p class="text-vhs-gray text-sm mb-2">
            SECTION {String(submodule?.sequence_order || 0).padStart(2, "0")}
          </p>
          <h1 class="text-3xl font-bold text-vhs-white text-shadow-vhs-purple my-4 uppercase tracking-wider">
            {submodule?.title}
          </h1>
          {submodule?.description && (
            <p class="text-vhs-white-dim text-base max-w-lg mx-auto">
              {submodule.description}
            </p>
          )}

          {/* Status indicator */}
          <div class="mt-6">
            {is_completed ? (
              <span class="inline-block px-4 py-2 border-2 border-analog-blue bg-analog-blue/20 text-analog-blue font-bold uppercase text-sm">
                COMPLETED
              </span>
            ) : progress?.status === "IN_PROGRESS" ? (
              <span class="inline-block px-4 py-2 border-2 border-analog-purple bg-analog-purple/20 text-analog-purple font-bold uppercase text-sm">
                IN PROGRESS
              </span>
            ) : (
              <span class="inline-block px-4 py-2 border-2 border-vhs-gray bg-vhs-gray-dark/50 text-vhs-gray font-bold uppercase text-sm">
                NOT STARTED
              </span>
            )}
          </div>
        </div>

        {/* Questionnaire */}
        {questions.length > 0 ? (
          <SubmoduleQuestionnaire
            moduleName={module?.name || ""}
            submoduleName={submodule?.name || ""}
            questions={questions}
            isCompleted={is_completed || false}
            authToken={authToken || ""}
          />
        ) : (
          <div class="text-center my-16">
            <p class="text-vhs-white-dim text-lg">
              &gt; NO QUESTIONS IN THIS SECTION
            </p>
          </div>
        )}

        {/* Navigation */}
        <div class="my-8 text-center">
          <a
            href={`/modules/${module?.name}`}
            class="text-vhs-gray hover:text-vhs-white-dim text-sm transition-colors"
          >
            &gt; BACK TO MODULE
          </a>
        </div>
      </div>
    </div>
  );
}
