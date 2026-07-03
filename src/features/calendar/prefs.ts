// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { CalendarPrefs, CalendarViewName } from "./types";

const PREFS_KEY = "calendar.prefs";
const VISIBLE_KEY = "calendar.visible";
const VIEW_KEY = "calendarView";

export const DEFAULT_CALENDAR_PREFS: CalendarPrefs = {
  weekStartsOn: 1,
  workDayStart: 8,
  workDayEnd: 17,
  workDays: [1, 2, 3, 4, 5],
  showWeekNumbers: false,
  timeStep: 30,
  sidebarVisible: true,
  defaultReminder: 15,
  defaultDuration: 30,
};

export function loadCalendarPrefs(): CalendarPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_CALENDAR_PREFS, ...JSON.parse(raw) } : DEFAULT_CALENDAR_PREFS;
  } catch {
    return DEFAULT_CALENDAR_PREFS;
  }
}

export const saveCalendarPrefs = (prefs: CalendarPrefs) => window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));

export function loadVisibleCalendars(): string[] | null {
  try {
    const raw = window.localStorage.getItem(VISIBLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const saveVisibleCalendars = (ids: string[]) => window.localStorage.setItem(VISIBLE_KEY, JSON.stringify(ids));

export function loadView(): CalendarViewName {
  const stored = window.localStorage.getItem(VIEW_KEY);
  return (["day", "week", "work_week", "month", "agenda"].includes(stored || "") ? stored : "week") as CalendarViewName;
}

export const saveView = (view: CalendarViewName) => window.localStorage.setItem(VIEW_KEY, view);

// Other people's calendars added from the directory
export type SharedCalendarRef = { address: string; name: string; color?: string };

const SHARED_KEY = "calendar.shared";
export const SHARED_PREFIX = "shared:";

export const sharedCalendarId = (address: string) => SHARED_PREFIX + address.toLowerCase();
export const isSharedCalendarId = (id?: string | null) => Boolean(id && id.startsWith(SHARED_PREFIX));

export function loadSharedCalendars(): SharedCalendarRef[] {
  try {
    const raw = window.localStorage.getItem(SHARED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(r => r && typeof r.address === "string") : [];
  } catch {
    return [];
  }
}

export const saveSharedCalendars = (refs: SharedCalendarRef[]) => window.localStorage.setItem(SHARED_KEY, JSON.stringify(refs));
