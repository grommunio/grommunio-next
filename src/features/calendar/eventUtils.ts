// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { DayOfWeek, PatternedRecurrence, WeekIndex } from "microsoft-graph";
import { dayjs, Dayjs } from "./dates";

export const WEEKDAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const WEEK_INDEX: WeekIndex[] = ["first", "second", "third", "fourth", "last"];

export const weekdayOf = (d: Dayjs): DayOfWeek => WEEKDAYS[(d.day() + 6) % 7];

export function weekIndexOf(d: Dayjs): WeekIndex {
  const nth = Math.ceil(d.date() / 7);
  return nth >= 5 ? "last" : WEEK_INDEX[nth - 1];
}

// Graph's all-day end is exclusive, the editor shows the last day
export function toInclusiveAllDayEnd(start: Dayjs, graphEnd: Dayjs): Dayjs {
  const first = start.startOf("day");
  const last = graphEnd.isSame(graphEnd.startOf("day")) ? graphEnd.subtract(1, "day") : graphEnd.startOf("day");
  return last.isBefore(first) ? first : last;
}

export const toExclusiveAllDayEnd = (inclusiveEnd: Dayjs): Dayjs => inclusiveEnd.startOf("day").add(1, "day");

export function isAllDaySelection(view: string, slot: { start: Date; end: Date; slots: Date[]; action: string }): boolean {
  const start = dayjs(slot.start);
  const end = dayjs(slot.end);
  if (!start.isSame(start.startOf("day")) || !end.isSame(end.startOf("day"))) return false;
  if (view === "month") return slot.slots.length > 1;
  // Time grid selections yield one slot per time step, all-day row selections one per day
  return end.diff(start, "day") === slot.slots.length;
}

// Graph requires range.startDate to match the event start
export function alignRecurrence(recurrence: PatternedRecurrence, start: Dayjs): PatternedRecurrence {
  const pattern = { ...recurrence.pattern };
  switch (pattern.type) {
  case "absoluteMonthly":
    pattern.dayOfMonth = start.date();
    break;
  case "absoluteYearly":
    pattern.dayOfMonth = start.date();
    pattern.month = start.month() + 1;
    break;
  case "relativeMonthly":
    pattern.daysOfWeek = [weekdayOf(start)];
    pattern.index = weekIndexOf(start);
    break;
  case "relativeYearly":
    pattern.daysOfWeek = [weekdayOf(start)];
    pattern.index = weekIndexOf(start);
    pattern.month = start.month() + 1;
    break;
  case "weekly":
    if (!pattern.daysOfWeek?.length) pattern.daysOfWeek = [weekdayOf(start)];
    break;
  }
  const range = { ...recurrence.range, startDate: start.format("YYYY-MM-DD") };
  if (range.type === "endDate" && range.endDate && range.endDate < range.startDate) range.endDate = range.startDate;
  return { pattern, range };
}

export function safeHttpUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export function sameDomain(a?: string | null, b?: string | null): boolean {
  const domain = (x?: string | null) => x?.trim().toLowerCase().split("@")[1] || "";
  return Boolean(domain(a)) && domain(a) === domain(b);
}

export function availabilityRanges(view: string): Array<{ from: number; to: number; code: string }> {
  const ranges: Array<{ from: number; to: number; code: string }> = [];
  for (let i = 0; i < view.length; i++) {
    const code = view[i];
    if (code === "0") continue;
    const last = ranges[ranges.length - 1];
    if (last && last.code === code && last.to === i) last.to = i + 1;
    else ranges.push({ from: i, to: i + 1, code });
  }
  return ranges;
}
