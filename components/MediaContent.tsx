interface ContentItem {
  id: number;
  content_type: "video" | "image" | "audio";
  title: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sequence_order: number;
  is_external: boolean;
  metadata: Record<string, unknown>;
}

interface MediaContentProps {
  content: ContentItem[];
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
            class="absolute inset-0 w-full h-full border-2 border-vhs-gray-dark"
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
        class="block border-2 border-vhs-gray-dark bg-decay-smoke/30 p-6 text-center hover:border-analog-purple transition-colors"
      >
        <p class="text-analog-cyan text-sm">&gt; OPEN EXTERNAL VIDEO</p>
      </a>
    );
  }

  // R2-hosted video
  return (
    <video
      src={item.url}
      poster={item.thumbnail_url || undefined}
      controls
      preload="metadata"
      class="w-full border-2 border-vhs-gray-dark"
    >
      Your browser does not support video playback.
    </video>
  );
}

function ImageContent({ item }: { item: ContentItem }) {
  const altText = (item.metadata?.alt_text as string) || item.title ||
    "Module content image";
  return (
    <img
      src={item.url}
      alt={altText}
      class="w-full border-2 border-vhs-gray-dark"
      loading="lazy"
    />
  );
}

function AudioContent({ item }: { item: ContentItem }) {
  return (
    <audio
      src={item.url}
      controls
      preload="metadata"
      class="w-full"
    >
      Your browser does not support audio playback.
    </audio>
  );
}

export default function MediaContent({ content }: MediaContentProps) {
  if (content.length === 0) return null;

  return (
    <div class="space-y-6">
      {content.map((item, index) => (
        <div
          key={item.id}
          class="border-2 border-vhs-gray-dark bg-decay-smoke/20 p-4"
        >
          {/* Header */}
          <div class="flex items-start justify-between mb-3">
            <div>
              {item.title && (
                <p class="text-vhs-white font-medium uppercase text-sm">
                  <span class="text-vhs-gray font-mono mr-2">
                    [{String(index + 1).padStart(2, "0")}]
                  </span>
                  {item.title}
                </p>
              )}
              {item.description && (
                <p class="text-vhs-white-dim text-sm mt-1">
                  {item.description}
                </p>
              )}
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-vhs-gray text-xs font-mono uppercase">
                {item.content_type}
              </span>
              {item.duration_seconds && (
                <span class="text-vhs-gray text-xs font-mono">
                  {formatDuration(item.duration_seconds)}
                </span>
              )}
            </div>
          </div>

          {/* Media */}
          {item.content_type === "video" && <VideoContent item={item} />}
          {item.content_type === "image" && <ImageContent item={item} />}
          {item.content_type === "audio" && <AudioContent item={item} />}
        </div>
      ))}
    </div>
  );
}
