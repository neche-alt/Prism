"use client";

export interface ReplayProgressBarProps {
  /** Zero-based index of the current node. */
  current: number;
  /** Total number of nodes. */
  total: number;
  /** Called with a new index when the user scrubs the progress bar. */
  onSeek?: (index: number) => void;
}

/**
 * A scrubber that reflects the replay position within the execution trace and
 * stays in sync with the timeline viewport (driven by the selected node).
 */
export default function ReplayProgressBar({
  current,
  total,
  onSeek,
}: ReplayProgressBarProps) {
  const max = Math.max(total - 1, 0);
  const safeCurrent = Math.min(Math.max(current, 0), max);
  const pct = max > 0 ? (safeCurrent / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 font-mono w-20">
        {total > 0 ? `${safeCurrent + 1} / ${total}` : "— / —"}
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={safeCurrent}
        disabled={total === 0}
        onChange={(e) => onSeek?.(Number(e.target.value))}
        aria-label="Replay position"
        className="flex-1 accent-blue-600"
      />
      <span className="text-xs text-gray-400 w-12 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
