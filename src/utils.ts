// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

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
