// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isBetween from "dayjs/plugin/isBetween";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import localeData from "dayjs/plugin/localeData";
import minMax from "dayjs/plugin/minMax";
import duration from "dayjs/plugin/duration";
import updateLocale from "dayjs/plugin/updateLocale";
import type { DateTimeTimeZone, NullableOption } from "microsoft-graph";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(localeData);
dayjs.extend(minMax);
dayjs.extend(duration);
dayjs.extend(updateLocale);

// Graph accepts IANA zones in Prefer: outlook.timezone
export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const LOCALE_LOADERS: Record<string, () => Promise<unknown>> = {
  ca: () => import("dayjs/locale/ca"),
  cs: () => import("dayjs/locale/cs"),
  da: () => import("dayjs/locale/da"),
  de: () => import("dayjs/locale/de"),
  el: () => import("dayjs/locale/el"),
  es: () => import("dayjs/locale/es"),
  fi: () => import("dayjs/locale/fi"),
  fr: () => import("dayjs/locale/fr"),
  hu: () => import("dayjs/locale/hu"),
  it: () => import("dayjs/locale/it"),
  ja: () => import("dayjs/locale/ja"),
  nb: () => import("dayjs/locale/nb"),
  nl: () => import("dayjs/locale/nl"),
  pl: () => import("dayjs/locale/pl"),
  pt: () => import("dayjs/locale/pt"),
  ru: () => import("dayjs/locale/ru"),
  sl: () => import("dayjs/locale/sl"),
  tr: () => import("dayjs/locale/tr"),
  uk: () => import("dayjs/locale/uk"),
  "zh-cn": () => import("dayjs/locale/zh-cn"),
  "zh-tw": () => import("dayjs/locale/zh-tw"),
};

export async function setDayjsLocale(language: string): Promise<string> {
  const lower = language.toLowerCase();
  const key = LOCALE_LOADERS[lower] ? lower : lower.split("-")[0];
  if (key === "en" || !LOCALE_LOADERS[key]) {
    dayjs.locale("en");
    return "en";
  }
  await LOCALE_LOADERS[key]();
  dayjs.locale(key);
  return key;
}

export function applyWeekStart(weekStart: number): void {
  dayjs.updateLocale(dayjs.locale(), { weekStart });
}

// Graph returns wall clock times without offset, in the zone from Prefer: outlook.timezone.
// Only correct as long as we request the browser zone.
export function graphDateToDate(value?: NullableOption<DateTimeTimeZone>): Date {
  if (!value?.dateTime) return new Date(NaN);
  const zone = value.timeZone;
  if (!zone || zone === browserTimeZone()) {
    // Strip fractional seconds beyond milliseconds, Graph sends 7 digits
    return new Date(value.dateTime.replace(/(\.\d{3})\d+$/, "$1"));
  }
  if (zone === "UTC" || zone === "tzone://Microsoft/Utc") {
    return dayjs.utc(value.dateTime).toDate();
  }
  try {
    return dayjs.tz(value.dateTime.replace(/(\.\d{3})\d+$/, "$1"), zone).toDate();
  } catch {
    return new Date(value.dateTime);
  }
}

export function dateToGraphDate(date: Date | Dayjs, allDay = false): DateTimeTimeZone {
  const d = dayjs(date);
  return {
    dateTime: allDay ? d.startOf("day").format("YYYY-MM-DDTHH:mm:ss") : d.format("YYYY-MM-DDTHH:mm:ss"),
    timeZone: browserTimeZone(),
  };
}

export function roundToStep(date: Dayjs, stepMinutes = 30): Dayjs {
  const minutes = date.minute();
  const rounded = Math.ceil(minutes / stepMinutes) * stepMinutes;
  return date.minute(0).second(0).millisecond(0).add(rounded, "minute");
}

export function formatEventRange(start: Date, end: Date, allDay: boolean): string {
  const s = dayjs(start);
  const e = dayjs(end);
  if (allDay) {
    // Graph all-day events end at midnight of the following day
    const lastDay = e.subtract(1, "minute");
    return s.isSame(lastDay, "day") ? s.format("dddd, LL") : `${s.format("LL")} – ${lastDay.format("LL")}`;
  }
  if (s.isSame(e, "day")) return `${s.format("dddd, LL")} · ${s.format("LT")} – ${e.format("LT")}`;
  return `${s.format("LLL")} – ${e.format("LLL")}`;
}

export function formatDuration(start: Date, end: Date): string {
  const minutes = dayjs(end).diff(dayjs(start), "minute");
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} h ${rest} min` : `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} d`;
}

export { dayjs };
export type { Dayjs };
