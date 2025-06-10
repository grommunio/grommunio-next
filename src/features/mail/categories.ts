// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { OutlookCategory } from "microsoft-graph";

// Outlook's 25 preset colors, keyed by Graph preset name
export const CATEGORY_PRESETS: Array<{ preset: string; label: string; color: string }> = [
  { preset: "preset0", label: "Red", color: "#d13438" },
  { preset: "preset1", label: "Orange", color: "#ff8c00" },
  { preset: "preset2", label: "Brown", color: "#986f0b" },
  { preset: "preset3", label: "Yellow", color: "#e3c800" },
  { preset: "preset4", label: "Green", color: "#498205" },
  { preset: "preset5", label: "Teal", color: "#008272" },
  { preset: "preset6", label: "Olive", color: "#8a8d2a" },
  { preset: "preset7", label: "Blue", color: "#0078d4" },
  { preset: "preset8", label: "Purple", color: "#8764b8" },
  { preset: "preset9", label: "Cranberry", color: "#c239b3" },
  { preset: "preset10", label: "Steel", color: "#69797e" },
  { preset: "preset11", label: "Dark steel", color: "#4a5459" },
  { preset: "preset12", label: "Gray", color: "#8a8886" },
  { preset: "preset13", label: "Dark gray", color: "#605e5c" },
  { preset: "preset14", label: "Black", color: "#1f1f1f" },
  { preset: "preset15", label: "Dark red", color: "#a4262c" },
  { preset: "preset16", label: "Dark orange", color: "#ca5010" },
  { preset: "preset17", label: "Dark brown", color: "#7a4a1f" },
  { preset: "preset18", label: "Dark yellow", color: "#c19c00" },
  { preset: "preset19", label: "Dark green", color: "#0b6a0b" },
  { preset: "preset20", label: "Dark teal", color: "#005b70" },
  { preset: "preset21", label: "Dark olive", color: "#5c6300" },
  { preset: "preset22", label: "Dark blue", color: "#004e8c" },
  { preset: "preset23", label: "Dark purple", color: "#5c2e91" },
  { preset: "preset24", label: "Dark cranberry", color: "#8e0e4e" },
];

const PRESET_MAP = new Map(CATEGORY_PRESETS.map(p => [p.preset, p.color]));

export function presetColor(preset?: string | null): string {
  return (preset && PRESET_MAP.get(preset)) || "#8a8886";
}

export function categoryColor(name: string, categories: OutlookCategory[]): string {
  const category = categories.find(c => c.displayName === name);
  return presetColor(category?.color || undefined);
}
