// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Calendar, Event } from "microsoft-graph";

export type CalendarViewName = "day" | "week" | "work_week" | "month" | "agenda";

export type CalendarEvent = Event & {
  calendarId: string;
  start_: Date;
  end_: Date;
  color: string;
  // Shared calendar events are read-only
  readOnly?: boolean;
};

export type CalendarState = {
  calendars: Calendar[];
  calendarsLoaded: boolean;
  calendarsLoading: boolean;
  visibleCalendarIds: string[];
  events: Record<string, Event[]>;
  loading: Record<string, boolean>;
  range?: { start: string; end: string };
  // Older responses are ignored
  requestedRange?: { start: string; end: string };
  details: Record<string, Event>;
  view: CalendarViewName;
  prefs: CalendarPrefs;
  shared: Array<{ address: string; name: string; color?: string }>;
  calendarErrors: Record<string, string>;
  error?: string;
};

export type CalendarPrefs = {
  weekStartsOn: 0 | 1 | 6;
  workDayStart: number;
  workDayEnd: number;
  workDays: number[];
  showWeekNumbers: boolean;
  timeStep: 15 | 30 | 60;
  sidebarVisible: boolean;
  defaultReminder: number;
  defaultDuration: number;
};
