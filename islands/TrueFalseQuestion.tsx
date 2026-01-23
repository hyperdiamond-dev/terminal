import { useSignal } from "@preact/signals";
import type { Question } from "../lib/api.ts";

interface TrueFalseQuestionProps {
  question: Question;
  onAnswer: (value: boolean) => void;
  value?: boolean;
  disabled?: boolean;
}

export default function TrueFalseQuestion({
  question,
  onAnswer,
  value,
  disabled = false,
}: TrueFalseQuestionProps) {
  const metadata = question.metadata as {
    true_label?: string;
    false_label?: string;
  };
  const trueLabel = metadata.true_label || "TRUE";
  const falseLabel = metadata.false_label || "FALSE";

  const selected = useSignal<boolean | null>(value ?? null);

  const handleSelect = (val: boolean) => {
    if (disabled) return;
    selected.value = val;
    onAnswer(val);
  };

  return (
    <div class="my-6">
      <div class="mb-4">
        <p class="text-lg text-vhs-white font-medium">
          <span class="text-analog-blue">&gt;</span> {question.question_text}
          {question.is_required && (
            <span class="text-analog-red ml-2">*</span>
          )}
        </p>
      </div>

      <div class="flex gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelect(true)}
          class={`
            flex-1 px-6 py-4 border-2 font-bold uppercase text-lg transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${
            selected.value === true
              ? "border-analog-blue bg-analog-blue/20 text-analog-blue shadow-vhs-glow-blue text-shadow-vhs-blue"
              : "border-vhs-gray-dark bg-decay-smoke/30 text-vhs-white-dim hover:border-vhs-gray hover:bg-decay-smoke/50"
          }
          `}
        >
          <span class="flex items-center justify-center gap-2">
            <span
              class={`
              w-4 h-4 rounded-full border-2 flex-shrink-0
              ${
                selected.value === true
                  ? "border-analog-blue bg-analog-blue"
                  : "border-vhs-gray"
              }
            `}
            />
            {trueLabel}
          </span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelect(false)}
          class={`
            flex-1 px-6 py-4 border-2 font-bold uppercase text-lg transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${
            selected.value === false
              ? "border-analog-red bg-analog-red/20 text-analog-red shadow-vhs-glow text-shadow-vhs-red"
              : "border-vhs-gray-dark bg-decay-smoke/30 text-vhs-white-dim hover:border-vhs-gray hover:bg-decay-smoke/50"
          }
          `}
        >
          <span class="flex items-center justify-center gap-2">
            <span
              class={`
              w-4 h-4 rounded-full border-2 flex-shrink-0
              ${
                selected.value === false
                  ? "border-analog-red bg-analog-red"
                  : "border-vhs-gray"
              }
            `}
            />
            {falseLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
