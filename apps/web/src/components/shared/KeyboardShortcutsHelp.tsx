"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobalShortcut, isMac } from "@/lib/shortcuts";
import { SHORTCUTS } from "@/components/shared/CommandPalette";

/**
 * A Cmd/Ctrl + ? overlay that lists every keyboard shortcut, grouped by area.
 * It reuses the shortcut registry owned by the CommandPalette, is focus-trapped,
 * and dismisses with Esc.
 */
export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const mac = isMac();

  useGlobalShortcut("?", { meta: true, ctrl: true }, () => {
    setOpen((o) => {
      if (!o && typeof document !== "undefined") {
        prevFocus.current = document.activeElement as HTMLElement | null;
      }
      return !o;
    });
  });

  // While open: focus the panel and trap Tab. On close: restore focus to the
  // element that had focus before the overlay opened.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    panel.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    panel.addEventListener("keydown", onKey);
    return () => {
      panel.removeEventListener("keydown", onKey);
      prevFocus.current?.focus();
      prevFocus.current = null;
    };
  }, [open]);

  if (!open) return null;

  const areas = Array.from(new Set(SHORTCUTS.map((s) => s.area)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 outline-none"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard shortcuts</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close (Esc)
          </button>
        </div>

        <div className="space-y-5">
          {areas.map((area) => (
            <section key={area}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {area}
              </h4>
              <ul className="space-y-1.5">
                {SHORTCUTS.filter((s) => s.area === area).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">
                      {s.description}
                    </span>
                    <kbd className="font-mono text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
                      {mac ? s.keys.mac : s.keys.other}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
