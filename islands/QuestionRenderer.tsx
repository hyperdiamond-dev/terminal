import type { Question } from "../lib/api.ts";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion.tsx";
import TrueFalseQuestion from "./TrueFalseQuestion.tsx";
import FillBlankQuestion from "./FillBlankQuestion.tsx";
import FreeFormQuestion from "./FreeFormQuestion.tsx";
import FileUploadQuestion from "./FileUploadQuestion.tsx";

type ResponseValue = string | string[] | boolean;

interface QuestionRendererProps {
  question: Question;
  onAnswer: (questionId: number, value: ResponseValue) => void;
  value?: ResponseValue;
  disabled?: boolean;
  authToken?: string;
  apiBaseUrl?: string;
}

export default function QuestionRenderer({
  question,
  onAnswer,
  value,
  disabled = false,
  authToken,
  apiBaseUrl,
}: QuestionRendererProps) {
  const handleAnswer = (val: ResponseValue) => {
    onAnswer(question.id, val);
  };

  switch (question.question_type) {
    case "multiple_choice":
      return (
        <MultipleChoiceQuestion
          question={question}
          onAnswer={handleAnswer as (value: string | string[]) => void}
          value={value as string | string[] | undefined}
          disabled={disabled}
        />
      );

    case "true_false":
      return (
        <TrueFalseQuestion
          question={question}
          onAnswer={handleAnswer as (value: boolean) => void}
          value={value as boolean | undefined}
          disabled={disabled}
        />
      );

    case "fill_blank":
      return (
        <FillBlankQuestion
          question={question}
          onAnswer={handleAnswer as (value: string) => void}
          value={value as string | undefined}
          disabled={disabled}
        />
      );

    case "free_form":
      return (
        <FreeFormQuestion
          question={question}
          onAnswer={handleAnswer as (value: string) => void}
          value={value as string | undefined}
          disabled={disabled}
        />
      );

    case "file_upload":
      return (
        <FileUploadQuestion
          question={question}
          onAnswer={handleAnswer as (value: string) => void}
          value={value as string | undefined}
          disabled={disabled}
          authToken={authToken || ""}
          apiBaseUrl={apiBaseUrl || ""}
        />
      );

    default:
      return (
        <div class="my-6 px-4 py-3 border-2 border-t-accent bg-t-accent/10">
          <p class="text-t-accent text-shadow-t-accent">
            &gt; ERROR: UNKNOWN QUESTION TYPE "{question.question_type}"
          </p>
          <p class="text-t-text-muted mt-2 text-sm">
            &gt; QUESTION ID: {question.id}
          </p>
        </div>
      );
  }
}
