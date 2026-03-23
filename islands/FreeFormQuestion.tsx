import { useComputed, useSignal } from "@preact/signals";
import type { Question } from "../lib/api.ts";

interface FreeFormQuestionProps {
  question: Question;
  onAnswer: (value: string) => void;
  value?: string;
  disabled?: boolean;
}

export default function FreeFormQuestion({
  question,
  onAnswer,
  value,
  disabled = false,
}: FreeFormQuestionProps) {
  const metadata = question.metadata as {
    max_length?: number;
    min_words?: number;
    max_words?: number;
    placeholder?: string;
    rows?: number;
  };

  const inputValue = useSignal(value || "");
  const error = useSignal<string | null>(null);
  const isFocused = useSignal(false);

  const wordCount = useComputed(() => {
    const trimmed = inputValue.value.trim();
    if (trimmed.length === 0) return 0;
    return trimmed.split(/\s+/).length;
  });

  const charCount = useComputed(() => inputValue.value.length);

  const validate = (val: string): boolean => {
    const trimmed = val.trim();
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

    if (question.is_required && trimmed.length === 0) {
      error.value = "RESPONSE REQUIRED";
      return false;
    }

    if (metadata.min_words && words < metadata.min_words) {
      error.value = `MINIMUM ${metadata.min_words} WORDS REQUIRED`;
      return false;
    }

    if (metadata.max_words && words > metadata.max_words) {
      error.value = `MAXIMUM ${metadata.max_words} WORDS EXCEEDED`;
      return false;
    }

    if (metadata.max_length && val.length > metadata.max_length) {
      error.value = `MAXIMUM ${metadata.max_length} CHARACTERS EXCEEDED`;
      return false;
    }

    error.value = null;
    return true;
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const newValue = target.value;

    // Enforce max length if specified (soft limit - allow typing but show error)
    inputValue.value = newValue;
    validate(newValue);
    onAnswer(newValue);
  };

  const handleBlur = () => {
    isFocused.value = false;
    validate(inputValue.value);
  };

  return (
    <div class="my-6">
      {question.question_text && (
        <div class="mb-4">
          <p class="text-lg text-t-text font-medium">
            <span class="text-t-accent">&gt;</span> {question.question_text}
            {question.is_required && <span class="text-t-accent ml-2">*</span>}
          </p>
        </div>
      )}

      <div class="relative">
        <textarea
          value={inputValue.value}
          disabled={disabled}
          placeholder={metadata.placeholder || "ENTER YOUR RESPONSE..."}
          rows={metadata.rows || 5}
          onInput={handleChange}
          onFocus={() => (isFocused.value = true)}
          onBlur={handleBlur}
          class={`
            w-full px-4 py-3 border-2 bg-t-surface font-mono text-base
            placeholder:text-t-border placeholder:uppercase
            focus:outline-none transition-all duration-200 resize-none
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${
            error.value
              ? "border-t-accent text-t-accent"
              : isFocused.value
              ? "border-t-accent text-t-text shadow-t-glow"
              : "border-t-border text-t-text-dim hover:border-t-text-muted"
          }
          `}
        />
      </div>

      <div class="flex justify-between items-center mt-2">
        <div>
          {error.value && (
            <p class="text-sm text-t-accent text-shadow-t-accent">
              &gt; ERROR: {error.value}
            </p>
          )}
          {!error.value && metadata.min_words && (
            <p class="text-sm text-t-text-muted">
              &gt; MINIMUM {metadata.min_words} WORDS
            </p>
          )}
        </div>

        <div class="text-sm text-t-text-muted font-mono space-x-4">
          <span
            class={metadata.max_words && wordCount.value > metadata.max_words
              ? "text-t-accent"
              : ""}
          >
            {wordCount.value} {metadata.max_words && `/ ${metadata.max_words}`}
            {" "}
            WORDS
          </span>
          {metadata.max_length && (
            <span
              class={charCount.value > metadata.max_length
                ? "text-t-accent"
                : ""}
            >
              {charCount.value} / {metadata.max_length} CHARS
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
