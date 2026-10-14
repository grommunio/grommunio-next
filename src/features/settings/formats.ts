// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { dayjs } from "../calendar/dates";

// Exchange only accepts the short date/time patterns of the mailbox culture.
// Known-valid ones per culture, other cultures only get the current value.
const DATE_FORMATS: Record<string, string[]> = {
  "en-US": ["M/d/yyyy", "M/d/yy", "MM/dd/yy", "MM/dd/yyyy", "yy/MM/dd", "yyyy-MM-dd", "dd-MMM-yy"],
  "en-GB": ["dd/MM/yyyy", "dd/MM/yy", "d/M/yy", "d.M.yy", "yyyy-MM-dd"],
  "de-DE": ["dd.MM.yyyy", "dd.MM.yy", "d.M.yyyy", "d.M.yy", "yyyy-MM-dd"],
  "de-AT": ["dd.MM.yyyy", "dd.MM.yy", "d.M.yyyy", "d.M.yy", "yyyy-MM-dd"],
  "de-CH": ["dd.MM.yyyy", "dd.MM.yy", "yyyy-MM-dd"],
  "fr-FR": ["dd/MM/yyyy", "dd/MM/yy", "dd.MM.yy", "dd-MM-yy", "yyyy-MM-dd"],
  "es-ES": ["dd/MM/yyyy", "dd/MM/yy", "d/M/yy", "d/MM/yy", "yyyy-MM-dd"],
  "it-IT": ["dd/MM/yyyy", "dd/MM/yy", "d/M/yy", "dd.MM.yy", "yyyy-MM-dd"],
};

const TIME_FORMATS: Record<string, string[]> = {
  "en-US": ["h:mm tt", "hh:mm tt", "H:mm", "HH:mm"],
  "en-GB": ["HH:mm", "H:mm", "hh:mm tt", "h:mm tt"],
  "de-DE": ["HH:mm", "H:mm"],
  "de-AT": ["HH:mm", "H:mm"],
  "de-CH": ["HH:mm", "H:mm"],
  "fr-FR": ["HH:mm", "H:mm"],
  "es-ES": ["H:mm", "HH:mm"],
  "it-IT": ["HH:mm", "H:mm"],
};

const lookup = (table: Record<string, string[]>, locale?: string | null) => {
  if (!locale) return [];
  const key = Object.keys(table).find(k => k.toLowerCase() === locale.toLowerCase());
  return key ? table[key] : [];
};

// Current value first so it stays selected
const withCurrent = (list: string[], current?: string | null) => current && !list.includes(current) ? [current, ...list] : list;

export const dateFormatOptions = (locale?: string | null, current?: string | null) => withCurrent(lookup(DATE_FORMATS, locale), current);
export const timeFormatOptions = (locale?: string | null, current?: string | null) => withCurrent(lookup(TIME_FORMATS, locale), current);

export const isValidFormat = (kind: "date" | "time", locale: string | null | undefined, value: string) =>
  lookup(kind === "date" ? DATE_FORMATS : TIME_FORMATS, locale).includes(value);

export function toDayjsPattern(pattern: string): string {
  return pattern.replace(/yyyy|yy|dd|d|tt|'[^']*'/g, m => {
    if (m.startsWith("'")) return `[${m.slice(1, -1)}]`;
    return ({ yyyy: "YYYY", yy: "YY", dd: "DD", d: "D", tt: "A" } as Record<string, string>)[m];
  });
}

export const formatExample = (pattern: string, date = dayjs()) => `${pattern} (${date.format(toDayjsPattern(pattern))})`;
