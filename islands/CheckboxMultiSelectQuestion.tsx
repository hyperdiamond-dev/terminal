import { useSignal } from "@preact/signals";
import type { Question } from "../lib/api.ts";

interface CheckboxMultiSelectQuestionProps {
  question: Question;
  onAnswer: (value: string[]) => void;
  value?: string[];
  disabled?: boolean;
}

interface Choice {
  id: string;
  text: string;
  value: string;
}

export default function CheckboxMultiSelectQuestion({
  question,
  onAnswer,
  value,
  disabled = false,
}: CheckboxMultiSelectQuestionProps) {
  const metadata = question.metadata as {
    choices?: Choice[];
    options?: string[];
  };
  // levelzero authors options as a plain string list; utopia uses choices
  const choices: Choice[] = metadata.choices ??
    (metadata.options ?? []).map((option) => ({
      id: option,
      text: option,
      value: option,
    }));

  const selected = useSignal<string[]>(value ?? []);

  const handleSelect = (choiceValue: string) => {
    if (disabled) return;

    const newValue = selected.value.includes(choiceValue)
      ? selected.value.filter((v) => v !== choiceValue)
      : [...selected.value, choiceValue];
    selected.value = newValue;
    onAnswer(newValue);
  };

  const isSelected = (choiceValue: string): boolean =>
    selected.value.includes(choiceValue);

  return (
    <div class="my-6">
      <div class="mb-4">
        {question.question_text && (
          <p class="text-lg text-t-text font-medium">
            <span class="text-t-accent">&gt;</span> {question.question_text}
            {question.is_required && <span class="text-t-accent ml-2">*</span>}
          </p>
        )}
        <p class="text-sm text-t-text-muted mt-1">
          &gt; SELECT ALL THAT APPLY
        </p>
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
                ${
                  isSelected(choice.value)
                    ? "border-t-accent bg-t-accent"
                    : "border-t-text-muted"
                }
              `}
              >
                {isSelected(choice.value) && (
                  <span class="text-t-text text-xs font-bold">X</span>
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
