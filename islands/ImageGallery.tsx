import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { ContentItem } from "../lib/api.ts";

interface ImageGalleryProps {
  images: ContentItem[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const isOpen = useSignal(false);
  const currentIndex = useSignal(0);
  const zoomLevel = useSignal(1);
  const loadedImages = useSignal<Set<number>>(new Set());

  const currentImage = useComputed(() => images[currentIndex.value]);
  const totalImages = images.length;

  const openLightbox = (index: number) => {
    currentIndex.value = index;
    zoomLevel.value = 1;
    isOpen.value = true;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closeLightbox = () => {
    isOpen.value = false;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  const nextImage = () => {
    if (currentIndex.value < totalImages - 1) {
      currentIndex.value++;
      zoomLevel.value = 1;
      preloadAdjacentImages();
    }
  };

  const prevImage = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
      zoomLevel.value = 1;
      preloadAdjacentImages();
    }
  };

  const zoomIn = () => {
    if (zoomLevel.value < 3) {
      zoomLevel.value = Math.min(3, zoomLevel.value + 0.5);
    }
  };

  const zoomOut = () => {
    if (zoomLevel.value > 1) {
      zoomLevel.value = Math.max(1, zoomLevel.value - 0.5);
    }
  };

  const preloadAdjacentImages = () => {
    const currentIdx = currentIndex.value;
    const toPreload = [currentIdx];
    if (currentIdx > 0) toPreload.push(currentIdx - 1);
    if (currentIdx < totalImages - 1) toPreload.push(currentIdx + 1);

    toPreload.forEach((idx) => {
      if (!loadedImages.value.has(idx)) {
        const img = new Image();
        img.src = images[idx].url;
        img.onload = () => {
          loadedImages.value = new Set([...loadedImages.value, idx]);
        };
      }
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen.value) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeLightbox();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextImage();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevImage();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          zoomOut();
          break;
      }
    };

    globalThis.addEventListener("keydown", handleKeyboard);
    return () => globalThis.removeEventListener("keydown", handleKeyboard);
  }, [isOpen.value]);

  // Preload first image and adjacent on mount
  useEffect(() => {
    preloadAdjacentImages();
  }, []);

  const getAltText = (item: ContentItem): string => {
    return (item.metadata?.alt_text as string) || item.title ||
      "Module content image";
  };

  return (
    <>
      {/* Gallery Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((item, index) => {
          const altText = getAltText(item);
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => openLightbox(index)}
              class="group relative overflow-hidden border-2 border-t-border bg-t-surface hover:border-t-accent transition-colors focus:outline-none focus:ring-2 focus:ring-t-accent focus:ring-offset-2 focus:ring-offset-black"
              aria-label={`Open image ${index + 1}: ${altText}`}
            >
              <img
                src={item.url}
                alt={altText}
                loading="lazy"
                class="w-full h-48 object-cover transition-transform group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span class="text-t-accent opacity-0 group-hover:opacity-100 transition-opacity text-2xl font-mono">
                  [ VIEW ]
                </span>
              </div>
              {item.title && (
                <div class="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                  <p class="text-t-text text-xs font-mono uppercase truncate">
                    {item.title}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {isOpen.value && (
        <div
          class="fixed inset-0 z-[9999] flex items-center justify-center effect-grain effect-crt-vignette"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Dark Overlay */}
          <div class="absolute inset-0 bg-black/95" />

          {/* Content Container */}
          <div
            class="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Counter and Close */}
            <div class="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
              <div class="text-t-text font-mono text-sm bg-black/80 px-3 py-2 border border-t-border">
                <span class="text-t-accent">{currentIndex.value + 1}</span>
                <span class="text-t-text-muted">/</span>
                <span class="text-t-text-dim">{totalImages}</span>
              </div>
              <button
                type="button"
                onClick={closeLightbox}
                class="bg-black/80 border border-t-border hover:border-t-accent px-4 py-2 text-t-text font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-t-accent"
                aria-label="Close lightbox"
              >
                [ ESC ]
              </button>
            </div>

            {/* Main Image Display */}
            <div class="flex-1 flex items-center justify-center w-full max-w-7xl overflow-auto">
              <img
                src={currentImage.value.url}
                alt={getAltText(currentImage.value)}
                class="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel.value})`,
                  cursor: zoomLevel.value > 1 ? "grab" : "default",
                }}
              />
            </div>

            {/* Bottom Controls Bar */}
            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              <div class="flex items-center gap-2 bg-black/80 border border-t-border p-2">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={prevImage}
                  disabled={currentIndex.value === 0}
                  class="px-3 py-2 border border-t-border hover:border-t-accent disabled:opacity-30 disabled:cursor-not-allowed text-t-text font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-t-accent"
                  aria-label="Previous image"
                >
                  &lt; PREV
                </button>

                {/* Zoom Controls */}
                <div class="flex items-center gap-1 border-l border-r border-t-border px-2">
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoomLevel.value <= 1}
                    class="px-2 py-2 border border-t-border hover:border-t-accent disabled:opacity-30 disabled:cursor-not-allowed text-t-text font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-t-accent"
                    aria-label="Zoom out"
                  >
                    -
                  </button>
                  <span class="text-t-text-muted font-mono text-xs px-2 min-w-[3rem] text-center">
                    {Math.round(zoomLevel.value * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoomLevel.value >= 3}
                    class="px-2 py-2 border border-t-border hover:border-t-accent disabled:opacity-30 disabled:cursor-not-allowed text-t-text font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-t-accent"
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={nextImage}
                  disabled={currentIndex.value === totalImages - 1}
                  class="px-3 py-2 border border-t-border hover:border-t-accent disabled:opacity-30 disabled:cursor-not-allowed text-t-text font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-t-accent"
                  aria-label="Next image"
                >
                  NEXT &gt;
                </button>
              </div>
            </div>

            {/* Image Title & Description */}
            {(currentImage.value.title || currentImage.value.description) && (
              <div class="absolute bottom-20 left-4 right-4 bg-black/90 border border-t-border p-3 max-w-2xl mx-auto">
                {currentImage.value.title && (
                  <p class="text-t-text font-mono text-sm uppercase mb-1">
                    {currentImage.value.title}
                  </p>
                )}
                {currentImage.value.description && (
                  <p class="text-t-text-dim font-mono text-xs">
                    {currentImage.value.description}
                  </p>
                )}
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div class="absolute top-20 right-4 text-t-text-muted font-mono text-xs bg-black/60 px-3 py-2 border border-t-border/50 max-w-xs hidden md:block">
              <p class="mb-1 text-t-accent text-[10px] uppercase tracking-wider">
                Keyboard
              </p>
              <p>← → : Navigate</p>
              <p>+ - : Zoom</p>
              <p>ESC : Close</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
