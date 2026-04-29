// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { DateTimeTimeZone, DayOfWeek, NullableOption, PatternedRecurrence } from "microsoft-graph";
import { graphDateToDate } from "../calendar/dates";

const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Midnight is date-only since we write due dates as UTC midnight.
// Anything else is an instant, shown in the browser zone.
export function graphCalendarDate(value?: NullableOption<DateTimeTimeZone>): string | null {
  if (!value?.dateTime || !/^\d{4}-\d{2}-\d{2}/.test(value.dateTime)) return null;
  if (!value.dateTime.includes("T") || /T00:00(:00(\.0+)?)?$/.test(value.dateTime)) return value.dateTime.slice(0, 10);
  const d = graphDateToDate(value);
  return isNaN(d.getTime()) ? null : localDate(d);
}

export const taskDueDate = graphCalendarDate;
export const taskCompletedDate = graphCalendarDate;

export const dueDateValue = (date: string | null): DateTimeTimeZone | null => date ? { dateTime: `${date}T00:00:00`, timeZone: "UTC" } : null;

// No zone conversion
export function formatDateOnly(date: string | null, locale?: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
}

export type RepeatKey = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";

const WEEKDAYS: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Anchored on the due date
export function buildRecurrence(key: RepeatKey, dueDate: string): PatternedRecurrence | null {
  if (key === "none") return null;
  const [y, m, d] = dueDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const range = { type: "noEnd" as const, startDate: dueDate };
  switch (key) {
  case "daily": return { pattern: { type: "daily", interval: 1 }, range };
  case "weekdays": return { pattern: { type: "weekly", interval: 1, daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"], firstDayOfWeek: "sunday" }, range };
  case "weekly": return { pattern: { type: "weekly", interval: 1, daysOfWeek: [weekday], firstDayOfWeek: "sunday" }, range };
  case "monthly": return { pattern: { type: "absoluteMonthly", interval: 1, dayOfMonth: d }, range };
  case "yearly": return { pattern: { type: "absoluteYearly", interval: 1, dayOfMonth: d, month: m }, range };
  }
}

export function repeatKey(recurrence?: NullableOption<PatternedRecurrence>): RepeatKey {
  if (!recurrence?.pattern) return "none";
  const p = recurrence.pattern;
  if (p.type === "daily") return "daily";
  if (p.type === "weekly") return (p.daysOfWeek?.length || 0) >= 5 && !p.daysOfWeek?.includes("saturday") ? "weekdays" : "weekly";
  if (p.type?.includes("Monthly")) return "monthly";
  if (p.type?.includes("Yearly")) return "yearly";
  return "none";
}
