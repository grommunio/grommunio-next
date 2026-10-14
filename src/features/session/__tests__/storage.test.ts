import { describe, expect, it } from "vitest";
import { clearUserStorage, isUserStorageKey } from "../storage";

describe("clearUserStorage", () => {
  it("removes per-mailbox keys and keeps device preferences", () => {
    const keep = { colorMode: "dark", colorTheme: "blue", lang: "de-DE", calendarView: "week" };
    const remove = {
      "mail.prefs": "{}", "mail.favoriteFolders": "[]", "mail.expandedFolders": "[]", pinnedMsgs: "[]",
      "calendar.shared": "[]", "calendar.visible": "[]", "calendar.prefs": "{}",
      "tasks.sort": "default", "tasks.showCompleted": "true", "notes.colors": "{}",
    };
    Object.entries({ ...keep, ...remove }).forEach(([k, v]) => window.localStorage.setItem(k, v));
    clearUserStorage();
    Object.keys(remove).forEach(k => expect(window.localStorage.getItem(k)).toBeNull());
    Object.entries(keep).forEach(([k, v]) => expect(window.localStorage.getItem(k)).toBe(v));
  });

  it("matches only the listed prefixes", () => {
    expect(isUserStorageKey("mailbox")).toBe(false);
    expect(isUserStorageKey("colorMode")).toBe(false);
    expect(isUserStorageKey("notes.colors")).toBe(true);
  });
});
