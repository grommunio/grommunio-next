// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Attachment, Importance, Message, OutlookCategory, Recipient } from "microsoft-graph";
import type { ExtendedMailFolder } from "../../types/messages";

export type MailFilter = "all" | "unread" | "flagged" | "attachments" | "tome" | "focused" | "other";

export type MailSortField = "receivedDateTime" | "from" | "subject" | "importance" | "hasAttachments";

export type MailSort = {
  field: MailSortField;
  direction: "asc" | "desc";
};

export type MessageList = {
  key: string;
  folderId?: string;
  search?: string;
  filter: MailFilter;
  sort: MailSort;
  ids: string[];
  nextLink?: string;
  total?: number;
  // Results of older loads are dropped
  requestId?: string;
  loading: boolean;
  loadingMore: boolean;
  loaded: boolean;
  error?: string;
};

export type ReadingPanePosition = "right" | "bottom" | "off";

export type MailPrefs = {
  readingPane: ReadingPanePosition;
  density: "comfortable" | "compact";
  markAsRead: "onSelect" | "afterDelay" | "never";
  markAsReadDelay: number;
  focusedInbox: boolean;
  showPreview: boolean;
  showAvatars: boolean;
  signature: string;
  signatureOnNew: boolean;
  signatureOnReply: boolean;
  confirmDelete: boolean;
  desktopNotifications: boolean;
  blockRemoteImages: boolean;
  listWidth: number;
  folderPaneWidth: number;
  folderPaneVisible: boolean;
};

export type ComposeMode = "new" | "reply" | "replyAll" | "forward" | "draft";

export type ComposeDraft = {
  toRecipients: Recipient[];
  ccRecipients: Recipient[];
  bccRecipients: Recipient[];
  subject: string;
  body: string;
  importance: Importance;
  isReadReceiptRequested: boolean;
  isDeliveryReceiptRequested: boolean;
  attachments: Attachment[];
};

export type ComposeState = {
  key: number;
  mode: ComposeMode;
  draftId?: string;
  originalId?: string;
  status: "creating" | "ready" | "saving" | "sending" | "error";
  initial: ComposeDraft;
  lastSaved?: number;
  requestId?: string;
  error?: string;
  minimized: boolean;
};

export type DeleteRequest = {
  ids: string[];
  permanent: boolean;
  hard: boolean;
};

export type FolderSyncState = {
  deltaLink?: string;
  since?: number;
  syncing?: boolean;
};

export type MailState = {
  folders: ExtendedMailFolder[];
  foldersLoading: boolean;
  foldersLoaded: boolean;
  foldersError?: string;
  expandedFolders: string[];
  favoriteFolders: string[];
  messages: Record<string, Message>;
  loadedDetails: Record<string, boolean>;
  loadingDetails: Record<string, boolean>;
  detailsError: Record<string, string>;
  lists: Record<string, MessageList>;
  categories: OutlookCategory[];
  categoriesLoaded: boolean;
  pinned: string[];
  selection: string[];
  compose: ComposeState | null;
  prefs: MailPrefs;
  lastSync: number;
  // Arrived through sync since the list was opened
  newArrivals: string[];
  // Kept across list reloads
  sync: Record<string, FolderSyncState>;
  deleteConfirm: DeleteRequest | null;
};
