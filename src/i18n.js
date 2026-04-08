// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ca from './i18n/ca-ES.json';
import cs from './i18n/cs-CZ.json';
import da from './i18n/da-DK.json';
import de from './i18n/de-DE.json';
import en from './i18n/en-US.json';
import es from './i18n/es-ES.json';
import fi from './i18n/fi-FI.json';
import fr from './i18n/fr-FR.json';
import gr from './i18n/el-GR.json';
import hu from './i18n/hu-HU.json';
import it from './i18n/it-IT.json';
import ja from './i18n/ja-JP.json';
import nb from './i18n/nb-NO.json';
import nl from './i18n/nl-NL.json';
import pl from './i18n/pl-PL.json';
import pt from './i18n/pt-PT.json';
import ptBR from './i18n/pt-BR.json';
import ar from './i18n/ar-SA.json';
import arDZ from './i18n/ar-DZ.json';
import is from './i18n/is-IS.json';
import ru from './i18n/ru-RU.json';
import sl from './i18n/sl-SL.json';
import tr from './i18n/tr-TR.json';
import ua from './i18n/uk-UA.json';
import zhCN from './i18n/zh-CN.json';
import zhTW from './i18n/zh-TW.json';

// Define available languages
const resources = {
  "ca-ES": {
    translation: ca,
  },
  "cs-CZ": {
    translation: cs,
  },
  "da-DK": {
    translation: da,
  },
  "de-DE": {
    translation: de,
  },
  "el-GR": {
    translation: gr,
  },
  "en-US": {
    translation: en,
  },
  "es-ES": {
    translation: es,
  },
  "fi-FI": {
    translation: fi,
  },
  "fr-FR": {
    translation: fr,
  },
  "hu-HU": {
    translation: hu,
  },
  "it-IT": {
    translation: it,
  },
  "ja-JP": {
    translation: ja,
  },
  "nb-NO": {
    translation: nb,
  },
  "nl-NL": {
    translation: nl,
  },
  "pl-PL": {
    translation: pl,
  },
  "pt-PT": {
    translation: pt,
  },
  "pt-BR": {
    translation: ptBR,
  },
  "ar-SA": {
    translation: ar,
  },
  "ar-DZ": {
    translation: arDZ,
  },
  "is-IS": {
    translation: is,
  },
  "ru-RU": {
    translation: ru,
  },
  "sl-SI": {
    translation: sl,
  },
  "tr-TR": {
    translation: tr,
  },
  "uk-UA": {
    translation: ua,
  },
  "zh-CN": {
    translation: zhCN,
  },
  "zh-TW": {
    translation: zhTW,
  },
};

// Init i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    // Avoids an English flash before App applies the stored language
    lng: localStorage.getItem("lang") || "en-US",
    // de-AT -> de-DE -> en-US
    fallbackLng: (code) => {
      const base = (code || '').split('-')[0];
      const regional = Object.keys(resources).find(k => k.startsWith(base + '-'));
      return regional && regional !== code ? [regional, 'en-US'] : ['en-US'];
    },
    load: 'currentOnly',
    debug: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });


export default i18n;
