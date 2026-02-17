import { useSignal, useComputed, useSignalEffect } from "@preact/signals";
import type { FileUploadMeta, Question } from "../lib/api.ts";

interface FileUploadQuestionProps {
  question: Question;
  onAnswer: (value: string) => void;
  value?: string;
  disabled?: boolean;
  authToken: string;
}

const API_BASE_URL = "http://localhost:8000";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.startsWith("video/")) return "VID";
  if (mimeType.startsWith("audio/")) return "AUD";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "text/plain") return "TXT";
  return "FILE";
}

export default function FileUploadQuestion({
  question,
  onAnswer,
  value,
  disabled = false,
  authToken,
}: FileUploadQuestionProps) {
  const metadata = question.metadata as {
    max_files?: number;
    allowed_types?: string[];
    max_file_size_mb?: number;
    prompt?: string;
  };

  const maxFiles = metadata.max_files ?? 1;
  const maxSizeMb = metadata.max_file_size_mb ?? 10;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const uploads = useSignal<FileUploadMeta[]>([]);
  const isUploading = useSignal(false);
  const uploadProgress = useSignal(0);
  const error = useSignal<string | null>(null);
  const isDragOver = useSignal(false);
  const isLoading = useSignal(true);

  const uploadIds = useComputed(() => uploads.value.map((u) => u.id));
  const canUploadMore = useComputed(
    () => uploads.value.length < maxFiles && !disabled,
  );

  // Build accept string for file input
  const acceptTypes = metadata.allowed_types?.join(",") || "";

  // Load existing uploads on mount
  useSignalEffect(() => {
    const loadExisting = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/upload/question/${question.id}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          uploads.value = data.uploads || [];
        }
      } catch {
        // Silently fail — uploads will appear empty
      } finally {
        isLoading.value = false;
      }
    };
    loadExisting();
  });

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `FILE EXCEEDS MAXIMUM SIZE OF ${maxSizeMb}MB`;
    }
    if (file.size === 0) {
      return "FILE IS EMPTY";
    }
    if (
      metadata.allowed_types && metadata.allowed_types.length > 0
    ) {
      const isAllowed = metadata.allowed_types.some((pattern) => {
        if (pattern.endsWith("/*")) {
          return file.type.startsWith(pattern.replace("/*", "/"));
        }
        return file.type === pattern;
      });
      if (!isAllowed) {
        return `FILE TYPE "${file.type}" IS NOT ALLOWED`;
      }
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    if (!canUploadMore.value) {
      error.value = `MAXIMUM ${maxFiles} FILE${maxFiles > 1 ? "S" : ""} ALLOWED`;
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      return;
    }

    error.value = null;
    isUploading.value = true;
    uploadProgress.value = 0;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<FileUploadMeta>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE_URL}/api/upload/question/${question.id}`);
        xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.upload);
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.send(formData);
      });

      uploads.value = [...uploads.value, result];
      const newIds = [...uploadIds.value, result.id];
      onAnswer(JSON.stringify(newIds));
    } catch (err) {
      error.value = err instanceof Error ? err.message : "UPLOAD FAILED";
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  };

  const deleteFile = async (fileId: number) => {
    error.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete file");
      }

      uploads.value = uploads.value.filter((u) => u.id !== fileId);
      const newIds = uploads.value.map((u) => u.id);
      onAnswer(newIds.length > 0 ? JSON.stringify(newIds) : "");
    } catch (err) {
      error.value = err instanceof Error ? err.message : "DELETE FAILED";
    }
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      uploadFile(input.files[0]);
      input.value = "";
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragOver.value = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    isDragOver.value = true;
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    isDragOver.value = false;
  };

  if (isLoading.value) {
    return (
      <div class="my-6">
        <p class="text-vhs-gray text-sm">&gt; LOADING UPLOADS...</p>
      </div>
    );
  }

  return (
    <div class="my-6">
      {/* Question text */}
      <div class="mb-4">
        <p class="text-lg text-vhs-white font-medium">
          <span class="text-analog-purple">&gt;</span> {question.question_text}
          {question.is_required && (
            <span class="text-analog-red ml-2">*</span>
          )}
        </p>
        {metadata.prompt && (
          <p class="text-vhs-gray text-sm mt-1">
            &gt; {metadata.prompt}
          </p>
        )}
      </div>

      {/* Drop zone (only when not disabled and can upload more) */}
      {canUploadMore.value && !isUploading.value && (
        <div
          onClick={() => {
            const input = document.getElementById(
              `file-input-${question.id}`,
            ) as HTMLInputElement;
            input?.click();
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          class={`
            border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200
            ${
            isDragOver.value
              ? "border-analog-purple bg-analog-purple/10 shadow-vhs-glow-purple"
              : "border-vhs-gray-dark hover:border-vhs-gray hover:bg-decay-smoke/30"
          }
          `}
        >
          <p class="text-vhs-white-dim text-sm uppercase">
            {isDragOver.value
              ? "> DROP FILE HERE"
              : "> CLICK OR DRAG FILE TO UPLOAD"}
          </p>
          <p class="text-vhs-gray text-xs mt-2">
            MAX {maxSizeMb}MB
            {metadata.allowed_types && metadata.allowed_types.length > 0
              ? ` — ${metadata.allowed_types.join(", ")}`
              : ""}
          </p>
          <input
            id={`file-input-${question.id}`}
            type="file"
            accept={acceptTypes}
            onChange={handleFileSelect}
            class="hidden"
          />
        </div>
      )}

      {/* Upload progress */}
      {isUploading.value && (
        <div class="border-2 border-vhs-gray-dark bg-decay-smoke/30 p-4">
          <p class="text-vhs-white-dim text-sm mb-2">
            &gt; UPLOADING... {uploadProgress.value}%
          </p>
          <div class="w-full h-2 bg-decay-ash">
            <div
              class="h-full bg-analog-purple transition-all duration-200"
              style={{ width: `${uploadProgress.value}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error.value && (
        <div class="mt-3">
          <p class="text-sm text-analog-red text-shadow-vhs-red">
            &gt; ERROR: {error.value}
          </p>
        </div>
      )}

      {/* Uploaded files list */}
      {uploads.value.length > 0 && (
        <div class="mt-4 space-y-2">
          <p class="text-vhs-gray text-xs uppercase">
            {uploads.value.length} / {maxFiles} FILE
            {maxFiles > 1 ? "S" : ""} UPLOADED
          </p>
          {uploads.value.map((upload) => (
            <div
              key={upload.id}
              class="flex items-center justify-between border-2 border-vhs-gray-dark bg-decay-smoke/20 px-4 py-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-analog-cyan font-mono text-xs font-bold shrink-0">
                  [{getMimeIcon(upload.mime_type)}]
                </span>
                <div class="min-w-0">
                  <p class="text-vhs-white-dim text-sm truncate">
                    {upload.original_filename}
                  </p>
                  <p class="text-vhs-gray text-xs">
                    {formatFileSize(upload.file_size)}
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => deleteFile(upload.id)}
                  class="text-analog-red text-xs font-bold uppercase hover:text-analog-red/80 transition-colors shrink-0 ml-4"
                >
                  DELETE
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state in review mode */}
      {disabled && uploads.value.length === 0 && (
        <div class="mt-4">
          <p class="text-vhs-gray text-sm">&gt; NO FILES UPLOADED</p>
        </div>
      )}

      {/* Upload count hint */}
      {!disabled && uploads.value.length >= maxFiles && !isUploading.value && (
        <div class="mt-3">
          <p class="text-vhs-gray text-xs">
            &gt; MAXIMUM FILES REACHED
          </p>
        </div>
      )}
    </div>
  );
}
