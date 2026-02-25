import { useSignal } from "@preact/signals";
import type { Question } from "../lib/api.ts";

interface FillBlankQuestionProps {
  question: Question;
  onAnswer: (value: string) => void;
  value?: string;
  disabled?: boolean;
}

export default function FillBlankQuestion({
  question,
  onAnswer,
  value,
  disabled = false,
}: FillBlankQuestionProps) {
  const metadata = question.metadata as {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    placeholder?: string;
    error_message?: string;
  };

  const inputValue = useSignal(value || "");
  const error = useSignal<string | null>(null);
  const isFocused = useSignal(false);

  const validate = (val: string): boolean => {
    if (question.is_required && val.trim().length === 0) {
      error.value = "RESPONSE REQUIRED";
      return false;
    }

    if (metadata.min_length && val.length < metadata.min_length) {
      error.value = `MINIMUM ${metadata.min_length} CHARACTERS REQUIRED`;
      return false;
    }

    if (metadata.max_length && val.length > metadata.max_length) {
      error.value = `MAXIMUM ${metadata.max_length} CHARACTERS EXCEEDED`;
      return false;
    }

    if (metadata.pattern) {
      const regex = new RegExp(metadata.pattern);
      if (!regex.test(val)) {
        error.value = metadata.error_message || "INVALID FORMAT";
        return false;
      }
    }

    error.value = null;
    return true;
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;

    // Enforce max length if specified
    if (metadata.max_length && newValue.length > metadata.max_length) {
      return;
    }

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
      <div class="mb-4">
        <p class="text-lg text-vhs-white font-medium">
          <span class="text-analog-cyan">&gt;</span> {question.question_text}
          {question.is_required && <span class="text-analog-red ml-2">*</span>}
        </p>
      </div>

      <div class="relative">
        <input
          type="text"
          value={inputValue.value}
          disabled={disabled}
          placeholder={metadata.placeholder || "ENTER RESPONSE..."}
          onInput={handleChange}
          onFocus={() => (isFocused.value = true)}
          onBlur={handleBlur}
          class={`
            w-full px-4 py-3 border-2 bg-decay-smoke/30 font-mono text-lg
            placeholder:text-vhs-gray-dark placeholder:uppercase
            focus:outline-none transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${
            error.value
              ? "border-analog-red text-analog-red"
              : isFocused.value
              ? "border-analog-cyan text-vhs-white shadow-vhs-glow-blue"
              : "border-vhs-gray-dark text-vhs-white-dim hover:border-vhs-gray"
          }
          `}
        />

        {metadata.max_length && (
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-vhs-gray font-mono">
            {inputValue.value.length}/{metadata.max_length}
          </div>
        )}
      </div>

      {error.value && (
        <p class="mt-2 text-sm text-analog-red text-shadow-vhs-red">
          &gt; ERROR: {error.value}
        </p>
      )}

      {metadata.min_length && !error.value && (
        <p class="mt-2 text-sm text-vhs-gray">
          &gt; MINIMUM {metadata.min_length} CHARACTERS
        </p>
      )}
    </div>
  );
}
