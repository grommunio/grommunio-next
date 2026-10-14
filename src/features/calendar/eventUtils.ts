// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Calendar, CalendarPermission, CalendarRoleType, DayOfWeek, Event, PatternedRecurrence, WeekIndex } from "microsoft-graph";
import { dayjs, Dayjs } from "./dates";
import { isSharedCalendarId } from "./prefs";

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

export const isWritableCalendar = (calendar: Calendar) => Boolean(calendar.id) && !isSharedCalendarId(calendar.id) && calendar.canEdit !== false;

// Organizers cancel, attendees decline, like Outlook
export function deleteModeFor(event: Event, hasAttendees = (event.attendees?.length || 0) > 0): "cancel" | "decline" | "delete" {
  if (event.isOrganizer !== false) return hasAttendees ? "cancel" : "delete";
  return event.responseStatus?.response === "declined" ? "delete" : "decline";
}

export const ATTENDEE_FIELDS = ["isReminderOn", "reminderMinutesBeforeStart", "showAs", "categories", "sensitivity"] as const;

export function attendeePatch(event: Event): Event {
  const result: Event = {};
  ATTENDEE_FIELDS.forEach(key => {
    if (event[key] !== undefined) (result as Record<string, unknown>)[key] = event[key];
  });
  return result;
}

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Not shared")
// t("Can view when I'm busy")
// t("Can view titles and locations")
// t("Can view all details")
// t("Can edit")
// t("Delegate")
// t("Delegate, can view private events")
// t("Custom")
export const SHARE_ROLES: Array<{ value: CalendarRoleType; label: string }> = [
  { value: "none", label: "Not shared" },
  { value: "freeBusyRead", label: "Can view when I'm busy" },
  { value: "limitedRead", label: "Can view titles and locations" },
  { value: "read", label: "Can view all details" },
  { value: "write", label: "Can edit" },
  { value: "delegateWithoutPrivateEventAccess", label: "Delegate" },
  { value: "delegateWithPrivateEventAccess", label: "Delegate, can view private events" },
  { value: "custom", label: "Custom" },
];

export const INVITE_ROLES = SHARE_ROLES.filter(r => r.value !== "none" && r.value !== "custom");

// "custom" can be shown but never picked
export function roleOptions(permission: CalendarPermission): Array<{ value: CalendarRoleType; label: string; disabled?: boolean }> {
  const current = permission.role || undefined;
  const allowed = permission.allowedRoles?.length ? permission.allowedRoles : INVITE_ROLES.map(r => r.value);
  const options = SHARE_ROLES
    .filter(r => r.value === current || (allowed.includes(r.value) && r.value !== "custom"))
    .map(r => r.value === "custom" ? { ...r, disabled: true } : r);
  // Unknown roles stay visible instead of rendering an empty select
  if (current && !options.some(r => r.value === current)) options.push({ value: current, label: current, disabled: true });
  return options;
}
