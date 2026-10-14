// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

const USER_PREFIXES = ["mail.", "calendar.", "tasks.", "notes."];
const USER_KEYS = ["pinnedMsgs"];

export const isUserStorageKey = (key: string) => USER_KEYS.includes(key) || USER_PREFIXES.some(p => key.startsWith(p));

// Device prefs like colorMode and lang stay
export function clearUserStorage(storage: Storage = window.localStorage) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && isUserStorageKey(key)) keys.push(key);
    }
    keys.forEach(key => storage.removeItem(key));
  } catch {
    // Storage may be disabled
  }
}
