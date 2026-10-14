import { describe, expect, it } from "vitest";
import type { MessageRule } from "microsoft-graph";
import { describeRule, draftHasAction, hasUnsupported, toDraft, toRule, unsupportedParts } from "../rules";

const t = (k: string, o?: Record<string, string>) => k.replace(/\{\{(\w+)\}\}/g, (_, n) => o?.[n] ?? "");

const outlookRule: MessageRule = {
  id: "r1",
  displayName: "Spam",
  sequence: 3,
  isEnabled: true,
  conditions: { headerContains: ["X-Spam"], fromAddresses: [{ emailAddress: { address: "a@x.com", name: "A" } }], sensitivity: undefined },
  actions: { redirectTo: [{ emailAddress: { address: "b@x.com" } }], delete: true, stopProcessingRules: true },
  exceptions: { subjectContains: ["keep"] },
};

describe("rule editor payload", () => {
  it("keeps conditions and actions the editor doesn't manage", () => {
    const draft = { ...toDraft(outlookRule), subjectContains: "offer" };
    const rule = toRule(draft, 3, outlookRule);
    expect(rule.conditions).toEqual({
      headerContains: ["X-Spam"],
      fromAddresses: [{ emailAddress: { address: "a@x.com", name: "A" } }],
      subjectContains: ["offer"],
    });
    expect(rule.actions).toEqual({ redirectTo: [{ emailAddress: { address: "b@x.com" } }], delete: true, stopProcessingRules: true });
    expect(rule).not.toHaveProperty("exceptions");
  });

  it("lets the editor remove managed fields", () => {
    const draft = { ...toDraft(outlookRule), fromAddresses: [], deleteMessage: false };
    const rule = toRule(draft, 3, outlookRule);
    expect(rule.conditions).toEqual({ headerContains: ["X-Spam"] });
    expect(rule.actions).toEqual({ redirectTo: [{ emailAddress: { address: "b@x.com" } }], stopProcessingRules: true });
  });

  it("allows saving a rule whose only action is unsupported", () => {
    const draft = { ...toDraft(outlookRule), deleteMessage: false };
    expect(draftHasAction(draft, outlookRule)).toBe(true);
    expect(draftHasAction(draft)).toBe(false);
  });

  it("lists unsupported parts", () => {
    const parts = unsupportedParts(outlookRule);
    expect(parts).toEqual({ conditions: ["header contains"], actions: ["redirect to"], exceptions: true });
    expect(hasUnsupported(parts)).toBe(true);
    expect(hasUnsupported(unsupportedParts({ conditions: { sentToMe: true }, actions: { markAsRead: true } }))).toBe(false);
  });

  it("describes unsupported parts", () => {
    expect(describeRule(outlookRule, () => "", t)).toBe("from A · header contains → delete, redirect to (with exceptions)");
  });
});
