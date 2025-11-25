// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { rgbToHex } from "@mui/material";
import type { DateTimeTimeZone, NullableOption } from "microsoft-graph";
import { dayjs, graphDateToDate } from "./features/calendar/dates";

export function getLangs() {
  return [
    { key: 'ca-ES', value: 'ca_ES: català' },
    { key: 'cs-CZ', value: 'cs_CZ: Čeština' },
    { key: 'da-DK', value: 'da_DK: Dansk' },
    { key: 'de-DE', value: 'de_DE: Deutsch' },
    { key: 'en-US', value: 'en_US: English' },
    { key: 'el-GR', value: 'el_GR: Ελληνική' },
    { key: 'es-ES', value: 'es_ES: Español' },
    { key: 'fi-FI', value: 'fi_FI: Suomi' },
    { key: 'fr-FR', value: 'fr_FR: Français' },
    { key: 'hu-HU', value: 'hu_HU: Magyar' },
    { key: 'it-IT', value: 'it_IT: Italiano' },
    { key: 'ja-JP', value: 'ja_JP: 日本語' },
    { key: 'nb-NO', value: 'nb_NO: Norsk (bokmål)'},
    { key: 'nl-NL', value: 'nl_NL: Nederlands' },
    { key: 'pl-PL', value: 'pl_PL: Polski' },
    { key: 'pt-PT', value: 'pt_PT: Português europeu' },
    { key: 'ru-RU', value: 'ru_RU: русский' },
    { key: 'sl-SL', value: 'sl_SL: slovenščina' },
    { key: 'tr-TR', value: 'tr_TR: Türkçe' },
    { key: 'uk-UA', value: 'uk_UA: українська' },
    { key: 'zh-CN', value: 'zh_CN: 中文(简体)' },
    { key: 'zh-TW', value: 'zh_TW: 繁體中文' },
  ];
}

// Formats in the browser's zone, format takes dayjs localized tokens like lll
export function toReadableTimeInTimezone(msDatetime?: NullableOption<DateTimeTimeZone>, dateFormat = "lll"): string {
  if (!msDatetime?.dateTime) return "";
  const date = graphDateToDate(msDatetime);
  if (isNaN(date.getTime())) return "";
  return dayjs(date).format(dateFormat);
}

export function convertToDarkModeColor(color: string) {
  if(!color.startsWith("#")) {
    color = rgbToHex(color);
  }

  // TODO: Instead of inverting the color, a proper darkmode equivalent should be calculated
  return invertColor(color);
}

export function invertColor(hex: string) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  // invert color components
  const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
    g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
    b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str: string, len=2) {
  const zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

export const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
});

export const readableBytesFormat = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let result = bytes;
  let unit = 0;
  while(result >= 1024 && unit < units.length - 1) {
    result /= 1024;
    unit++;
  }
  return (unit === 0 ? result : result.toFixed(1)) + " " + units[unit];
}

export function initialsOf(name?: string | null): string {
  const words = (name || "").replace(/[<>()"]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ["#7b61ff", "#0078d4", "#038387", "#498205", "#ca5010", "#c239b3", "#8e562e", "#5c2e91", "#e3008c", "#004e8c", "#10893e", "#d13438"];

export function avatarColor(key?: string | null): string {
  const s = (key || "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
