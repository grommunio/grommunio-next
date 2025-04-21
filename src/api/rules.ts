// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { MessageRule } from "microsoft-graph";
import { del, getAll, patch, post } from "./graph";

export async function getMessageRules(): Promise<MessageRule[]> {
  return getAll<MessageRule>("/me/mailFolders/inbox/messageRules");
}

export async function createMessageRule(rule: MessageRule): Promise<MessageRule> {
  return post<MessageRule>("/me/mailFolders/inbox/messageRules", rule);
}

export async function updateMessageRule(id: string, rule: Partial<MessageRule>): Promise<MessageRule> {
  return patch<MessageRule>(`/me/mailFolders/inbox/messageRules/${id}`, rule);
}

export async function deleteMessageRule(id: string): Promise<void> {
  return del(`/me/mailFolders/inbox/messageRules/${id}`);
}
