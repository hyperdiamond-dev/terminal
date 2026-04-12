/**
 * Interactive AudioPlayer Island with Waveform Visualization
 *
 * Features:
 * - Custom VHS-styled controls with theme-aware colors
 * - Block-based waveform visualization (CSS height bars, no Canvas API)
 * - Keyboard shortcuts:
 *   - SPACE/K: Play/Pause
 *   - Arrow Left/Right: Skip backward/forward 5 seconds
 *   - Arrow Up/Down: Volume adjustment
 *   - M: Mute/Unmute
 *   - 1-5: Playback speed (0.5x, 0.75x, 1x, 1.5x, 2x)
 * - Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
 * - Volume slider with visual feedback
 * - Interactive waveform (click to seek)
 * - Auto-loads waveform data using Web Audio API
 * - VHS scanline effect overlay
 */
import { useEffect, useRef } from "preact/hooks";
import { useComputed, useSignal } from "@preact/signals";

interface AudioPlayerProps {
  url: string;
  title?: string | null;
  duration?: number;
}

export default function AudioPlayer({
  url,
  title,
  duration: providedDuration,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);

  // State signals
  const isPlaying = useSignal(false);
  const isMuted = useSignal(false);
  const volume = useSignal(1);
  const currentTime = useSignal(0);
  const duration = useSignal(providedDuration || 0);
  const playbackRate = useSignal(1);
  const isLoading = useSignal(true);
  const waveformData = useSignal<number[]>([]);
  const error = useSignal<string | null>(null);

  // Computed values
  const progress = useComputed(() => {
    const d = duration.value;
    return d > 0 ? (currentTime.value / d) * 100 : 0;
  });

  const formattedCurrentTime = useComputed(() => formatTime(currentTime.value));
  const formattedDuration = useComputed(() => formatTime(duration.value));

  // Format time helper
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Generate waveform data using Web Audio API
  async function generateWaveform() {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      const AudioContextClass = globalThis.AudioContext ||
        (globalThis as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Web Audio API not supported");
      }

      const audioContext = new AudioContextClass();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Extract channel data (use first channel)
      const channelData = audioBuffer.getChannelData(0);
      const samples = 100; // Number of bars in waveform
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];

      // Calculate RMS (Root Mean Square) for each block
      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let sum = 0;

        for (let j = start; j < end && j < channelData.length; j++) {
          sum += channelData[j] * channelData[j];
        }

        const rms = Math.sqrt(sum / blockSize);
        // Normalize to 0-100 range with some amplification
        const normalized = Math.min(100, rms * 300);
        waveform.push(normalized);
      }

      waveformData.value = waveform;
      audioContext.close();
    } catch (err) {
      console.error("Failed to generate waveform:", err);
      error.value = err instanceof Error
        ? err.message
        : "Failed to load waveform";
      // Generate fallback flat waveform
      waveformData.value = Array(100).fill(30);
    } finally {
      isLoading.value = false;
    }
  }

  // Playback controls
  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((err) => {
        error.value = "Playback failed: " + err.message;
      });
    } else {
      audio.pause();
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    isMuted.value = audio.muted;
  }

  function changeVolume(newVolume: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audio.volume = clampedVolume;
    volume.value = clampedVolume;

    if (clampedVolume === 0) {
      audio.muted = true;
      isMuted.value = true;
    } else if (audio.muted) {
      audio.muted = false;
      isMuted.value = false;
    }
  }

  function seek(percentage: number) {
    const audio = audioRef.current;
    if (!audio || !duration.value) return;

    audio.currentTime = (percentage / 100) * duration.value;
  }

  function skipTime(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(
      0,
      Math.min(duration.value, audio.currentTime + seconds),
    );
  }

  function changePlaybackRate(rate: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    playbackRate.value = rate;
  }

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      isPlaying.value = true;
    };

    const handlePause = () => {
      isPlaying.value = false;
    };

    const handleTimeUpdate = () => {
      currentTime.value = audio.currentTime;
    };

    const handleDurationChange = () => {
      duration.value = audio.duration;
    };

    const handleVolumeChange = () => {
      volume.value = audio.volume;
      isMuted.value = audio.muted;
    };

    const handleLoadedMetadata = () => {
      duration.value = audio.duration;
    };

    const handleError = () => {
      error.value = "Failed to load audio file";
      isLoading.value = false;
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("volumechange", handleVolumeChange);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    // Generate waveform on mount
    generateWaveform();

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("volumechange", handleVolumeChange);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const container = waveformContainerRef.current;
      if (!container) return;

      // Only handle keyboard shortcuts if the audio player is in viewport or focused
      const rect = container.getBoundingClientRect();
      const isInViewport = rect.top < globalThis.innerHeight && rect.bottom > 0;

      if (!isInViewport && globalThis.document?.activeElement !== container) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipTime(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          skipTime(5);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(volume.value + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(volume.value - 0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "1":
          e.preventDefault();
          changePlaybackRate(0.5);
          break;
        case "2":
          e.preventDefault();
          changePlaybackRate(0.75);
          break;
        case "3":
          e.preventDefault();
          changePlaybackRate(1);
          break;
        case "4":
          e.preventDefault();
          changePlaybackRate(1.5);
          break;
        case "5":
          e.preventDefault();
          changePlaybackRate(2);
          break;
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [volume.value]);

  // Handle waveform click to seek
  function handleWaveformClick(e: MouseEvent) {
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    seek(percentage);
  }

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={waveformContainerRef}
      className="relative w-full bg-decay-void border-2 border-t-border font-mono"
      tabIndex={0}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        crossOrigin="anonymous"
      >
        Your browser does not support audio playback.
      </audio>

      {/* Title Bar */}
      {title && (
        <div className="border-b-2 border-t-border bg-decay-ash px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-t-accent font-bold text-xs">[♪]</span>
            <span className="text-t-text text-sm uppercase tracking-wide truncate">
              {title}
            </span>
          </div>
        </div>
      )}

      {/* Waveform Visualization */}
      <div className="relative bg-decay-void-soft p-4">
        {isLoading.value
          ? (
            <div className="h-32 flex items-center justify-center">
              <div className="text-t-accent text-xs animate-pulse">
                &gt; ANALYZING AUDIO DATA...
              </div>
            </div>
          )
          : error.value
          ? (
            <div className="h-32 flex items-center justify-center">
              <div className="text-analog-red-dim text-xs">
                &gt; ERROR: {error.value}
              </div>
            </div>
          )
          : (
            <div
              className="relative h-32 cursor-pointer group"
              onClick={handleWaveformClick}
            >
              {/* Waveform Bars */}
              <div className="absolute inset-0 flex items-center gap-[2px] px-1">
                {waveformData.value.map((height, index) => {
                  const barProgress = (index / waveformData.value.length) * 100;
                  const isPassed = barProgress <= progress.value;

                  return (
                    <div
                      key={index}
                      className="flex-1 min-w-[2px] transition-all duration-75"
                      style={{
                        height: `${Math.max(4, height)}%`,
                        backgroundColor: isPassed
                          ? "rgba(255, 51, 102, 0.9)" // analog-red
                          : "rgba(51, 102, 255, 0.5)", // analog-blue-dim
                        boxShadow: isPassed
                          ? "0 0 4px rgba(255, 51, 102, 0.6)"
                          : "none",
                      }}
                    />
                  );
                })}
              </div>

              {/* Progress Indicator Line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-t-accent shadow-vhs-glow pointer-events-none transition-all duration-100"
                style={{ left: `${progress.value}%` }}
              />

              {/* VHS Scanline Effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                }}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-t-accent opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
            </div>
          )}

        {/* Time Display */}
        <div className="flex justify-between items-center mt-2 text-xs text-t-text-muted">
          <span className="tabular-nums">{formattedCurrentTime.value}</span>
          <span className="text-t-accent text-[10px]">
            {isPlaying.value ? "● REC" : "■ STOP"}
          </span>
          <span className="tabular-nums">{formattedDuration.value}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="border-t-2 border-t-border bg-decay-ash px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left Controls: Play/Pause */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading.value}
              className="w-10 h-10 border-2 border-t-accent bg-decay-void hover:bg-t-accent hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-t-accent text-xl"
              aria-label={isPlaying.value ? "Pause" : "Play"}
            >
              {isPlaying.value ? "❚❚" : "▶"}
            </button>

            {/* Skip Buttons */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => skipTime(-5)}
                className="px-2 py-1 border border-t-border bg-decay-void hover:border-t-accent text-t-text-dim hover:text-t-accent text-xs transition-colors"
                aria-label="Skip backward 5 seconds"
              >
                ⏪5s
              </button>
              <button
                type="button"
                onClick={() => skipTime(5)}
                className="px-2 py-1 border border-t-border bg-decay-void hover:border-t-accent text-t-text-dim hover:text-t-accent text-xs transition-colors"
                aria-label="Skip forward 5 seconds"
              >
                5s⏩
              </button>
            </div>
          </div>

          {/* Center Controls: Volume */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <button
              type="button"
              onClick={toggleMute}
              className="text-t-accent hover:text-t-accent-secondary text-sm transition-colors shrink-0"
              aria-label={isMuted.value ? "Unmute" : "Mute"}
            >
              {isMuted.value
                ? "🔇"
                : volume.value > 0.5
                ? "🔊"
                : volume.value > 0
                ? "🔉"
                : "🔈"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume.value}
              onChange={(e) =>
                changeVolume(parseFloat((e.target as HTMLInputElement).value))}
              className="flex-1 h-1 bg-t-border accent-t-accent cursor-pointer"
              style={{
                background:
                  `linear-gradient(to right, var(--theme-accent) 0%, var(--theme-accent) ${
                    volume.value * 100
                  }%, var(--theme-border) ${
                    volume.value * 100
                  }%, var(--theme-border) 100%)`,
              }}
              aria-label="Volume"
            />
            <span className="text-t-text-muted text-xs tabular-nums shrink-0 w-8 text-right">
              {Math.round(volume.value * 100)}%
            </span>
          </div>

          {/* Right Controls: Playback Speed */}
          <div className="relative group/speed">
            <button
              type="button"
              className="px-3 py-1 border-2 border-t-border bg-decay-void hover:border-t-accent text-t-accent hover:text-t-accent-secondary text-xs transition-colors"
            >
              {playbackRate.value}x
            </button>
            <div className="absolute bottom-full right-0 mb-2 bg-decay-ash border-2 border-t-border opacity-0 group-hover/speed:opacity-100 transition-opacity pointer-events-none group-hover/speed:pointer-events-auto z-10 shadow-void-deep">
              {playbackRates.map((rate) => (
                <button
                  type="button"
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`block w-full px-4 py-2 text-xs text-left transition-colors ${
                    playbackRate.value === rate
                      ? "bg-t-accent text-black font-bold"
                      : "text-t-text hover:bg-t-accent hover:text-black"
                  }`}
                >
                  {rate}x SPEED
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-3 pt-3 border-t border-t-border text-t-text-muted text-[10px] leading-relaxed">
          <span className="text-t-accent">[KEYS]</span>{" "}
          SPACE: Play/Pause • ←→: Skip 5s • ↑↓: Volume • M: Mute • 1-5: Speed
          (0.5x-2x)
        </div>
      </div>
    </div>
  );
}
