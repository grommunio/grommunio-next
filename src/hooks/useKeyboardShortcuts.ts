// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { useEffect, useRef } from "react";

export type Shortcut = {
  // KeyboardEvent.key, case insensitive
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  allowInInput?: boolean;
  handler: (e: KeyboardEvent) => void;
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      // Menus, dialogs and pickers own the keyboard while they are open
      if (document.querySelector(".MuiModal-root:not([aria-hidden='true']), .MuiPopover-root, [role='menu'], [role='dialog']")) return;
      const typing = isTyping(e.target);
      for (const shortcut of ref.current) {
        if (typing && !shortcut.allowInInput) continue;
        if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;
        if (Boolean(shortcut.ctrl) !== (e.ctrlKey || e.metaKey)) continue;
        if (Boolean(shortcut.shift) !== e.shiftKey) continue;
        if (Boolean(shortcut.alt) !== e.altKey) continue;
        e.preventDefault();
        shortcut.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
