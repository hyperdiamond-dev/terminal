interface WarningBannerProps {
  warnings: string[];
}

/**
 * Non-blocking notice for partial page loads (e.g. media content failed
 * to fetch but the page still rendered).
 */
export default function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      role="status"
      class="border-2 border-t-accent-secondary/50 bg-t-surface px-4 py-2 mb-6 space-y-1"
    >
      {warnings.map((w) => (
        <p key={w} class="font-mono text-sm text-t-text-dim">
          &gt; SIGNAL DEGRADED: {w}
        </p>
      ))}
    </div>
  );
}
