"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalShortcut } from "@/lib/shortcuts";

export interface ShortcutEntry {
  id: string;
  area: string;
  description: string;
  keys: { mac: string; other: string };
}

/**
 * The canonical shortcut registry for the app. The keyboard-shortcut help
 * overlay imports this list so there is a single source of truth for every
 * discoverable shortcut (grouped by area).
 */
export const SHORTCUTS: ShortcutEntry[] = [
  {
    id: "palette.open",
    area: "Global",
    description: "Open command palette",
    keys: { mac: "⌘K", other: "Ctrl+K" },
  },
  {
    id: "shortcuts.help",
    area: "Global",
    description: "Show keyboard shortcuts",
    keys: { mac: "⌘?", other: "Ctrl+?" },
  },
  {
    id: "step.over",
    area: "Stepping",
    description: "Step over (when stepping bar is focused)",
    keys: { mac: "N", other: "N" },
  },
  {
    id: "step.into",
    area: "Stepping",
    description: "Step into (when stepping bar is focused)",
    keys: { mac: "S", other: "S" },
  },
  {
    id: "step.out",
    area: "Stepping",
    description: "Step out (when stepping bar is focused)",
    keys: { mac: "O", other: "O" },
  },
  {
    id: "step.continue",
    area: "Stepping",
    description: "Continue execution (when stepping bar is focused)",
    keys: { mac: "C", other: "C" },
  },
];

interface Command {
  id: string;
  label: string;
  run: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  const commands: Command[] = [
    { id: "decode", label: "Decode an error", run: () => router.push("/decode") },
    { id: "trace", label: "Trace a transaction", run: () => router.push("/trace") },
    { id: "home", label: "Go to home", run: () => router.push("/") },
  ];

  useGlobalShortcut("k", { meta: true, ctrl: true }, () => {
    setOpen((o) => {
      if (!o && typeof document !== "undefined") {
        prevFocus.current = document.activeElement as HTMLElement | null;
      }
      return !o;
    });
  });

  // Focus the input on open and return focus to the trigger on close.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      prevFocus.current?.focus();
      prevFocus.current = null;
    }
  }, [open]);

  if (!open) return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  function execute(cmd: Command) {
    setOpen(false);
    cmd.run();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Type a command…"
          aria-label="Command palette search"
          className="w-full px-4 py-3 border-b border-gray-200 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              const cmd = filtered[active];
              if (cmd) execute(cmd);
            }
          }}
        />
        <ul className="max-h-72 overflow-auto">
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => execute(c)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  i === active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                }`}
              >
                {c.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500">No commands found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
