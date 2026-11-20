"use client";

export interface StepControlsProps {
  currentStep?: number;
  totalSteps?: number;
  onStepOver?: () => void;
  onStepInto?: () => void;
  onStepOut?: () => void;
  onContinue?: () => void;
}

/**
 * Debug stepping controls. The bar is focusable (tabindex=0); when focused the
 * N / S / O / C keys drive step over / into / out / continue. These keys are the
 * same ones advertised in the CommandPalette shortcut registry so the help
 * overlay stays accurate.
 */
export default function StepControls({
  currentStep = 0,
  totalSteps = 0,
  onStepOver,
  onStepInto,
  onStepOut,
  onContinue,
}: StepControlsProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key.toLowerCase();
    if (key === "n") {
      e.preventDefault();
      onStepOver?.();
    } else if (key === "s") {
      e.preventDefault();
      onStepInto?.();
    } else if (key === "o") {
      e.preventDefault();
      onStepOut?.();
    } else if (key === "c") {
      e.preventDefault();
      onContinue?.();
    }
  }

  return (
    <div
      tabIndex={0}
      role="toolbar"
      aria-label="Stepping controls"
      onKeyDown={handleKeyDown}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <button
        type="button"
        onClick={onStepOver}
        className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
      >
        Step Over
      </button>
      <button
        type="button"
        onClick={onStepInto}
        className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
      >
        Step Into
      </button>
      <button
        type="button"
        onClick={onStepOut}
        className="px-3 py-1.5 text-sm rounded border border-gray-200 hover:bg-gray-50"
      >
        Step Out
      </button>
      <button
        type="button"
        onClick={onContinue}
        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Continue
      </button>
      <span className="ml-2 text-xs text-gray-500">
        {totalSteps > 0
          ? `Step ${currentStep + 1} / ${totalSteps}`
          : "No active trace"}
      </span>
      <span className="ml-1 text-xs text-gray-400">Keys: N · S · O · C</span>
    </div>
  );
}
