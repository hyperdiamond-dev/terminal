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
        <p class="text-lg text-t-text font-medium">
          <span class="text-t-accent-secondary">&gt;</span>
          {question.question_text}
          {question.is_required && <span class="text-t-accent ml-2">*</span>}
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
              ? "border-t-accent-secondary bg-t-accent-secondary/20 text-t-accent-secondary shadow-t-glow text-shadow-t-accent"
              : "border-t-border bg-t-surface text-t-text-dim hover:border-t-text-muted hover:bg-t-surface-light"
          }
          `}
        >
          <span class="flex items-center justify-center gap-2">
            <span
              class={`
              w-4 h-4 rounded-full border-2 flex-shrink-0
              ${
                selected.value === true
                  ? "border-t-accent-secondary bg-t-accent-secondary"
                  : "border-t-text-muted"
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
              ? "border-t-accent bg-t-accent/20 text-t-accent shadow-t-glow text-shadow-t-accent"
              : "border-t-border bg-t-surface text-t-text-dim hover:border-t-text-muted hover:bg-t-surface-light"
          }
          `}
        >
          <span class="flex items-center justify-center gap-2">
            <span
              class={`
              w-4 h-4 rounded-full border-2 flex-shrink-0
              ${
                selected.value === false
                  ? "border-t-accent bg-t-accent"
                  : "border-t-text-muted"
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
