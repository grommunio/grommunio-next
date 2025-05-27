// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createSelector } from "@reduxjs/toolkit";
import type { Message } from "microsoft-graph";
import type { RootState } from "../../store";
import type { ExtendedMailFolder, WellKnownFolderName } from "../../types/messages";
import { findFolder, findWellKnownFolder } from "./mailSlice";

export const selectMail = (state: RootState) => state.mail;
export const selectFolders = (state: RootState) => state.mail.folders;
export const selectPrefs = (state: RootState) => state.mail.prefs;
export const selectCompose = (state: RootState) => state.mail.compose;
export const selectSelection = (state: RootState) => state.mail.selection;
export const selectCategories = (state: RootState) => state.mail.categories;
export const selectPinned = (state: RootState) => state.mail.pinned;

export const selectFolderById = (id: string | undefined) => (state: RootState): ExtendedMailFolder | undefined =>
  findFolder(state.mail.folders, id);

export const selectWellKnownFolder = (name: WellKnownFolderName) => (state: RootState) =>
  findWellKnownFolder(state.mail.folders, name);

export const selectInboxUnread = (state: RootState) =>
  findWellKnownFolder(state.mail.folders, "inbox")?.unreadItemCount || 0;

export const selectList = (key: string) => (state: RootState) => state.mail.lists[key];

export const selectMessage = (id: string | undefined) => (state: RootState): Message | undefined =>
  id ? state.mail.messages[id] : undefined;

// Pinned first
export const makeSelectListMessages = (key: string) => createSelector(
  [(state: RootState) => state.mail.lists[key], (state: RootState) => state.mail.messages, selectPinned],
  (list, messages, pinned): Message[] => {
    if (!list) return [];
    const items = list.ids.map(id => messages[id]).filter(Boolean);
    if (pinned.length === 0) return items;
    const pinnedSet = new Set(pinned);
    const top = items.filter(m => pinnedSet.has(m.id!));
    if (top.length === 0) return items;
    return [...top, ...items.filter(m => !pinnedSet.has(m.id!))];
  },
);

export const selectFlatFolders = createSelector([selectFolders], folders => {
  const result: Array<ExtendedMailFolder & { depth: number }> = [];
  const walk = (list: ExtendedMailFolder[], depth: number) => list.forEach(f => {
    result.push({ ...f, depth });
    if (f.childFolders?.length) walk(f.childFolders, depth + 1);
  });
  walk(folders, 0);
  return result;
});
