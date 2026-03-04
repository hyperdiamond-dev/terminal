import { Handlers, PageProps } from "$fresh/server.ts";
import QuestionRenderer from "../../../islands/QuestionRenderer.tsx";
import { getAuthToken } from "../../../lib/cookies.ts";

interface QuestionInfo {
  id: number;
  question_text: string;
  question_type: "true_false" | "multiple_choice" | "fill_blank" | "free_form";
  sequence_order: number;
  is_required: boolean;
  metadata: Record<string, unknown>;
}

interface ResponseInfo {
  question_id: number;
  response_value: unknown;
  answered_at: string;
}

interface ReviewData {
  module?: {
    name: string;
    title: string;
    description: string | null;
    sequence_order: number;
    style_theme?: string | null;
  };
  responses?: Record<string, unknown>;
  questions?: QuestionInfo[];
  completed_at?: string;
  error?: string;
}

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

export const handler: Handlers<ReviewData> = {
  async GET(req, ctx) {
    const authToken = getAuthToken(req);

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    const { name: moduleName } = ctx.params;

    try {
      // Fetch module data
      const moduleResponse = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}`,
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
          return new Response(null, {
            status: 303,
            headers: { Location: "/modules" },
          });
        }
        throw new Error("Failed to fetch module");
      }

      const moduleData = await moduleResponse.json();

      // Check if module is completed (review mode only for completed modules)
      if (!moduleData.is_completed) {
        return new Response(null, {
          status: 303,
          headers: { Location: `/modules/${moduleName}` },
        });
      }

      // Fetch module responses
      const responsesResponse = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}/responses`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let responses: Record<string, unknown> = {};
      let completedAt: string | undefined;
      if (responsesResponse.ok) {
        const data = await responsesResponse.json();
        responses = data.responses || {};
        completedAt = data.completed_at;
      }

      // Fetch questions
      const questionsResponse = await fetch(
        `${API_BASE_URL}/api/questions/modules/${moduleName}/questions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let questions: QuestionInfo[] = [];
      if (questionsResponse.ok) {
        const data = await questionsResponse.json();
        questions = data.questions || [];
      }

      ctx.state.styleTheme = moduleData.module?.style_theme;
      return ctx.render({
        module: moduleData.module,
        responses,
        questions,
        completed_at: completedAt,
      });
    } catch (error) {
      return ctx.render({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};

export default function ReviewPage({ data }: PageProps<ReviewData>) {
  if (data?.error) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-t-text text-shadow-t-accent my-6 uppercase">
              ERROR
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-t-text-dim">
                &gt; FAILED TO LOAD REVIEW
              </p>
              <p class="text-lg text-t-accent text-shadow-t-accent">
                &gt; {data.error}
              </p>
            </div>

            <div class="my-8">
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

  const { module, responses = {}, questions = [], completed_at } = data;

  return (
    <>
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto">
          {/* Breadcrumb */}
          <div class="mb-6">
            <a
              href="/modules"
              class="text-t-text-muted hover:text-t-text-dim text-sm transition-colors"
            >
              &lt; BACK TO MODULES
            </a>
          </div>

          {/* Header */}
          <div class="text-center my-8">
            <div class="inline-block px-4 py-2 border-2 border-t-accent-secondary bg-t-accent-secondary/20 text-t-accent-secondary font-bold uppercase text-sm mb-4">
              REVIEW MODE
            </div>

            <p class="text-t-text-muted text-sm mb-2">
              MODULE {String(module?.sequence_order || 0).padStart(2, "0")}
            </p>
            <h1 class="text-3xl font-bold text-t-text text-shadow-t-accent my-4 uppercase tracking-wider">
              {module?.title}
            </h1>
            {module?.description && (
              <p class="text-t-text-dim text-base max-w-lg mx-auto">
                {module.description}
              </p>
            )}

            {completed_at && (
              <p class="text-t-text-muted text-sm mt-4">
                &gt; COMPLETED: {new Date(completed_at).toLocaleDateString()} at
                {" "}
                {new Date(completed_at).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Review Mode Banner */}
          <div class="border-2 border-t-accent-secondary bg-t-accent-secondary/10 px-4 py-3 mb-6">
            <p class="text-t-accent-secondary font-bold uppercase text-center">
              &gt; READ-ONLY VIEW - YOUR RESPONSES HAVE BEEN RECORDED
            </p>
          </div>

          {/* Questions with Responses */}
          {questions.length > 0
            ? (
              <div class="space-y-6">
                {questions
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((question, index) => (
                    <div
                      key={question.id}
                      class="border-2 border-t-border bg-t-surface p-4"
                    >
                      <p class="text-t-text-muted text-xs mb-2">
                        QUESTION {String(index + 1).padStart(2, "0")}
                      </p>
                      <QuestionRenderer
                        question={question}
                        onAnswer={() => {}}
                        value={responses[String(question.id)] as
                          | string
                          | string[]
                          | boolean
                          | undefined}
                        disabled
                      />
                    </div>
                  ))}
              </div>
            )
            : (
              <div class="text-center my-16">
                <p class="text-t-text-dim text-lg">
                  &gt; NO QUESTIONS TO REVIEW
                </p>
              </div>
            )}

          {/* Navigation */}
          <div class="my-8 flex justify-center gap-4">
            <a
              href="/modules"
              class="inline-block border-2 border-t-accent-secondary px-8 py-4 text-t-accent-secondary font-bold uppercase text-sm transition-colors shadow-t-glow bg-t-surface hover:bg-t-surface-light"
            >
              &gt; BACK TO MODULES
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
