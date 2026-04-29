// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { MailPrefs } from "./types";

const PREFS_KEY = "mail.prefs";
const PINNED_KEY = "pinnedMsgs";
const EXPANDED_KEY = "mail.expandedFolders";
const FAVORITES_KEY = "mail.favoriteFolders";

export const DEFAULT_MAIL_PREFS: MailPrefs = {
  readingPane: "right",
  density: "comfortable",
  markAsRead: "afterDelay",
  markAsReadDelay: 2,
  focusedInbox: false,
  showPreview: true,
  showAvatars: true,
  signature: "",
  signatureOnNew: true,
  signatureOnReply: false,
  confirmDelete: false,
  desktopNotifications: false,
  blockRemoteImages: false,
  listWidth: 380,
  folderPaneWidth: 248,
  folderPaneVisible: true,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function readArray(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export const loadPrefs = (): MailPrefs => readJson(PREFS_KEY, DEFAULT_MAIL_PREFS);
export const savePrefs = (prefs: MailPrefs) => window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
export const loadPinned = () => readArray(PINNED_KEY);
export const savePinned = (ids: string[]) => window.localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
export const loadExpanded = () => readArray(EXPANDED_KEY);
export const saveExpanded = (ids: string[]) => window.localStorage.setItem(EXPANDED_KEY, JSON.stringify(ids));
export const loadFavorites = () => readArray(FAVORITES_KEY);
export const saveFavorites = (ids: string[]) => window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
