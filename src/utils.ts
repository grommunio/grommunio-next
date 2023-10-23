// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import moment from "moment";

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
    { key: 'ua-UA', value: 'uk_UA: українська' },
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