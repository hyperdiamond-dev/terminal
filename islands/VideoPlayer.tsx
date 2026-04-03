import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  className = "",
}: VideoPlayerProps) {
  // State signals
  const isPlaying = useSignal(false);
  const isLoading = useSignal(true);
  const isBuffering = useSignal(false);
  const currentTime = useSignal(0);
  const duration = useSignal(0);
  const volume = useSignal(0.8);
  const isMuted = useSignal(false);
  const isFullscreen = useSignal(false);
  const showControls = useSignal(true);
  const playbackRate = useSignal(1.0);
  const error = useSignal<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Computed values
  const formattedCurrentTime = useComputed(() => formatTime(currentTime.value));
  const formattedDuration = useComputed(() => formatTime(duration.value));
  const progress = useComputed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  );

  // Format time helper (MM:SS format)
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Initialize video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      duration.value = video.duration;
      isLoading.value = false;
    };

    const handleTimeUpdate = () => {
      currentTime.value = video.currentTime;
    };

    const handleEnded = () => {
      isPlaying.value = false;
      currentTime.value = 0;
      video.currentTime = 0;
    };

    const handleError = () => {
      error.value = "VIDEO LOAD FAILED";
      isLoading.value = false;
    };

    const handleWaiting = () => {
      isBuffering.value = true;
    };

    const handleCanPlay = () => {
      isBuffering.value = false;
      isLoading.value = false;
    };

    const handleVolumeChange = () => {
      volume.value = video.volume;
      isMuted.value = video.muted;
    };

    const handleFullscreenChange = () => {
      isFullscreen.value = !!(
        globalThis.document?.fullscreenElement ||
        (globalThis.document as unknown as {
          webkitFullscreenElement?: Element;
        }).webkitFullscreenElement
      );
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolumeChange);

    globalThis.document?.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );
    globalThis.document?.addEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("volumechange", handleVolumeChange);

      globalThis.document?.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
      globalThis.document?.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [src]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when video is in focus or controls are visible
      if (!containerRef.current?.contains(e.target as Node)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlayPause();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-5);
          break;
        case "arrowright":
          e.preventDefault();
          skip(5);
          break;
        case "arrowup":
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          jumpToPercentage(parseInt(e.key) * 10);
          break;
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = () => {
    showControls.value = true;
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying.value) {
      controlsTimeoutRef.current = setTimeout(() => {
        showControls.value = false;
      }, 3000) as unknown as number;
    }
  };

  useEffect(() => {
    if (!isPlaying.value) {
      showControls.value = true;
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      resetControlsTimeout();
    }
  }, [isPlaying.value]);

  // Play/pause toggle
  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying.value) {
        video.pause();
        isPlaying.value = false;
      } else {
        await video.play();
        isPlaying.value = true;
      }
    } catch (err) {
      error.value = `PLAYBACK ERROR: ${
        err instanceof Error ? err.message : "UNKNOWN"
      }`;
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(
      0,
      Math.min(duration.value, video.currentTime + seconds),
    );
    video.currentTime = newTime;
    currentTime.value = newTime;
    resetControlsTimeout();
  };

  // Jump to percentage
  const jumpToPercentage = (percentage: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (percentage / 100) * duration.value;
    video.currentTime = newTime;
    currentTime.value = newTime;
    resetControlsTimeout();
  };

  // Seek by clicking progress bar
  const handleProgressClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration.value;

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      currentTime.value = newTime;
    }
    resetControlsTimeout();
  };

  // Volume control
  const handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    volume.value = newVolume;
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      isMuted.value = true;
    } else if (isMuted.value) {
      isMuted.value = false;
    }
    resetControlsTimeout();
  };

  // Adjust volume by delta
  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, volume.value + delta));
    volume.value = newVolume;
    video.volume = newVolume;
    if (newVolume === 0) {
      isMuted.value = true;
    } else if (isMuted.value) {
      isMuted.value = false;
    }
    resetControlsTimeout();
  };

  // Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted.value) {
        videoRef.current.muted = false;
        videoRef.current.volume = volume.value;
        isMuted.value = false;
      } else {
        videoRef.current.muted = true;
        isMuted.value = true;
      }
    }
    resetControlsTimeout();
  };

  // Playback rate change
  const handlePlaybackRateChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newRate = parseFloat(target.value);
    playbackRate.value = newRate;
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
    resetControlsTimeout();
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen.value) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (
          (container as unknown as { webkitRequestFullscreen?: () => void })
            .webkitRequestFullscreen
        ) {
          (container as unknown as { webkitRequestFullscreen: () => void })
            .webkitRequestFullscreen();
        }
      } else {
        if (globalThis.document?.exitFullscreen) {
          await globalThis.document.exitFullscreen();
        } else if (
          (globalThis.document as unknown as {
            webkitExitFullscreen?: () => void;
          }).webkitExitFullscreen
        ) {
          (globalThis.document as unknown as {
            webkitExitFullscreen: () => void;
          }).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
    resetControlsTimeout();
  };

  if (error.value) {
    return (
      <div class="w-full p-6 border-2 border-t-accent bg-decay-void">
        <p class="text-t-accent text-sm font-mono text-shadow-t-accent">
          &gt; ERROR: {error.value}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      class={`relative bg-decay-void ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => {
        showControls.value = true;
      }}
      tabIndex={0}
      role="region"
      aria-label="Video player"
    >
      {/* Video Element with VHS Grain Effect */}
      <div class="relative w-full">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          class="w-full h-auto block bg-black"
          playsInline
          preload="metadata"
        />

        {/* VHS Grain Overlay */}
        <div class="absolute inset-0 pointer-events-none effect-grain" />

        {/* Scanline Effect */}
        <div
          class="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)",
          }}
        />

        {/* Center Play Button Overlay */}
        {!isPlaying.value && !isLoading.value && (
          <button
            type="button"
            onClick={togglePlayPause}
            class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-50 transition-opacity group"
            aria-label="Play video"
          >
            <div class="w-20 h-20 flex items-center justify-center border-4 border-t-accent bg-t-surface group-hover:border-t-accent-secondary group-hover:scale-110 transition-transform">
              <span class="text-t-accent text-4xl">▶</span>
            </div>
          </button>
        )}

        {/* Buffering Indicator */}
        {isBuffering.value && (
          <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
            <div class="text-t-accent text-sm font-mono uppercase animate-pulse">
              &gt; BUFFERING...
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading.value && (
          <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div class="text-t-text-muted text-sm font-mono uppercase animate-pulse">
              &gt; LOADING VIDEO...
            </div>
          </div>
        )}
      </div>

      {/* VHS-Style Controls */}
      <div
        class={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent transition-opacity duration-300 ${
          showControls.value ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div
          class="h-2 bg-decay-smoke border-t border-t-border relative cursor-pointer hover:h-3 transition-all group"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration.value}
          aria-valuenow={currentTime.value}
        >
          <div
            class="h-full bg-t-accent transition-all duration-100 relative"
            style={{ width: `${progress.value}%` }}
          >
            {/* Progress handle */}
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-t-accent border border-t-border opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Control Buttons */}
        <div class="flex items-center gap-2 p-3 border-t-2 border-t-border bg-t-surface">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlayPause}
            class="px-3 py-2 border-2 border-t-border bg-decay-smoke text-t-text font-mono text-sm uppercase hover:border-t-accent hover:text-t-accent transition-colors min-w-[80px]"
            aria-label={isPlaying.value ? "Pause" : "Play"}
          >
            {isPlaying.value ? "⏸ PAUSE" : "▶ PLAY"}
          </button>

          {/* Skip Backward */}
          <button
            type="button"
            onClick={() => skip(-5)}
            class="px-2 py-2 border-2 border-t-border bg-decay-smoke text-t-text font-mono text-sm hover:border-t-accent hover:text-t-accent transition-colors"
            aria-label="Skip backward 5 seconds"
            title="-5s"
          >
            ⏪
          </button>

          {/* Skip Forward */}
          <button
            type="button"
            onClick={() => skip(5)}
            class="px-2 py-2 border-2 border-t-border bg-decay-smoke text-t-text font-mono text-sm hover:border-t-accent hover:text-t-accent transition-colors"
            aria-label="Skip forward 5 seconds"
            title="+5s"
          >
            ⏩
          </button>

          {/* Time Display */}
          <div class="flex items-center gap-1 px-2 text-t-text font-mono text-sm tabular-nums">
            <span>{formattedCurrentTime.value}</span>
            <span class="text-t-text-muted">/</span>
            <span class="text-t-text-muted">{formattedDuration.value}</span>
          </div>

          {/* Spacer */}
          <div class="flex-1" />

          {/* Playback Speed */}
          <select
            value={playbackRate.value}
            onChange={handlePlaybackRateChange}
            class="px-2 py-2 border-2 border-t-border bg-decay-smoke text-t-text font-mono text-xs uppercase hover:border-t-accent transition-colors cursor-pointer"
            aria-label="Playback speed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Volume Control */}
          <div class="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              class="px-2 py-2 border-2 border-t-border bg-decay-smoke text-t-text font-mono text-sm hover:border-t-accent hover:text-t-accent transition-colors"
              aria-label={isMuted.value ? "Unmute" : "Mute"}
            >
              {isMuted.value ? "🔇" : volume.value > 0.5 ? "🔊" : "🔉"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted.value ? 0 : volume.value}
              onInput={handleVolumeChange}
              class="w-20 h-2 bg-decay-smoke border border-t-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-t-accent [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-t-accent [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-t-accent [&::-moz-range-thumb]:border-0"
              aria-label="Volume"
            />
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            class="px-2 py-2 border-2 border-t-border bg-decay-smoke text-t-text font-mono text-sm hover:border-t-accent hover:text-t-accent transition-colors"
            aria-label={isFullscreen.value
              ? "Exit fullscreen"
              : "Enter fullscreen"}
          >
            {isFullscreen.value ? "⛶" : "⛶"}
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        {!isPlaying.value && (
          <div class="px-3 pb-2 text-t-text-muted text-xs font-mono">
            SHORTCUTS: SPACE/K=Play • ←→=Seek • ↑↓=Volume • M=Mute •
            F=Fullscreen • 0-9=Jump
          </div>
        )}
      </div>

      {/* Title Overlay */}
      {title && showControls.value && (
        <div class="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
          <p class="text-t-text font-mono text-sm uppercase">
            <span class="text-t-accent">&gt;</span> {title}
          </p>
        </div>
      )}
    </div>
  );
}
