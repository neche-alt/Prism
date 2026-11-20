"use client";

import { useEffect } from "react";

/** True on Apple platforms — used to pick ⌘ vs Ctrl in shortcut labels. */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform || navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

export interface ShortcutOptions {
  /** Require the platform modifier (⌘ on macOS, Ctrl elsewhere). */
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** When false, the listener is not attached. */
  enabled?: boolean;
  /** Prevent the default action when the shortcut fires (default true). */
  preventDefault?: boolean;
}

function keyMatches(e: KeyboardEvent, key: string): boolean {
  if (e.key === key) return true;
  if (e.key.toLowerCase() === key.toLowerCase()) return true;
  // "?" is Shift+"/" on many layouts; the browser may report "/" with shift held.
  if (key === "?" && e.key === "/" && e.shiftKey) return true;
  return false;
}

/**
 * Bind a keyboard shortcut to the window. When `meta` and `ctrl` are both set
 * the shortcut fires on either platform's modifier (⌘ on macOS, Ctrl elsewhere),
 * so a single registration covers both platforms.
 */
export function useGlobalShortcut(
  key: string,
  opts: ShortcutOptions,
  handler: (e: KeyboardEvent) => void
): void {
  useEffect(() => {
    if (opts.enabled === false) return;
    if (typeof window === "undefined") return;

    function listener(e: KeyboardEvent) {
      if (!keyMatches(e, key)) return;
      const wantMod = Boolean(opts.meta || opts.ctrl);
      const hasMod = e.metaKey || e.ctrlKey;
      const modOk = wantMod ? hasMod : !hasMod;
      const shiftOk = opts.shift ? e.shiftKey : true;
      const altOk = opts.alt ? e.altKey : true;
      if (!modOk || !shiftOk || !altOk) return;
      if (opts.preventDefault !== false) e.preventDefault();
      handler(e);
    }

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [
    key,
    opts.enabled,
    opts.meta,
    opts.ctrl,
    opts.shift,
    opts.alt,
    opts.preventDefault,
    handler,
  ]);
}
