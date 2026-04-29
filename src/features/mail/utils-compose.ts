// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import DOMPurify from "dompurify";
export { isValidEmail } from "./utils";

export function purify(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ["target"] });
}

// Packs in public/tinymce/langs
const TINYMCE_LANGUAGES = new Set([
  "ar-DZ", "ar-SA", "ca-ES", "cs-CZ", "da-DK", "de-DE", "el-GR", "es-ES", "fi-FI", "fr-FR", "hu-HU", "it-IT", "ja-JP",
  "nb-NO", "nl-NL", "pl-PL", "pt-BR", "pt-PT", "ru-RU", "sl-SL", "tr-TR", "uk-UA", "zh-CN", "zh-TW",
]);

export function tinymceLanguage(locale: string): string | undefined {
  return TINYMCE_LANGUAGES.has(locale) ? locale : undefined;
}

// blob:/data: URLs of uploaded inline images back to cid:
export function replaceInlineImageSources(html: string, sources: Map<string, string>): string {
  if (sources.size === 0) return html;
  return html.replace(/(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'])/gi, (match, pre, src, post) => {
    const cid = sources.get(src);
    return cid ? `${pre}${cid}${post}` : match;
  });
}
