import { describe, expect, it } from "vitest";
import reducer, { createRule, deleteRule, loadMailboxSettings, loadRules, setLanguage, updateRule } from "../settingsSlice";

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
