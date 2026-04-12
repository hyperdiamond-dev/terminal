/**
 * ContentCarousel Island - Mixed Media Carousel with VHS Aesthetic
 *
 * Features:
 * - Unified carousel for video, audio, and image content
 * - Navigation controls with VHS styling
 * - Pagination dots indicator
 * - Keyboard controls (←/→ navigate, ESC close carousel)
 * - Auto-advance toggle with configurable interval
 * - Current position display (e.g., "2 / 7")
 * - Integrates VideoPlayer, AudioPlayer, and ImageGallery islands
 * - Respects sequence_order from ContentItem
 */
import { useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import VideoPlayer from "./VideoPlayer.tsx";
import AudioPlayer from "./AudioPlayer.tsx";
import type { ContentItem } from "../lib/api.ts";

interface ContentCarouselProps {
  content: ContentItem[];
  autoAdvanceInterval?: number; // seconds, 0 = disabled
}

// Helper functions for external video embeds
function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function ContentCarousel({
  content,
  autoAdvanceInterval = 0,
}: ContentCarouselProps) {
  // Sort content by sequence_order
  const sortedContent = [...content].sort((a, b) =>
    a.sequence_order - b.sequence_order
  );

  // State
  const currentIndex = useSignal(0);
  const isAutoAdvanceEnabled = useSignal(autoAdvanceInterval > 0);
  const autoAdvanceTimeLeft = useSignal(autoAdvanceInterval);
  const isPaused = useSignal(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  // Computed values
  const currentItem = useComputed(() => sortedContent[currentIndex.value]);
  const totalItems = sortedContent.length;
  const currentPosition = useComputed(() => currentIndex.value + 1);

  // Navigation functions
  const goToNext = () => {
    if (currentIndex.value < totalItems - 1) {
      currentIndex.value++;
      resetAutoAdvanceTimer();
    } else if (isAutoAdvanceEnabled.value) {
      // Loop back to start when auto-advance is enabled
      currentIndex.value = 0;
      resetAutoAdvanceTimer();
    }
  };

  const goToPrevious = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      resetAutoAdvanceTimer();
    }
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < totalItems) {
      currentIndex.value = index;
      resetAutoAdvanceTimer();
    }
  };

  const toggleAutoAdvance = () => {
    isAutoAdvanceEnabled.value = !isAutoAdvanceEnabled.value;
    if (isAutoAdvanceEnabled.value) {
      resetAutoAdvanceTimer();
    } else {
      clearAutoAdvanceTimer();
    }
  };

  const resetAutoAdvanceTimer = () => {
    autoAdvanceTimeLeft.value = autoAdvanceInterval;
  };

  const clearAutoAdvanceTimer = () => {
    if (autoAdvanceTimerRef.current !== null) {
      clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "Home":
          e.preventDefault();
          goToIndex(0);
          break;
        case "End":
          e.preventDefault();
          goToIndex(totalItems - 1);
          break;
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [totalItems]);

  // Auto-advance timer
  useSignalEffect(() => {
    clearAutoAdvanceTimer();

    if (
      isAutoAdvanceEnabled.value && autoAdvanceInterval > 0 && !isPaused.value
    ) {
      autoAdvanceTimerRef.current = setInterval(() => {
        autoAdvanceTimeLeft.value = autoAdvanceTimeLeft.value - 1;
        if (autoAdvanceTimeLeft.value <= 0) {
          goToNext();
        }
      }, 1000);
    }

    return () => clearAutoAdvanceTimer();
  });

  // Pause auto-advance on mouse enter
  const handleMouseEnter = () => {
    isPaused.value = true;
  };

  const handleMouseLeave = () => {
    isPaused.value = false;
  };

  if (totalItems === 0) return null;

  const item = currentItem.value;

  return (
    <div
      ref={containerRef}
      class="border-2 border-t-border bg-t-surface p-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header with title and position */}
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          {item.title && (
            <p class="text-t-text font-medium uppercase text-sm">
              <span class="text-t-text-muted font-mono mr-2">
                [{String(currentPosition.value).padStart(2, "0")}]
              </span>
              {item.title}
            </p>
          )}
          {item.description && (
            <p class="text-t-text-dim text-sm mt-1">
              {item.description}
            </p>
          )}
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-t-text-muted text-xs font-mono uppercase">
            {item.content_type}
          </span>
          {item.duration_seconds && (
            <span class="text-t-text-muted text-xs font-mono">
              {formatDuration(item.duration_seconds)}
            </span>
          )}
          <span class="text-t-accent text-sm font-mono font-bold">
            {currentPosition.value} / {totalItems}
          </span>
        </div>
      </div>

      {/* Content Display */}
      <div class="mb-4">
        {item.content_type === "video" && (
          <>
            {item.is_external
              ? (
                <>
                  {(() => {
                    const embedUrl = getYouTubeEmbedUrl(item.url) ||
                      getVimeoEmbedUrl(item.url);
                    if (embedUrl) {
                      return (
                        <div
                          class="relative w-full"
                          style={{ paddingBottom: "56.25%" }}
                        >
                          <iframe
                            src={embedUrl}
                            class="absolute inset-0 w-full h-full border-2 border-t-border"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    // Fallback
                    return (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block border-2 border-t-border bg-t-surface p-6 text-center hover:border-t-accent transition-colors"
                      >
                        <p class="text-t-accent-secondary text-sm">
                          &gt; OPEN EXTERNAL VIDEO
                        </p>
                      </a>
                    );
                  })()}
                </>
              )
              : (
                <div class="border-2 border-t-border overflow-hidden">
                  <VideoPlayer
                    src={item.url}
                    poster={item.thumbnail_url || undefined}
                    title={item.title || undefined}
                    className="w-full"
                  />
                </div>
              )}
          </>
        )}

        {item.content_type === "audio" && (
          <AudioPlayer
            url={item.url}
            title={item.title}
            duration={item.duration_seconds || undefined}
          />
        )}

        {item.content_type === "image" && (
          <div class="border-2 border-t-border overflow-hidden bg-decay-void">
            <img
              src={item.url}
              alt={item.title || "Content image"}
              class="w-full h-auto object-contain max-h-[600px]"
              loading="lazy"
            />
            {(item.title || item.description) && (
              <div class="p-4 border-t-2 border-t-border bg-t-surface">
                {item.title && (
                  <p class="text-t-text text-sm font-medium mb-1">
                    {item.title}
                  </p>
                )}
                {item.description && (
                  <p class="text-t-text-dim text-xs">
                    {item.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div class="space-y-3">
        {/* Navigation Buttons */}
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={currentIndex.value === 0 && !isAutoAdvanceEnabled.value}
            class="px-4 py-2 border-2 border-t-border bg-t-surface text-t-text text-sm font-mono uppercase hover:border-t-accent hover:bg-t-accent hover:text-decay-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-t-border disabled:hover:bg-t-surface disabled:hover:text-t-text"
            aria-label="Previous content"
          >
            <span class="inline-block" aria-hidden="true">&lt;&lt;</span>
            <span class="ml-2">PREV</span>
          </button>

          <div class="flex-1 flex items-center justify-center gap-2">
            {totalItems <= 10
              ? (
                // Show all dots for 10 or fewer items
                sortedContent.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToIndex(index)}
                    class={`w-3 h-3 border-2 transition-all ${
                      index === currentIndex.value
                        ? "bg-t-accent border-t-accent scale-125"
                        : "bg-transparent border-t-text-muted hover:border-t-accent"
                    }`}
                    aria-label={`Go to item ${index + 1}`}
                  />
                ))
              )
              : (
                // Show position indicator for many items
                <span class="text-t-text-muted text-xs font-mono">
                  ● ● ● {currentPosition.value} / {totalItems} ● ● ●
                </span>
              )}
          </div>

          <button
            type="button"
            onClick={goToNext}
            disabled={currentIndex.value === totalItems - 1 &&
              !isAutoAdvanceEnabled.value}
            class="px-4 py-2 border-2 border-t-border bg-t-surface text-t-text text-sm font-mono uppercase hover:border-t-accent hover:bg-t-accent hover:text-decay-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-t-border disabled:hover:bg-t-surface disabled:hover:text-t-text"
            aria-label="Next content"
          >
            <span>NEXT</span>
            <span class="inline-block ml-2" aria-hidden="true">&gt;&gt;</span>
          </button>
        </div>

        {/* Auto-advance Toggle */}
        {autoAdvanceInterval > 0 && (
          <div class="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={toggleAutoAdvance}
              class={`px-4 py-1.5 border-2 text-xs font-mono uppercase transition-colors ${
                isAutoAdvanceEnabled.value
                  ? "border-t-accent bg-t-accent text-decay-void"
                  : "border-t-border bg-t-surface text-t-text hover:border-t-accent"
              }`}
              aria-label={isAutoAdvanceEnabled.value
                ? "Disable auto-advance"
                : "Enable auto-advance"}
            >
              {isAutoAdvanceEnabled.value ? "[ AUTO: ON ]" : "[ AUTO: OFF ]"}
            </button>
            {isAutoAdvanceEnabled.value && !isPaused.value && (
              <span class="text-t-text-muted text-xs font-mono">
                Next in {autoAdvanceTimeLeft.value}s
              </span>
            )}
            {isAutoAdvanceEnabled.value && isPaused.value && (
              <span class="text-t-accent-secondary text-xs font-mono">
                [PAUSED]
              </span>
            )}
          </div>
        )}

        {/* Keyboard Hints */}
        <div class="text-center">
          <p class="text-t-text-muted text-xs font-mono">
            <span class="text-t-accent">←/→</span> Navigate
            {totalItems > 1 && (
              <>
                {" • "}
                <span class="text-t-accent">HOME/END</span> First/Last
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
