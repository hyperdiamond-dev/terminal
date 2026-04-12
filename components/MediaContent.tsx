import ImageGallery from "../islands/ImageGallery.tsx";
import VideoPlayer from "../islands/VideoPlayer.tsx";
import ContentCarousel from "../islands/ContentCarousel.tsx";
import type { ContentItem } from "../lib/api.ts";

interface MediaContentProps {
  content: ContentItem[];
  /** Display mode: 'default' (grouped by type) or 'carousel' (unified slideshow) */
  mode?: "default" | "carousel";
  /** Auto-advance interval in seconds (carousel mode only, 0 = disabled) */
  autoAdvanceInterval?: number;
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Handle youtube.com/watch?v=ID and youtu.be/ID
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

function VideoContent({ item }: { item: ContentItem }) {
  if (item.is_external) {
    const embedUrl = getYouTubeEmbedUrl(item.url) ||
      getVimeoEmbedUrl(item.url);
    if (embedUrl) {
      return (
        <div class="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            class="absolute inset-0 w-full h-full border-2 border-t-border"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    // Fallback: link to external video
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        class="block border-2 border-t-border bg-t-surface p-6 text-center hover:border-t-accent transition-colors"
      >
        <p class="text-t-accent-secondary text-sm">&gt; OPEN EXTERNAL VIDEO</p>
      </a>
    );
  }

  // R2-hosted video with custom VHS-styled controls
  return (
    <div class="border-2 border-t-border overflow-hidden">
      <VideoPlayer
        src={item.url}
        poster={item.thumbnail_url || undefined}
        title={item.title || undefined}
        className="w-full"
      />
    </div>
  );
}

// ImageContent is now handled by ImageGallery island

// Import AudioPlayer island (dynamically loaded by Fresh)
import AudioPlayer from "../islands/AudioPlayer.tsx";

function AudioContent({ item }: { item: ContentItem }) {
  return (
    <AudioPlayer
      url={item.url}
      title={item.title}
      duration={item.duration_seconds || undefined}
    />
  );
}

export default function MediaContent(
  { content, mode = "default", autoAdvanceInterval = 0 }: MediaContentProps,
) {
  if (content.length === 0) return null;

  // Carousel mode: unified slideshow for all content types
  if (mode === "carousel") {
    return (
      <ContentCarousel
        content={content}
        autoAdvanceInterval={autoAdvanceInterval}
      />
    );
  }

  // Default mode: group content by type
  const images = content.filter((item) => item.content_type === "image");
  const videos = content.filter((item) => item.content_type === "video");
  const audio = content.filter((item) => item.content_type === "audio");

  return (
    <div class="space-y-6">
      {/* Image Gallery Section */}
      {images.length > 0 && (
        <div class="border-2 border-t-border bg-t-surface p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-t-text font-medium uppercase text-sm">
              <span class="text-t-text-muted font-mono mr-2">
                [IMG]
              </span>
              Image Gallery
              <span class="text-t-text-muted text-xs ml-2">
                ({images.length} {images.length === 1 ? "image" : "images"})
              </span>
            </h3>
          </div>
          <ImageGallery images={images} />
        </div>
      )}

      {/* Video Content */}
      {videos.map((item, index) => (
        <div
          key={item.id}
          class="border-2 border-t-border bg-t-surface p-4"
        >
          {/* Header */}
          <div class="flex items-start justify-between mb-3">
            <div>
              {item.title && (
                <p class="text-t-text font-medium uppercase text-sm">
                  <span class="text-t-text-muted font-mono mr-2">
                    [{String(index + 1).padStart(2, "0")}]
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
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-t-text-muted text-xs font-mono uppercase">
                {item.content_type}
              </span>
              {item.duration_seconds && (
                <span class="text-t-text-muted text-xs font-mono">
                  {formatDuration(item.duration_seconds)}
                </span>
              )}
            </div>
          </div>

          {/* Media */}
          <VideoContent item={item} />
        </div>
      ))}

      {/* Audio Content */}
      {audio.map((item, index) => (
        <div
          key={item.id}
          class="border-2 border-t-border bg-t-surface p-4"
        >
          {/* Header */}
          <div class="flex items-start justify-between mb-3">
            <div>
              {item.title && (
                <p class="text-t-text font-medium uppercase text-sm">
                  <span class="text-t-text-muted font-mono mr-2">
                    [{String(index + 1).padStart(2, "0")}]
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
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-t-text-muted text-xs font-mono uppercase">
                {item.content_type}
              </span>
              {item.duration_seconds && (
                <span class="text-t-text-muted text-xs font-mono">
                  {formatDuration(item.duration_seconds)}
                </span>
              )}
            </div>
          </div>

          {/* Media */}
          <AudioContent item={item} />
        </div>
      ))}
    </div>
  );
}
