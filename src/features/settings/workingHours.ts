// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { DayOfWeek, WorkingHours } from "microsoft-graph";

// "08:30:00.0000000" -> 510, null if unparsable
export function parseTimeOfDay(value?: string | null): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(value || "");
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes >= 0 && minutes <= 24 * 60 ? minutes : null;
}

export const formatTimeOfDay = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00.0000000`;

// 30 minute steps, plus extra values not before `from`
export function timeChoices(from: number, to: number, extra: Array<number | null> = []): number[] {
  const list = new Set<number>();
  for (let m = from; m <= to; m += 30) list.add(m);
  extra.forEach(m => { if (m !== null && m >= from) list.add(m); });
  return [...list].sort((a, b) => a - b);
}

// Unchanged times go back as the mailbox had them. Never use the browser zone.
export function buildWorkingHours(original: WorkingHours | null | undefined, days: DayOfWeek[], start: number, end: number, mailboxTimeZone?: string | null): WorkingHours {
  const startTime = original?.startTime && parseTimeOfDay(original.startTime) === start ? original.startTime : formatTimeOfDay(start);
  const endTime = original?.endTime && parseTimeOfDay(original.endTime) === end ? original.endTime : formatTimeOfDay(end);
  const timeZone = original?.timeZone?.name ? original.timeZone : mailboxTimeZone ? { name: mailboxTimeZone } : undefined;
  return { ...original, daysOfWeek: days, startTime, endTime, ...(timeZone ? { timeZone } : {}) };
}
