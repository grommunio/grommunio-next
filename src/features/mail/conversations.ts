// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Message } from "microsoft-graph";
import type { WellKnownFolderName } from "../../types/messages";
import type { ConversationOrder, MailSort } from "./types";
import { senderName } from "./utils";

export type ConversationGroup = {
  // message id for messages without a conversation
  id: string;
  // newest first
  messages: Message[];
  ids: string[];
  latest: Message;
  unread: number;
  hasAttachments: boolean;
  flagged: boolean;
  highImportance: boolean;
  pinned: boolean;
  // most recent first
  senders: string[];
};

export type ListRow =
  | { kind: "message"; id: string; message: Message; group?: ConversationGroup; nested?: boolean }
  | { kind: "conversation"; id: string; group: ConversationGroup };

// Always flat, as in Outlook
const FLAT_FOLDERS: WellKnownFolderName[] = ["sentitems", "drafts", "outbox"];

export const conversationViewApplies = (enabled: boolean, folder: WellKnownFolderName | undefined, isSearch: boolean) =>
  enabled && !isSearch && !(folder && FLAT_FOLDERS.includes(folder));

export const messageTime = (m?: Message) =>
  new Date(m?.receivedDateTime || m?.sentDateTime || m?.lastModifiedDateTime || 0).getTime();

export const conversationKey = (m: Message) => m.conversationId || m.id!;

export const conversationRowId = (groupId: string) => `conv:${groupId}`;

const byTimeDesc = (a: Message, b: Message) => messageTime(b) - messageTime(a);

// Groups sit where their first message is, by newest message with a date sort.
// Pinned groups stay on top.
export function groupConversations(messages: Message[], options: { sort?: MailSort; pinned?: string[] } = {}): ConversationGroup[] {
  const pinnedSet = new Set(options.pinned || []);
  const map = new Map<string, Message[]>();
  messages.forEach(m => {
    if (!m.id) return;
    const key = conversationKey(m);
    const bucket = map.get(key);
    if (bucket) bucket.push(m);
    else map.set(key, [m]);
  });
  const groups = Array.from(map, ([id, items]): ConversationGroup => {
    const sorted = [...items].sort(byTimeDesc);
    const senders: string[] = [];
    sorted.forEach(m => {
      const name = senderName(m);
      if (!senders.includes(name)) senders.push(name);
    });
    return {
      id,
      messages: sorted,
      ids: sorted.map(m => m.id!),
      latest: sorted[0],
      unread: sorted.filter(m => !m.isRead).length,
      hasAttachments: sorted.some(m => Boolean(m.hasAttachments)),
      flagged: sorted.some(m => m.flag?.flagStatus === "flagged"),
      highImportance: sorted.some(m => m.importance === "high"),
      pinned: sorted.some(m => pinnedSet.has(m.id!)),
      senders,
    };
  });
  if (options.sort && options.sort.field !== "receivedDateTime") return groups;
  const desc = options.sort?.direction !== "asc";
  const pinned = groups.filter(g => g.pinned);
  const rest = groups.filter(g => !g.pinned);
  // Array.prototype.sort is stable
  rest.sort((a, b) => desc ? messageTime(b.latest) - messageTime(a.latest) : messageTime(a.latest) - messageTime(b.latest));
  return [...pinned, ...rest];
}

export const flatRows = (messages: Message[]): ListRow[] =>
  messages.map(message => ({ kind: "message", id: message.id!, message }));

export function buildRows(groups: ConversationGroup[], expanded: ReadonlySet<string>): ListRow[] {
  const rows: ListRow[] = [];
  groups.forEach(group => {
    if (group.messages.length === 1) {
      rows.push({ kind: "message", id: group.latest.id!, message: group.latest, group });
      return;
    }
    rows.push({ kind: "conversation", id: conversationRowId(group.id), group });
    if (expanded.has(group.id)) {
      group.messages.forEach(message => rows.push({ kind: "message", id: message.id!, message, group, nested: true }));
    }
  });
  return rows;
}

export const rowIds = (row: ListRow) => row.kind === "conversation" ? row.group.ids : [row.id];

export const rowMessage = (row: ListRow) => row.kind === "conversation" ? row.group.latest : row.message;

// The conversation row unless a child row was chosen
export function selectedRowId(rows: ListRow[], messageId: string | undefined, preferChild: boolean): string | undefined {
  if (!messageId) return undefined;
  const conversation = rows.find(r => r.kind === "conversation" && r.group.ids.includes(messageId));
  if (!conversation) return messageId;
  if (preferChild && rows.some(r => r.kind === "message" && r.nested && r.id === messageId)) return messageId;
  return conversation.id;
}

export function conversationMessages(messages: Record<string, Message>, conversationId: string, excludedFolders: ReadonlySet<string>): Message[] {
  return Object.values(messages).filter(m =>
    m.conversationId === conversationId && !(m.parentFolderId && excludedFolders.has(m.parentFolderId)));
}

export function sortConversationMessages(messages: Message[], order: ConversationOrder): Message[] {
  return [...messages].sort((a, b) => {
    const diff = messageTime(a) - messageTime(b);
    if (diff !== 0) return order === "oldestFirst" ? diff : -diff;
    return (a.id || "").localeCompare(b.id || "");
  });
}

// Expand the newest, unread and opened ones among unseen messages
export function newlyExpanded(messages: Message[], seen: ReadonlySet<string>, openedId?: string): string[] {
  const newest = messages.reduce<Message | undefined>((best, m) => !best || messageTime(m) > messageTime(best) ? m : best, undefined);
  return messages
    .filter(m => m.id && !seen.has(m.id) && (!m.isRead || m.id === newest?.id || m.id === openedId))
    .map(m => m.id!);
}
