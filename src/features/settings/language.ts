// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { getLangs } from "../../utils";

// Sign-in page choice, overrides the mailbox language for this session only
const EXPLICIT_KEY = "lang.explicit";

export function setExplicitLanguage(locale: string) {
  try { window.sessionStorage.setItem(EXPLICIT_KEY, locale); } catch { /* storage disabled */ }
}

export function getExplicitLanguage(): string | null {
  try { return window.sessionStorage.getItem(EXPLICIT_KEY); } catch { return null; }
}

export function clearExplicitLanguage() {
  try { window.sessionStorage.removeItem(EXPLICIT_KEY); } catch { /* storage disabled */ }
}

export function matchUiLanguage(locale?: string | null, langs = getLangs().map(l => l.key)): string | null {
  if (!locale) return null;
  const lower = locale.toLowerCase();
  const exact = langs.find(l => l.toLowerCase() === lower);
  if (exact) return exact;
  const prefix = lower.split("-")[0];
  return langs.find(l => l.toLowerCase().split("-")[0] === prefix) || null;
}

export function resolveLanguage(explicit: string | null, mailboxLocale: string | null | undefined, cached: string | null): string | null {
  return explicit || matchUiLanguage(mailboxLocale) || cached;
}
