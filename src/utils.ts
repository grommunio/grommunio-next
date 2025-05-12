// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import moment, { Moment } from 'moment-timezone';
import DOMPurify from 'dompurify'; 
import { rgbToHex } from "@mui/material";
import { Contact, DateTimeTimeZone, EmailAddress, FileAttachment, NullableOption, Recipient } from "microsoft-graph";

export type URLParams = {
  [index: string]: string;
}

export function parseParams(s: string): URLParams {
  if (!s) {
    return {};
  }
  const segments = s.split('&');
  const data:URLParams = {};
  let parts;
  for (let i = 0; i < segments.length; i++) {
    parts = segments[i].split('=');
    if (parts.length < 2) {
      parts.push('');
    }
    data[decodeURIComponent(parts[0]) as keyof URLParams] = decodeURIComponent(parts[1]);
  }

  return data;
}

export function addItem(arr: Array<any>, item: any): Array<any> {
  const copy = [...arr];
  copy.push(item);
  return copy;
}

export function editItem(arr: Array<any>, item: any): Array<any> {
  const copy = [...arr];
  const idx = arr.findIndex(e => e.id === item.id);
  if (idx != -1) {
    copy[idx] = item;
  }
  return copy;
}

export function spliceArray(arr: Array<any>, index: number): Array<any> {
  const copy = [...arr];
  copy.splice(index, 1);
  return copy;
}

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

export function getStringAfterFirstSlash(): string {
  return window.location.pathname.split('/')[1] || '';
}

export function getStringAfterLastSlash() {
  return window?.location?.href.split("/").pop() || '';
}


export function buildQuery(endpoint: string, params={}): string {
  const paramsArray = Object.entries(params);
  if(paramsArray.length === 0) return endpoint;
  const query = endpoint + '?' + paramsArray.reduce((prev, [name, val]) => prev + (val !== undefined ? `${name}=${val}&` : ''), '');
  return query.slice(0, -1);
}

export function parseISODate(isoDateString: string) {
  if(!isoDateString) return "";
  // TODO: Get locale
  return moment(isoDateString).format('l'); // TODO: Format date depending on time since received
}

export function utcTimeToUserTimezone(msDatetime?: NullableOption<DateTimeTimeZone>): Moment | null {
  if(!msDatetime) return null;
  const { dateTime, timeZone } = msDatetime;
  if(!dateTime) return null;
  
  const preShiftTime = moment.tz(dateTime, timeZone || "");
  const shiftedTime = preShiftTime.tz(getUserTimezone());

  return shiftedTime;
}

export function toReadableTimeInTimezone(msDatetime?: NullableOption<DateTimeTimeZone>, dateFormat="lll") {
  const shiftedTime = utcTimeToUserTimezone(msDatetime);
  if(!shiftedTime) return "";
  return shiftedTime.format(dateFormat);
}

export function getReadableDuration(start: string, end: string) {
  if (!start || !end) return "";
  const duration = moment.duration(moment(end).diff(moment(start)));
  const minutes = duration.asMinutes();
  if(minutes < 60) {
    return minutes + " minutes";
  } else if (minutes < 1440) {
    return duration.asHours() + " hours";
  }
  return duration.asDays().toPrecision(1) + " days";
}

export function getMessageCategoryColor(pseudoColor: string) {
  switch(pseudoColor) {
  case "preset0": return 'red';
  case "preset1": return 'orange';
  case "preset3": return 'yellow';
  case "preset4": return 'green';
  case "preset7": return 'blue';
  case "preset8": return 'purple';
  // TODO: Add all preset colors
  default: return "white";
  }
}

export function hexColorToPresetName(pseudoColor: string) {
  switch(pseudoColor) {
  case "#ff0000": return 'preset0';
  case "#ffa500": return 'preset1';
  case "#ffff00": return 'preset3';
  case "#008000": return 'preset4';
  case "#0000ff": return 'preset7';
  case "#800080": return 'preset8';
  // TODO: Add all preset colors
  default: return "preset0";
  }
}

export function truncateString(str: string): string {
  const truncatedLength = 24;
  return str.length > truncatedLength ? `${str.substring(0, truncatedLength)}...` : str;
}

export function purify(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
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

export function gabSelectionToRequestFormat(contacts: Array<Contact>):  NullableOption<Recipient[]> {
  const res: Recipient[] = (contacts || []).filter(c => c.emailAddresses?.length! > 0).map((c: Contact) => ({
    emailAddress: {
      // TODO: Which email to select?
      address: c.emailAddresses![0].address,
    },
  }));
  return res;
}

// TODO: Implement properly
export function getUserTimezone() {
  return moment.tz.guess(true);
}

export function capitalizeFirstLetter(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
});

export const downloadBase64Content = (attachment: FileAttachment) => {
  const a = document.createElement("a");
  a.href = `data:${attachment.contentType};base64,${attachment.contentBytes}`; 
  a.download = attachment.name || "attachment";
  a.click();
}

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

/*
* Naively lookup email addresses in contacts. First match wins.
* If no contact is found, create a pseudo contact for the UI with the email address as displayname.
* Accepts Graph recipients ({ emailAddress: { name, address } }) as well as plain address strings.
*/
export const resolveContactsFromEmails = (emails: Array<Recipient | string> | string | undefined | null, contacts: Array<Contact>): Array<Contact> => {
  const list: Array<Recipient | string> = typeof emails === "string" ? emails.split(",") : (emails || []);
  return list
    .map((recipient): EmailAddress => typeof recipient === "string" ?
      { address: recipient.trim(), name: "" } :
      { address: recipient.emailAddress?.address || "", name: recipient.emailAddress?.name || "" })
    .filter(email => email.address)
    .map((email: EmailAddress) => {
      const contact = contacts.find((contact: Contact) =>
        contact.emailAddresses?.some((contactMail: EmailAddress) =>
          contactMail.address?.toLowerCase() === email.address?.toLowerCase()));

      if(contact) return contact;
      return {
        displayName: email.name || email.address,
        emailAddresses: [
          { name: email.name || "", address: email.address }
        ]
      } as Contact;
    });
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
