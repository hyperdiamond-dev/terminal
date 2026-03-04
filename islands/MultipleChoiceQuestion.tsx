import { useSignal } from "@preact/signals";
import type { Question } from "../lib/api.ts";

interface MultipleChoiceQuestionProps {
  question: Question;
  onAnswer: (value: string | string[]) => void;
  value?: string | string[];
  disabled?: boolean;
}

interface Choice {
  id: string;
  text: string;
  value: string;
}

export default function MultipleChoiceQuestion({
  question,
  onAnswer,
  value,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const metadata = question.metadata as {
    choices?: Choice[];
    allow_multiple?: boolean;
  };
  const choices = metadata.choices || [];
  const allowMultiple = metadata.allow_multiple || false;

  // For single select, value is a string; for multi, it's an array
  const selected = useSignal<string | string[]>(
    value ?? (allowMultiple ? [] : ""),
  );

  const handleSelect = (choiceValue: string) => {
    if (disabled) return;

    if (allowMultiple) {
      const currentArray = Array.isArray(selected.value) ? selected.value : [];
      const newValue = currentArray.includes(choiceValue)
        ? currentArray.filter((v) => v !== choiceValue)
        : [...currentArray, choiceValue];
      selected.value = newValue;
      onAnswer(newValue);
    } else {
      selected.value = choiceValue;
      onAnswer(choiceValue);
    }
  };

  const isSelected = (choiceValue: string): boolean => {
    if (allowMultiple) {
      return Array.isArray(selected.value) &&
        selected.value.includes(choiceValue);
    }
    return selected.value === choiceValue;
  };

  return (
    <div class="my-6">
      <div class="mb-4">
        <p class="text-lg text-t-text font-medium">
          <span class="text-t-accent">&gt;</span> {question.question_text}
          {question.is_required && <span class="text-t-accent ml-2">*</span>}
        </p>
        {allowMultiple && (
          <p class="text-sm text-t-text-muted mt-1">
            &gt; SELECT ALL THAT APPLY
          </p>
        )}
      </div>

      <div class="space-y-3">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(choice.value)}
            class={`
              w-full text-left px-4 py-3 border-2 transition-all duration-200
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${
              isSelected(choice.value)
                ? "border-t-accent bg-t-accent/20 text-t-text shadow-t-glow"
                : "border-t-border bg-t-surface text-t-text-dim hover:border-t-text-muted hover:bg-t-surface-light"
            }
            `}
          >
            <span class="flex items-center gap-3">
              <span
                class={`
                w-5 h-5 border-2 flex items-center justify-center flex-shrink-0
                ${allowMultiple ? "" : "rounded-full"}
                ${
                  isSelected(choice.value)
                    ? "border-t-accent bg-t-accent"
                    : "border-t-text-muted"
                }
              `}
              >
                {isSelected(choice.value) && (
                  <span class="text-t-text text-xs font-bold">
                    {allowMultiple ? "X" : "O"}
                  </span>
                )}
              </span>
              <span class="font-medium">{choice.text}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
