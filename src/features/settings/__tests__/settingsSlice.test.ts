import { describe, expect, it } from "vitest";
import reducer, { createRule, deleteRule, loadMailboxSettings, loadRules, loadTimeZones, setLanguage, updateRule } from "../settingsSlice";

describe("settings reducer", () => {
  const initial = reducer(undefined, { type: "init" });

  it("stores the language locally", () => {
    const state = reducer(initial, setLanguage("de-DE"));
    expect(state.language).toBe("de-DE");
    expect(window.localStorage.getItem("lang")).toBe("de-DE");
  });

  it("merges mailbox settings", () => {
    const state = reducer(initial, loadMailboxSettings.fulfilled({ timeZone: "Europe/Berlin", language: { locale: "de-DE" } }, "req"));
    expect(state.mailboxSettings.timeZone).toBe("Europe/Berlin");
    expect(state.mailboxSettingsLoaded).toBe(true);
  });

  it("does not mark failed mailbox settings as loaded, so they are loaded again", () => {
    let state = reducer(initial, loadMailboxSettings.pending("req"));
    expect(state.mailboxSettingsLoading).toBe(true);
    state = reducer(state, loadMailboxSettings.rejected(null, "req", undefined, "Network error"));
    expect(state.mailboxSettingsLoaded).toBe(false);
    expect(state.mailboxSettingsLoading).toBe(false);
    expect(state.mailboxSettingsError).toBe("Network error");
    state = reducer(state, loadMailboxSettings.fulfilled({ timeZone: "UTC" }, "req"));
    expect(state.mailboxSettingsLoaded).toBe(true);
    expect(state.mailboxSettingsError).toBeNull();
  });

  it("remembers the time zone naming standard", () => {
    let state = reducer(initial, loadTimeZones.pending("req", "Windows"));
    expect(state.timeZoneStandard).toBe("Windows");
    state = reducer(state, loadTimeZones.rejected(null, "req", "Windows"));
    expect(state.timeZoneStandard).toBeNull();
  });

  it("keeps rules in sequence order", () => {
    let state = reducer(initial, loadRules.fulfilled([{ id: "b", sequence: 2 }, { id: "a", sequence: 1 }], "req"));
    expect(state.rules.map(r => r.id)).toEqual(["a", "b"]);
    state = reducer(state, createRule.fulfilled({ id: "c", sequence: 3 }, "req", {}));
    state = reducer(state, updateRule.fulfilled({ id: "a", isEnabled: false }, "req", { id: "a", rule: {} }));
    expect(state.rules.find(r => r.id === "a")?.isEnabled).toBe(false);
    state = reducer(state, deleteRule.fulfilled("b", "req", "b"));
    expect(state.rules.map(r => r.id)).toEqual(["a", "c"]);
  });
});
