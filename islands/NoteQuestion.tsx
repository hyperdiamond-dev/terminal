import { useSignal } from "@preact/signals";
import type { Question } from "../lib/api.ts";

interface NoteQuestionProps {
  question: Question;
  onAnswer: (value: string) => void;
  value?: string;
  disabled?: boolean; // accepted but ignored — notes are always editable
  authToken: string;
  apiBaseUrl: string;
}

export default function NoteQuestion({
  question,
  onAnswer,
  value,
  authToken,
  apiBaseUrl,
}: NoteQuestionProps) {
  const metadata = question.metadata as {
    placeholder?: string;
    max_length?: number;
  };

  const inputValue = useSignal(value || "");
  const isFocused = useSignal(false);
  const isSaving = useSignal(false);
  const saveStatus = useSignal<"idle" | "saved" | "error">("idle");
  const saveError = useSignal<string | null>(null);

  const charCount = () => inputValue.value.length;
  const maxLength = metadata.max_length;
  const isOverLimit = maxLength ? charCount() > maxLength : false;

  const handleChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    inputValue.value = target.value;
    onAnswer(target.value);
    // Reset save status when editing
    if (saveStatus.value === "saved") {
      saveStatus.value = "idle";
    }
  };

  const handleSave = async () => {
    if (isSaving.value || isOverLimit) return;

    isSaving.value = true;
    saveStatus.value = "idle";
    saveError.value = null;

    try {
      const res = await fetch(
        `${apiBaseUrl}/api/questions/${question.id}/respond`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ response_value: inputValue.value }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save note");
      }

      saveStatus.value = "saved";
    } catch (err) {
      saveStatus.value = "error";
      saveError.value = err instanceof Error
        ? err.message
        : "Failed to save note";
    } finally {
      isSaving.value = false;
    }
  };

  return (
    <div class="my-6">
      {question.question_text && (
        <div class="mb-4">
          <p class="text-lg text-t-text font-medium">
            <span class="text-t-accent">&gt;</span> {question.question_text}
          </p>
        </div>
      )}

      <div class="relative">
        <textarea
          value={inputValue.value}
          placeholder={metadata.placeholder || "ENTER YOUR NOTES HERE..."}
          rows={6}
          onInput={handleChange}
          onFocus={() => (isFocused.value = true)}
          onBlur={() => (isFocused.value = false)}
          class={`
            w-full px-4 py-3 border-2 bg-t-surface font-mono text-base
            placeholder:text-t-border placeholder:uppercase
            focus:outline-none transition-all duration-200 resize-none
            ${
            isOverLimit
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
          {saveStatus.value === "error" && saveError.value && (
            <p class="text-sm text-t-accent text-shadow-t-accent">
              &gt; ERROR: {saveError.value}
            </p>
          )}
          {saveStatus.value === "saved" && (
            <p class="text-sm text-t-accent-secondary">
              &gt; NOTE SAVED
            </p>
          )}
        </div>

        <div class="flex items-center gap-4">
          {maxLength && (
            <span
              class={`text-sm font-mono ${
                isOverLimit ? "text-t-accent" : "text-t-text-muted"
              }`}
            >
              {charCount()} / {maxLength} CHARS
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving.value || isOverLimit}
            class={`
              border-2 px-4 py-1 font-mono text-sm uppercase font-bold
              transition-colors duration-200
              ${
              isSaving.value || isOverLimit
                ? "border-t-border text-t-border cursor-not-allowed opacity-50"
                : "border-t-accent-secondary text-t-accent-secondary hover:bg-t-accent-secondary/10 cursor-pointer"
            }
            `}
          >
            {isSaving.value ? "&gt; SAVING..." : "&gt; SAVE NOTE"}
          </button>
        </div>
      </div>
    </div>
  );
}
