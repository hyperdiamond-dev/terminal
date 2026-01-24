import { useSignal, useComputed } from "@preact/signals";
import type { Question } from "../lib/api.ts";
import QuestionRenderer from "./QuestionRenderer.tsx";

interface QuestionWithResponse extends Question {
  user_response: {
    response_value: unknown;
    answered_at: string;
  } | null;
}

interface ModuleQuestionnaireProps {
  moduleName: string;
  questions: QuestionWithResponse[];
  isCompleted: boolean;
  canReview: boolean;
  authToken: string;
}

type ResponseValue = string | string[] | boolean;

const API_BASE_URL = "http://localhost:8000";

export default function ModuleQuestionnaire({
  moduleName,
  questions,
  isCompleted,
  canReview,
  authToken,
}: ModuleQuestionnaireProps) {
  const responses = useSignal<Record<number, ResponseValue>>(() => {
    // Initialize with existing responses
    const initial: Record<number, ResponseValue> = {};
    for (const q of questions) {
      if (q.user_response?.response_value !== undefined) {
        initial[q.id] = q.user_response.response_value as ResponseValue;
      }
    }
    return initial;
  });

  const isStarted = useSignal(questions.some((q) => q.user_response !== null));
  const isSubmitting = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal<string | null>(null);
  const showCompletion = useSignal(false);

  const answeredCount = useComputed(() => {
    return Object.keys(responses.value).length;
  });

  const requiredCount = useComputed(() => {
    return questions.filter((q) => q.is_required).length;
  });

  const requiredAnswered = useComputed(() => {
    return questions.filter(
      (q) => q.is_required && responses.value[q.id] !== undefined,
    ).length;
  });

  const canSubmit = useComputed(() => {
    return requiredAnswered.value >= requiredCount.value && !isCompleted;
  });

  const handleAnswer = (questionId: number, value: ResponseValue) => {
    responses.value = {
      ...responses.value,
      [questionId]: value,
    };
    error.value = null;
  };

  const startModule = async () => {
    isSubmitting.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start module");
      }

      isStarted.value = true;
      success.value = "MODULE STARTED SUCCESSFULLY";
      setTimeout(() => (success.value = null), 3000);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to start module";
    } finally {
      isSubmitting.value = false;
    }
  };

  const saveProgress = async () => {
    isSubmitting.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ responses: responses.value }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save progress");
      }

      success.value = "PROGRESS SAVED";
      setTimeout(() => (success.value = null), 3000);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to save progress";
    } finally {
      isSubmitting.value = false;
    }
  };

  const completeModule = async () => {
    if (!canSubmit.value) return;

    isSubmitting.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/modules/${moduleName}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            responses: responses.value,
            metadata: { completed_from: "terminal_frontend" },
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete module");
      }

      const data = await response.json();
      showCompletion.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to complete module";
    } finally {
      isSubmitting.value = false;
    }
  };

  // Completion screen
  if (showCompletion.value) {
    return (
      <div class="my-8 text-center">
        <div class="border-2 border-analog-blue bg-analog-blue/10 p-8 my-6">
          <h2 class="text-3xl font-bold text-analog-blue text-shadow-vhs-blue uppercase mb-4">
            MODULE COMPLETE
          </h2>
          <p class="text-vhs-white-dim text-lg mb-6">
            &gt; YOUR RESPONSES HAVE BEEN RECORDED
          </p>
          <p class="text-vhs-gray text-sm">
            &gt; {answeredCount.value} QUESTIONS ANSWERED
          </p>
        </div>

        <div class="my-8 space-x-4">
          <a
            href="/modules"
            class="inline-block border-2 border-analog-purple px-8 py-4 text-analog-purple font-bold uppercase text-lg transition-colors shadow-vhs-glow-purple text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
          >
            &gt; CONTINUE TO NEXT MODULE
          </a>
        </div>
      </div>
    );
  }

  // Review mode (completed module)
  if (isCompleted && canReview) {
    return (
      <div class="my-8">
        <div class="border-2 border-analog-blue bg-analog-blue/10 px-4 py-3 mb-6">
          <p class="text-analog-blue font-bold uppercase">
            &gt; REVIEW MODE - RESPONSES ARE READ-ONLY
          </p>
        </div>

        <div class="space-y-6">
          {questions
            .sort((a, b) => a.sequence_order - b.sequence_order)
            .map((question, index) => (
              <div
                key={question.id}
                class="border-2 border-vhs-gray-dark bg-decay-smoke/20 p-4"
              >
                <p class="text-vhs-gray text-xs mb-2">
                  QUESTION {String(index + 1).padStart(2, "0")}
                </p>
                <QuestionRenderer
                  question={question}
                  onAnswer={() => {}}
                  value={responses.value[question.id]}
                  disabled={true}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Not started yet
  if (!isStarted.value && !isCompleted) {
    return (
      <div class="my-8 text-center">
        <div class="border-2 border-vhs-gray-dark bg-decay-smoke/30 p-8 my-6">
          <p class="text-vhs-white-dim text-lg mb-4">
            &gt; THIS MODULE CONTAINS {questions.length} QUESTIONS
          </p>
          <p class="text-vhs-gray text-sm mb-6">
            &gt; {requiredCount.value} REQUIRED RESPONSES
          </p>

          <button
            onClick={startModule}
            disabled={isSubmitting.value}
            class={`
              inline-block border-2 border-analog-purple px-10 py-5 text-analog-purple font-bold uppercase text-lg transition-all duration-300 shadow-vhs-glow-purple text-shadow-void-text bg-decay-smoke/30
              ${
              isSubmitting.value
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-analog-purple/20"
            }
            `}
          >
            {isSubmitting.value ? "&gt; STARTING..." : "&gt; BEGIN MODULE"}
          </button>
        </div>

        {error.value && (
          <p class="text-analog-red text-shadow-vhs-red mt-4">
            &gt; ERROR: {error.value}
          </p>
        )}
      </div>
    );
  }

  // Active questionnaire
  return (
    <div class="my-8">
      {/* Progress header */}
      <div class="border-2 border-vhs-gray-dark bg-decay-smoke/30 px-4 py-3 mb-6">
        <div class="flex justify-between items-center">
          <p class="text-vhs-white-dim text-sm">
            &gt; PROGRESS: {answeredCount.value} / {questions.length} ANSWERED
          </p>
          <p class="text-vhs-gray text-sm">
            {requiredAnswered.value} / {requiredCount.value} REQUIRED
          </p>
        </div>
        <div class="w-full h-2 bg-decay-ash mt-2">
          <div
            class="h-full bg-analog-purple transition-all duration-300"
            style={{
              width: `${(answeredCount.value / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Messages */}
      {error.value && (
        <div class="border-2 border-analog-red bg-analog-red/10 px-4 py-3 mb-6">
          <p class="text-analog-red text-shadow-vhs-red">
            &gt; ERROR: {error.value}
          </p>
        </div>
      )}

      {success.value && (
        <div class="border-2 border-analog-blue bg-analog-blue/10 px-4 py-3 mb-6">
          <p class="text-analog-blue">&gt; {success.value}</p>
        </div>
      )}

      {/* Questions */}
      <div class="space-y-6">
        {questions
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map((question, index) => (
            <div
              key={question.id}
              class="border-2 border-vhs-gray-dark bg-decay-smoke/20 p-4"
            >
              <p class="text-vhs-gray text-xs mb-2">
                QUESTION {String(index + 1).padStart(2, "0")}
                {question.is_required && (
                  <span class="text-analog-red ml-2">* REQUIRED</span>
                )}
              </p>
              <QuestionRenderer
                question={question}
                onAnswer={handleAnswer}
                value={responses.value[question.id]}
                disabled={isCompleted}
              />
            </div>
          ))}
      </div>

      {/* Action buttons */}
      <div class="my-8 flex justify-center gap-4">
        <button
          onClick={saveProgress}
          disabled={isSubmitting.value}
          class={`
            border-2 border-vhs-gray px-6 py-3 text-vhs-gray font-bold uppercase text-sm transition-all duration-200
            ${
            isSubmitting.value
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-vhs-white-dim hover:text-vhs-white-dim hover:bg-decay-smoke/50"
          }
          `}
        >
          {isSubmitting.value ? "SAVING..." : "SAVE PROGRESS"}
        </button>

        <button
          onClick={completeModule}
          disabled={!canSubmit.value || isSubmitting.value}
          class={`
            border-2 px-8 py-3 font-bold uppercase text-sm transition-all duration-300
            ${
            canSubmit.value && !isSubmitting.value
              ? "border-analog-purple text-analog-purple shadow-vhs-glow-purple hover:bg-analog-purple/20"
              : "border-vhs-gray-dark text-vhs-gray opacity-50 cursor-not-allowed"
          }
          `}
        >
          {isSubmitting.value
            ? "SUBMITTING..."
            : canSubmit.value
            ? "COMPLETE MODULE"
            : `${requiredCount.value - requiredAnswered.value} REQUIRED LEFT`}
        </button>
      </div>
    </div>
  );
}
