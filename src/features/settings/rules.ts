// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Importance, MessageRule, MessageRuleActions, MessageRulePredicates, Recipient } from "microsoft-graph";

export type RuleDraft = {
  displayName: string;
  isEnabled: boolean;
  fromAddresses: Recipient[];
  senderContains: string;
  subjectContains: string;
  bodyContains: string;
  importance: Importance | "";
  hasAttachments: boolean;
  sentToMe: boolean;
  moveToFolder: string;
  copyToFolder: string;
  markAsRead: boolean;
  deleteMessage: boolean;
  forwardTo: Recipient[];
  assignCategories: string[];
  markImportance: Importance | "";
  stopProcessingRules: boolean;
};

export const MANAGED_CONDITIONS = ["fromAddresses", "senderContains", "subjectContains", "bodyContains", "importance", "hasAttachments", "sentToMe"] as const;
export const MANAGED_ACTIONS = ["moveToFolder", "copyToFolder", "markAsRead", "delete", "forwardTo", "assignCategories", "markImportance", "stopProcessingRules"] as const;

export const splitList = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);

const isSet = (v: unknown) => v !== undefined && v !== null && v !== false && v !== "" && !(Array.isArray(v) && v.length === 0);

function unmanagedKeys(obj: object | null | undefined, managed: readonly string[]): string[] {
  return Object.entries(obj || {}).filter(([k, v]) => !k.startsWith("@") && !managed.includes(k) && isSet(v)).map(([k]) => k);
}

function unmanaged<T extends object>(obj: T | null | undefined, managed: readonly string[]): Partial<T> {
  const keys = unmanagedKeys(obj, managed);
  return Object.fromEntries(keys.map(k => [k, (obj as Record<string, unknown>)[k]])) as Partial<T>;
}

const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

export type UnsupportedParts = { conditions: string[]; actions: string[]; exceptions: boolean };

// Kept unchanged on save
export function unsupportedParts(rule?: MessageRule): UnsupportedParts {
  return {
    conditions: unmanagedKeys(rule?.conditions, MANAGED_CONDITIONS).map(humanize),
    actions: unmanagedKeys(rule?.actions, MANAGED_ACTIONS).map(humanize),
    exceptions: unmanagedKeys(rule?.exceptions, []).length > 0,
  };
}

export const hasUnsupported = (p: UnsupportedParts) => p.conditions.length > 0 || p.actions.length > 0 || p.exceptions;

export function toDraft(rule?: MessageRule): RuleDraft {
  const c = rule?.conditions || {};
  const a = rule?.actions || {};
  return {
    displayName: rule?.displayName || "",
    isEnabled: rule?.isEnabled !== false,
    fromAddresses: c.fromAddresses || [],
    senderContains: (c.senderContains || []).join(", "),
    subjectContains: (c.subjectContains || []).join(", "),
    bodyContains: (c.bodyContains || []).join(", "),
    importance: c.importance || "",
    hasAttachments: Boolean(c.hasAttachments),
    sentToMe: Boolean(c.sentToMe),
    moveToFolder: a.moveToFolder || "",
    copyToFolder: a.copyToFolder || "",
    markAsRead: Boolean(a.markAsRead),
    deleteMessage: Boolean(a.delete),
    forwardTo: a.forwardTo || [],
    assignCategories: a.assignCategories || [],
    markImportance: a.markImportance || "",
    stopProcessingRules: a.stopProcessingRules !== false,
  };
}

const recipients = (list: Recipient[]) => list.map(r => ({ emailAddress: { address: r.emailAddress?.address, name: r.emailAddress?.name || r.emailAddress?.address } }));

// Graph replaces conditions and actions as a whole, so carry over
// what the editor doesn't manage. exceptions isn't sent and stays.
export function toRule(draft: RuleDraft, sequence: number, original?: MessageRule): MessageRule {
  const conditions: MessageRulePredicates = unmanaged(original?.conditions, MANAGED_CONDITIONS);
  if (draft.fromAddresses.length) conditions.fromAddresses = recipients(draft.fromAddresses);
  if (splitList(draft.senderContains).length) conditions.senderContains = splitList(draft.senderContains);
  if (splitList(draft.subjectContains).length) conditions.subjectContains = splitList(draft.subjectContains);
  if (splitList(draft.bodyContains).length) conditions.bodyContains = splitList(draft.bodyContains);
  if (draft.importance) conditions.importance = draft.importance as Importance;
  if (draft.hasAttachments) conditions.hasAttachments = true;
  if (draft.sentToMe) conditions.sentToMe = true;
  const actions: MessageRuleActions = { ...unmanaged(original?.actions, MANAGED_ACTIONS), stopProcessingRules: draft.stopProcessingRules };
  if (draft.moveToFolder) actions.moveToFolder = draft.moveToFolder;
  if (draft.copyToFolder) actions.copyToFolder = draft.copyToFolder;
  if (draft.markAsRead) actions.markAsRead = true;
  if (draft.deleteMessage) actions.delete = true;
  if (draft.forwardTo.length) actions.forwardTo = recipients(draft.forwardTo);
  if (draft.assignCategories.length) actions.assignCategories = draft.assignCategories;
  if (draft.markImportance) actions.markImportance = draft.markImportance as Importance;
  return { displayName: draft.displayName.trim(), sequence, isEnabled: draft.isEnabled, conditions, actions };
}

export function draftHasCondition(draft: RuleDraft, original?: MessageRule): boolean {
  return Boolean(draft.fromAddresses.length || splitList(draft.senderContains).length || splitList(draft.subjectContains).length || splitList(draft.bodyContains).length
    || draft.importance || draft.hasAttachments || draft.sentToMe || unmanagedKeys(original?.conditions, MANAGED_CONDITIONS).length);
}

export function draftHasAction(draft: RuleDraft, original?: MessageRule): boolean {
  return Boolean(draft.moveToFolder || draft.copyToFolder || draft.markAsRead || draft.deleteMessage || draft.forwardTo.length
    || draft.assignCategories.length || draft.markImportance || unmanagedKeys(original?.actions, MANAGED_ACTIONS).length);
}

type T = (k: string, o?: any) => string;

export function describeRule(rule: MessageRule, folderName: (id: string) => string, t: T): string {
  const c = rule.conditions || {};
  const a = rule.actions || {};
  const extra = unsupportedParts(rule);
  const conds: string[] = [];
  if (c.fromAddresses?.length) conds.push(t("from {{list}}", { list: c.fromAddresses.map(r => r.emailAddress?.name || r.emailAddress?.address).join(", ") }));
  if (c.senderContains?.length) conds.push(t("sender contains {{list}}", { list: c.senderContains.join(", ") }));
  if (c.subjectContains?.length) conds.push(t("subject contains {{list}}", { list: c.subjectContains.join(", ") }));
  if (c.bodyContains?.length) conds.push(t("body contains {{list}}", { list: c.bodyContains.join(", ") }));
  if (c.importance) conds.push(t("importance is {{value}}", { value: c.importance }));
  if (c.hasAttachments) conds.push(t("has attachments"));
  if (c.sentToMe) conds.push(t("sent to me"));
  conds.push(...extra.conditions);
  const acts: string[] = [];
  if (a.moveToFolder) acts.push(t("move to {{folder}}", { folder: folderName(a.moveToFolder) }));
  if (a.copyToFolder) acts.push(t("copy to {{folder}}", { folder: folderName(a.copyToFolder) }));
  if (a.forwardTo?.length) acts.push(t("forward to {{list}}", { list: a.forwardTo.map(r => r.emailAddress?.address).join(", ") }));
  if (a.assignCategories?.length) acts.push(t("categorize as {{list}}", { list: a.assignCategories.join(", ") }));
  if (a.markAsRead) acts.push(t("mark as read"));
  if (a.markImportance) acts.push(t("mark importance {{value}}", { value: a.markImportance }));
  if (a.delete) acts.push(t("delete"));
  acts.push(...extra.actions);
  const exceptions = extra.exceptions ? ` (${t("with exceptions")})` : "";
  return `${conds.join(" · ") || t("all messages")} → ${acts.join(", ")}${exceptions}`;
}
