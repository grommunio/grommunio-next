// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSlice, PayloadAction, ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import type { Attachment, Message, OutlookCategory, Recipient } from "microsoft-graph";
import type { RootState } from "../../store";
import type { ExtendedMailFolder, WellKnownFolderName } from "../../types/messages";
import * as foldersApi from "../../api/folders";
import * as messagesApi from "../../api/messages";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../features/alerts/alertsSlice";
import { COMMON_FOLDER_ORDER, SCROLL_ITEMS } from "../../constants";
import {
  ComposeDraft, ComposeMode, ComposeState, DeleteRequest, MailFilter, MailPrefs, MailSort, MailState, MessageList,
} from "./types";
import {
  loadExpanded, loadFavorites, loadPinned, loadPrefs, saveExpanded, saveFavorites, savePinned, savePrefs,
} from "./prefs";

export const DEFAULT_SORT: MailSort = { field: "receivedDateTime", direction: "desc" };

export const listKey = (folderId: string | undefined, search?: string) =>
  search ? `search:${folderId || "all"}:${search}` : `folder:${folderId}`;

function emptyList(key: string, folderId: string | undefined, search: string | undefined, filter: MailFilter, sort: MailSort): MessageList {
  return { key, folderId, search, filter, sort, ids: [], loading: false, loadingMore: false, loaded: false };
}

function sortFolders(folders: ExtendedMailFolder[]): ExtendedMailFolder[] {
  const copy = folders.map(f => ({ ...f, childFolders: f.childFolders ? sortFolders(f.childFolders) : f.childFolders }));
  copy.sort((a, b) => {
    const orderA = COMMON_FOLDER_ORDER[a.wellKnownName] ?? 7;
    const orderB = COMMON_FOLDER_ORDER[b.wellKnownName] ?? 7;
    if (orderA !== orderB) return orderA - orderB;
    return (a.displayName || "").localeCompare(b.displayName || "", undefined, { sensitivity: "base" });
  });
  return copy;
}

export function findFolder(folders: ExtendedMailFolder[], id: string | undefined): ExtendedMailFolder | undefined {
  if (!id) return undefined;
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const child = findFolder(folder.childFolders || [], id);
    if (child) return child;
  }
  return undefined;
}

export function findWellKnownFolder(folders: ExtendedMailFolder[], name: WellKnownFolderName): ExtendedMailFolder | undefined {
  return folders.find(f => f.wellKnownName === name);
}

function mapFolders(folders: ExtendedMailFolder[], fn: (f: ExtendedMailFolder) => ExtendedMailFolder): ExtendedMailFolder[] {
  return folders.map(f => fn({ ...f, childFolders: f.childFolders ? mapFolders(f.childFolders, fn) : f.childFolders }));
}

function removeFolder(folders: ExtendedMailFolder[], id: string): ExtendedMailFolder[] {
  return folders
    .filter(f => f.id !== id)
    .map(f => ({ ...f, childFolders: f.childFolders ? removeFolder(f.childFolders, id) : f.childFolders }));
}

export function filterToOData(filter: MailFilter, ownAddress?: string): string | undefined {
  switch (filter) {
  case "unread": return "isRead eq false";
  case "flagged": return "flag/flagStatus eq 'flagged'";
  case "attachments": return "hasAttachments eq true";
  case "focused": return "inferenceClassification eq 'focused'";
  case "other": return "inferenceClassification eq 'other'";
  case "tome": return ownAddress ? `toRecipients/any(r: r/emailAddress/address eq '${ownAddress.replace(/'/g, "''")}')` : undefined;
  default: return undefined;
  }
}

export function sortToOData(sort: MailSort): string {
  switch (sort.field) {
  case "from": return `from/emailAddress/name ${sort.direction}`;
  case "subject": return `subject ${sort.direction}`;
  case "importance": return `importance ${sort.direction}`;
  case "hasAttachments": return `hasAttachments ${sort.direction}`;
  default: return `receivedDateTime ${sort.direction}`;
  }
}

// Graph wants every $orderby property in $filter too, so filtered lists sort by date
function buildListParams(list: Pick<MessageList, "filter" | "sort" | "search">, ownAddress?: string) {
  const filter = filterToOData(list.filter, ownAddress);
  if (list.search) {
    return { search: list.search, filter: undefined, orderby: undefined };
  }
  if (filter) {
    return { filter: `receivedDateTime ge 1970-01-01T00:00:00Z and ${filter}`, orderby: `receivedDateTime ${list.sort.direction}` };
  }
  return { filter: undefined, orderby: sortToOData(list.sort) };
}

const errorMessage = (err: unknown) => err instanceof ApiError || err instanceof Error ? err.message : String(err);

// Status 0 means no response
const isFailed = (r?: { status: number }) => !r || r.status === 0 || r.status >= 400;

class MailError extends Error {
  constructor(public key: string, public params: Record<string, string | number>) {
    super(key);
  }
}

const alertError = (err: unknown) => pushAlertStack(err instanceof MailError ?
  { message: err.key, params: err.params, severity: "error" } :
  { message: errorMessage(err), severity: "error" });

type ThunkApi = { state: RootState; rejectValue: string };

export const loadFolders = createAsyncThunk<ExtendedMailFolder[], void, ThunkApi>(
  "mail/loadFolders",
  async (_arg, { rejectWithValue }) => {
    try {
      const { value } = await foldersApi.getMailFolders();
      return value;
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const loadChildFolders = createAsyncThunk<{ parentId: string; folders: ExtendedMailFolder[] }, string, ThunkApi>(
  "mail/loadChildFolders",
  async (parentId, { rejectWithValue }) => {
    try {
      return { parentId, folders: await foldersApi.getChildFolders(parentId) };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const createFolder = createAsyncThunk<{ folder: ExtendedMailFolder; parentId?: string }, { displayName: string; parentId?: string }, ThunkApi>(
  "mail/createFolder",
  async ({ displayName, parentId }, { dispatch, rejectWithValue }) => {
    try {
      const folder = await foldersApi.postMailFolder({ displayName }, parentId);
      return { folder, parentId };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const renameFolder = createAsyncThunk<{ id: string; displayName: string }, { id: string; displayName: string }, ThunkApi>(
  "mail/renameFolder",
  async ({ id, displayName }, { dispatch, rejectWithValue }) => {
    try {
      await foldersApi.renameMailFolder(id, displayName);
      return { id, displayName };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteFolder = createAsyncThunk<string, string, ThunkApi>(
  "mail/deleteFolder",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await foldersApi.deleteMailFolder(id);
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const moveFolder = createAsyncThunk<void, { id: string; destinationId: string }, ThunkApi>(
  "mail/moveFolder",
  async ({ id, destinationId }, { dispatch, rejectWithValue }) => {
    try {
      await foldersApi.moveMailFolder(id, destinationId);
      await dispatch(loadFolders());
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const markFolderRead = createAsyncThunk<string, string, ThunkApi>(
  "mail/markFolderRead",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await foldersApi.markFolderAsRead(id);
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const emptyFolder = createAsyncThunk<string, string, ThunkApi>(
  "mail/emptyFolder",
  async (id, { dispatch, getState, rejectWithValue }) => {
    try {
      const folder = findFolder(getState().mail.folders, id);
      await foldersApi.emptyFolder(id, folder?.wellKnownName === "deleteditems" || folder?.wellKnownName === "junkemail");
      dispatch(loadFolders());
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

type LoadMessagesArg = {
  folderId?: string;
  search?: string;
  filter?: MailFilter;
  sort?: MailSort;
  force?: boolean;
};

export const loadMessages = createAsyncThunk<{ key: string; messages: Message[]; nextLink?: string; total?: number }, LoadMessagesArg, ThunkApi>(
  "mail/loadMessages",
  async (arg, { getState, rejectWithValue }) => {
    const key = listKey(arg.folderId, arg.search);
    const state = getState();
    const existing = state.mail.lists[key];
    const filter = arg.filter ?? existing?.filter ?? "all";
    const sort = arg.sort ?? existing?.sort ?? DEFAULT_SORT;
    try {
      const params = buildListParams({ filter, sort, search: arg.search }, state.session.me.mail || undefined);
      const page = arg.search && !arg.folderId ?
        await messagesApi.searchMessages(arg.search) :
        await messagesApi.getMessagesPage(arg.folderId || "inbox", { ...params, top: SCROLL_ITEMS });
      return { key, messages: page.value, nextLink: page.nextLink, total: page.count };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: (arg, { getState }) => {
      const list = getState().mail.lists[listKey(arg.folderId, arg.search)];
      if (!list) return true;
      const sameParams = (arg.filter ?? list.filter) === list.filter && (arg.sort ?? list.sort) === list.sort;
      // A newer request wins, the old result is dropped via requestId
      if (list.loading) return Boolean(arg.force) || !sameParams;
      return arg.force || !list.loaded || !sameParams;
    },
  },
);

export const loadMoreMessages = createAsyncThunk<{ key: string; messages: Message[]; nextLink?: string; requestId?: string }, string, ThunkApi>(
  "mail/loadMoreMessages",
  async (key, { getState, rejectWithValue }) => {
    const list = getState().mail.lists[key];
    if (!list?.nextLink) return { key, messages: [], nextLink: undefined, requestId: list?.requestId };
    try {
      const page = await messagesApi.getMessagesNextPage(list.nextLink);
      return { key, messages: page.value, nextLink: page.nextLink, requestId: list.requestId };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: (key, { getState }) => {
      const list = getState().mail.lists[key];
      return Boolean(list && list.nextLink && !list.loadingMore && !list.loading);
    },
  },
);

// Don't announce unread mail older than the last sync minus this
const ARRIVAL_MARGIN = 5 * 60 * 1000;

export type SyncResult = {
  folderId: string;
  added: Message[];
  changed: Message[];
  removed: string[];
  arrivals: string[];
  deltaLink?: string;
  initial: boolean;
};

// First sync only stores the delta link. It survives list reloads, and folders
// without an open list, like the background inbox, are synced too.
export const syncFolder = createAsyncThunk<SyncResult, string, ThunkApi>(
  "mail/syncFolder",
  async (folderId, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const sync = state.mail.sync[folderId];
    try {
      const result = await messagesApi.getMessagesDelta(folderId, sync?.deltaLink);
      // Expired delta link: start over, nothing to apply
      if (!sync?.deltaLink || result.reset) {
        return { folderId, added: [], changed: [], removed: [], arrivals: [], deltaLink: result.deltaLink, initial: true };
      }
      const known = getState().mail.messages;
      const added = result.value.filter(m => m.id && !known[m.id]);
      const changed = result.value.filter(m => m.id && known[m.id]);
      const threshold = (sync.since || 0) - ARRIVAL_MARGIN;
      const arrivals = added
        .filter(m => !m.isRead && !m.isDraft && new Date(m.receivedDateTime || 0).getTime() >= threshold)
        .map(m => m.id!);
      if (result.value.length || result.removed.length) dispatch(loadFolders());
      return { folderId, added, changed, removed: result.removed, arrivals, deltaLink: result.deltaLink, initial: false };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: (folderId, { getState }) => {
      const { lists, sync } = getState().mail;
      if (sync[folderId]?.syncing) return false;
      // A running list load would overwrite the applied changes
      return !lists[listKey(folderId)]?.loading;
    },
  },
);

export const loadMessageDetails = createAsyncThunk<Message, string, ThunkApi>(
  "mail/loadMessageDetails",
  async (id, { rejectWithValue }) => {
    try {
      return await messagesApi.getMessage(id);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: (id, { getState }) => !getState().mail.loadingDetails[id],
  },
);

export const loadConversation = createAsyncThunk<Message[], string, ThunkApi>(
  "mail/loadConversation",
  async (conversationId, { rejectWithValue }) => {
    try {
      return await messagesApi.getConversationMessages(conversationId);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: (conversationId, { getState }) => !getState().mail.conversations[conversationId]?.loading,
  },
);

function unreadDeltas(messages: Message[], isRead: boolean): Array<{ folderId: string; delta: number }> {
  const deltas = new Map<string, number>();
  messages.forEach(m => {
    if (!m.parentFolderId || Boolean(m.isRead) === isRead) return;
    deltas.set(m.parentFolderId, (deltas.get(m.parentFolderId) || 0) + (isRead ? -1 : 1));
  });
  return Array.from(deltas, ([folderId, delta]) => ({ folderId, delta }));
}

export const updateMessages = createAsyncThunk<void, { ids: string[]; props: Partial<Message> }, ThunkApi>(
  "mail/updateMessages",
  async ({ ids, props }, { dispatch, getState, rejectWithValue }) => {
    const previous = ids.map(id => getState().mail.messages[id]).filter(Boolean);
    const deltas = props.isRead !== undefined && props.isRead !== null ? unreadDeltas(previous, props.isRead) : [];
    dispatch(mailSlice.actions.messagesPatched({ ids, props }));
    deltas.forEach(d => dispatch(mailSlice.actions.adjustUnreadCount(d)));
    try {
      const responses = ids.length === 1 ?
        [{ id: "0", status: 200, body: await messagesApi.patchMessage({ id: ids[0] }, props) }] :
        await messagesApi.patchMessages(ids, props);
      const failedIds = ids.filter((_id, i) => isFailed(responses[i]));
      // Server values win, it fills in flag due dates
      dispatch(mailSlice.actions.messagesReceived(responses.filter(r => !isFailed(r)).map(r => r.body).filter(Boolean) as Message[]));
      if (failedIds.length) {
        const failed = previous.filter(m => failedIds.includes(m.id!));
        dispatch(mailSlice.actions.messagesReceived(failed));
        if (props.isRead !== undefined && props.isRead !== null) {
          unreadDeltas(failed, props.isRead).forEach(d => dispatch(mailSlice.actions.adjustUnreadCount({ ...d, delta: -d.delta })));
        }
        // t("{{failed}} of {{count}} messages could not be updated")
        throw new MailError("{{failed}} of {{count}} messages could not be updated", { failed: failedIds.length, count: ids.length });
      }
    } catch (err) {
      if (!(err instanceof MailError)) {
        dispatch(mailSlice.actions.messagesReceived(previous));
        deltas.forEach(d => dispatch(mailSlice.actions.adjustUnreadCount({ ...d, delta: -d.delta })));
      }
      dispatch(alertError(err));
      return rejectWithValue(errorMessage(err));
    }
  },
);

type ListSnapshot = { key: string; ids: string[]; requestId?: string };

function snapshotLists(state: RootState, ids: string[]): ListSnapshot[] {
  const set = new Set(ids);
  return Object.values(state.mail.lists)
    .filter(list => list.ids.some(id => set.has(id)))
    .map(list => ({ key: list.key, ids: [...list.ids], requestId: list.requestId }));
}

const sourceFolders = (messages: Message[]) => Array.from(new Set(messages.map(m => m.parentFolderId).filter(Boolean) as string[]));

export const moveMessages = createAsyncThunk<{ ids: string[]; destinationId: string }, { ids: string[]; destinationId: string; silent?: boolean }, ThunkApi>(
  "mail/moveMessages",
  async ({ ids, destinationId, silent }, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const folderName = findFolder(state.mail.folders, destinationId)?.displayName || destinationId;
    // Snapshot for undo/rollback before the optimistic removal
    const originals = ids.map(id => state.mail.messages[id]).filter(Boolean);
    const sources = sourceFolders(originals);
    const lists = snapshotLists(state, ids);
    dispatch(mailSlice.actions.messagesRemoved(ids));
    try {
      const responses = await messagesApi.moveMessages(ids, destinationId);
      const failedIds = ids.filter((_id, i) => isFailed(responses[i]));
      if (failedIds.length) {
        dispatch(mailSlice.actions.messagesRestored({ messages: originals.filter(m => failedIds.includes(m.id!)), lists }));
        dispatch(loadFolders());
        // t("{{failed}} of {{count}} messages could not be moved")
        throw new MailError("{{failed}} of {{count}} messages could not be moved", { failed: failedIds.length, count: ids.length });
      }
      if (!silent) {
        // t("{{count}} messages moved to {{folder}}_one")
        // t("{{count}} messages moved to {{folder}}_other")
        dispatch(pushAlertStack({
          message: "{{count}} messages moved to {{folder}}",
          params: { count: ids.length, folder: folderName },
          severity: "success",
          // Undo needs a single source folder
          undo: sources.length === 1 ? { ids: responses.map(r => r.body?.id).filter(Boolean) as string[], destinationId: sources[0] } : undefined,
        }));
      }
      dispatch(loadFolders());
      return { ids, destinationId };
    } catch (err) {
      if (!(err instanceof MailError)) {
        dispatch(mailSlice.actions.messagesRestored({ messages: originals, lists }));
      }
      dispatch(alertError(err));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const copyMessages = createAsyncThunk<void, { ids: string[]; destinationId: string }, ThunkApi>(
  "mail/copyMessages",
  async ({ ids, destinationId }, { dispatch, getState, rejectWithValue }) => {
    try {
      const responses = await messagesApi.copyMessages(ids, destinationId);
      const failed = responses.filter(isFailed);
      // t("{{failed}} of {{count}} messages could not be copied")
      if (failed.length) throw new MailError("{{failed}} of {{count}} messages could not be copied", { failed: failed.length, count: ids.length });
      const folderName = findFolder(getState().mail.folders, destinationId)?.displayName || destinationId;
      // t("Copied to {{folder}}")
      dispatch(pushAlertStack({ message: "Copied to {{folder}}", params: { folder: folderName }, severity: "success" }));
      dispatch(loadFolders());
    } catch (err) {
      dispatch(alertError(err));
      return rejectWithValue(errorMessage(err));
    }
  },
);

// Explicitly requested or already in Deleted Items
function permanentIds(state: RootState, ids: string[], permanent?: boolean): string[] {
  if (permanent) return ids;
  const deletedItems = findWellKnownFolder(state.mail.folders, "deleteditems")?.id;
  return deletedItems ? ids.filter(id => state.mail.messages[id]?.parentFolderId === deletedItems) : [];
}

export const deleteMessages = createAsyncThunk<string[], { ids: string[]; permanent?: boolean }, ThunkApi>(
  "mail/deleteMessages",
  async ({ ids, permanent }, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    // Search results can span folders
    const hardIds = permanentIds(state, ids, permanent);
    const hardSet = new Set(hardIds);
    const softIds = ids.filter(id => !hardSet.has(id));
    const originals = ids.map(id => state.mail.messages[id]).filter(Boolean);
    const softSources = sourceFolders(originals.filter(m => !hardSet.has(m.id!)));
    const lists = snapshotLists(state, ids);
    dispatch(mailSlice.actions.messagesRemoved(ids));
    try {
      const [hardResponses, softResponses] = await Promise.all([
        hardIds.length ? messagesApi.deleteMessages(hardIds, true) : Promise.resolve([]),
        softIds.length ? messagesApi.deleteMessages(softIds, false) : Promise.resolve([]),
      ]);
      const failedIds = [
        ...hardIds.filter((_id, i) => isFailed(hardResponses[i])),
        ...softIds.filter((_id, i) => isFailed(softResponses[i])),
      ];
      if (failedIds.length) {
        dispatch(mailSlice.actions.messagesRestored({ messages: originals.filter(m => failedIds.includes(m.id!)), lists }));
        dispatch(loadFolders());
        // t("{{failed}} of {{count}} messages could not be deleted")
        throw new MailError("{{failed}} of {{count}} messages could not be deleted", { failed: failedIds.length, count: ids.length });
      }
      if (softIds.length) {
        // t("{{count}} messages deleted_one")
        // t("{{count}} messages deleted_other")
        dispatch(pushAlertStack({
          message: "{{count}} messages deleted",
          params: { count: softIds.length },
          severity: "success",
          undo: softSources.length === 1 ? { ids: softResponses.map(r => r.body?.id).filter(Boolean) as string[], destinationId: softSources[0] } : undefined,
        }));
      }
      dispatch(loadFolders());
      return ids;
    } catch (err) {
      if (!(err instanceof MailError)) {
        dispatch(mailSlice.actions.messagesRestored({ messages: originals, lists }));
      }
      dispatch(alertError(err));
      return rejectWithValue(errorMessage(err));
    }
  },
);

// Asks first if the user wants that or the delete is permanent. MailView renders the dialog.
export const requestDelete = (ids: string[], permanent = false): ThunkAction<void, RootState, unknown, UnknownAction> => (dispatch, getState) => {
  if (ids.length === 0) return;
  const state = getState();
  const hard = permanentIds(state, ids, permanent).length > 0;
  if (hard || state.mail.prefs.confirmDelete) {
    dispatch(mailSlice.actions.deleteConfirmRequested({ ids, permanent, hard }));
  } else {
    dispatch(deleteMessages({ ids, permanent }));
  }
};

export const loadCategories = createAsyncThunk<OutlookCategory[], void, ThunkApi>(
  "mail/loadCategories",
  async (_arg, { rejectWithValue }) => {
    try {
      return await messagesApi.mailCategories();
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const createCategory = createAsyncThunk<OutlookCategory, { displayName: string; color: string }, ThunkApi>(
  "mail/createCategory",
  async (category, { dispatch, rejectWithValue }) => {
    try {
      return await messagesApi.postMailCategory(category);
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const updateCategory = createAsyncThunk<OutlookCategory, { id: string; color: string }, ThunkApi>(
  "mail/updateCategory",
  async ({ id, color }, { dispatch, rejectWithValue }) => {
    try {
      return await messagesApi.patchMailCategory(id, color);
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteCategory = createAsyncThunk<string, string, ThunkApi>(
  "mail/deleteCategory",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await messagesApi.deleteMailCategory(id);
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

const emptyDraft = (): ComposeDraft => ({
  toRecipients: [], ccRecipients: [], bccRecipients: [], subject: "", body: "", importance: "normal",
  isReadReceiptRequested: false, isDeliveryReceiptRequested: false, attachments: [],
});

export function draftFromMessage(message: Message, attachments: Attachment[] = []): ComposeDraft {
  return {
    toRecipients: message.toRecipients || [],
    ccRecipients: message.ccRecipients || [],
    bccRecipients: message.bccRecipients || [],
    subject: message.subject || "",
    body: message.body?.content || "",
    importance: message.importance || "normal",
    isReadReceiptRequested: Boolean(message.isReadReceiptRequested),
    isDeliveryReceiptRequested: Boolean(message.isDeliveryReceiptRequested),
    attachments,
  };
}

type StartComposeArg = {
  mode: ComposeMode;
  originalId?: string;
  to?: Recipient[];
  subject?: string;
  body?: string;
};

// The open compose registers a save-or-drop function so opening another one
// never loses typed text. Returns false to abort.
let composeFlusher: (() => Promise<boolean>) | null = null;
export function registerComposeFlusher(fn: (() => Promise<boolean>) | null) {
  composeFlusher = fn;
}

export const createComposeState = createAsyncThunk<ComposeState, StartComposeArg, ThunkApi>(
  "mail/startCompose",
  async (arg, { dispatch, getState, rejectWithValue, requestId }) => {
    const key = Date.now();
    const prefs = getState().mail.prefs;
    try {
      if (arg.mode === "new") {
        const signature = prefs.signatureOnNew && prefs.signature ? `<br><br><div class="signature">${prefs.signature}</div>` : "";
        return {
          key, mode: arg.mode, status: "ready", minimized: false,
          initial: { ...emptyDraft(), toRecipients: arg.to || [], subject: arg.subject || "", body: (arg.body || "") + signature },
        };
      }
      if (arg.mode === "draft") {
        const draft = await messagesApi.getMessage(arg.originalId!);
        const attachments = draft.hasAttachments ? await messagesApi.getAttachments(draft.id!) : [];
        return { key, mode: arg.mode, draftId: draft.id!, status: "ready", minimized: false, initial: draftFromMessage(draft, attachments) };
      }
      const draft = arg.mode === "forward" ?
        await messagesApi.createForward(arg.originalId!) :
        await messagesApi.createReply(arg.originalId!, arg.mode === "replyAll");
      if (getState().mail.compose?.requestId !== requestId) {
        // Closed while the draft was being created, don't leave it behind
        await messagesApi.deleteMessage(draft.id!, true).catch(() => undefined);
        return rejectWithValue("Compose closed");
      }
      const attachments = draft.hasAttachments ? await messagesApi.getAttachments(draft.id!) : [];
      const initial = draftFromMessage(draft, attachments);
      if (prefs.signatureOnReply && prefs.signature) {
        initial.body = `<br><br><div class="signature">${prefs.signature}</div>` + initial.body;
      }
      return { key, mode: arg.mode, draftId: draft.id!, originalId: arg.originalId, status: "ready", minimized: false, initial };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const startCompose = (arg: StartComposeArg): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> => async (dispatch, getState) => {
  if (getState().mail.compose?.status === "creating") return;
  if (getState().mail.compose && composeFlusher) {
    const ok = await composeFlusher();
    if (!ok) return;
  }
  await dispatch(createComposeState(arg));
};

type DraftPatch = Partial<Omit<ComposeDraft, "attachments">>;

function toMessagePatch(patch: DraftPatch): Partial<Message> {
  const result: Partial<Message> = {};
  if (patch.toRecipients !== undefined) result.toRecipients = patch.toRecipients;
  if (patch.ccRecipients !== undefined) result.ccRecipients = patch.ccRecipients;
  if (patch.bccRecipients !== undefined) result.bccRecipients = patch.bccRecipients;
  if (patch.subject !== undefined) result.subject = patch.subject;
  if (patch.body !== undefined) result.body = { contentType: "html", content: patch.body };
  if (patch.importance !== undefined) result.importance = patch.importance;
  if (patch.isReadReceiptRequested !== undefined) result.isReadReceiptRequested = patch.isReadReceiptRequested;
  if (patch.isDeliveryReceiptRequested !== undefined) result.isDeliveryReceiptRequested = patch.isDeliveryReceiptRequested;
  return result;
}

// Serialized so a second save waits for the draft the first one creates
let saveQueue: Promise<unknown> = Promise.resolve();
// Available before the fulfilled action is reduced
const createdDrafts = new Map<number, string>();

export const draftSavesSettled = () => saveQueue.then(() => undefined, () => undefined);

export const saveDraft = createAsyncThunk<{ draftId: string; key: number }, { patch: DraftPatch; silent?: boolean }, ThunkApi>(
  "mail/saveDraft",
  async ({ patch, silent }, { dispatch, getState, rejectWithValue }) => {
    const run = async () => {
      const compose = getState().mail.compose;
      if (!compose) throw new Error("No open draft");
      let draftId = compose.draftId || createdDrafts.get(compose.key);
      if (draftId) {
        await messagesApi.updateDraft(draftId, toMessagePatch(patch));
      } else {
        const created = await messagesApi.createDraft(toMessagePatch({ ...compose.initial, ...patch }));
        draftId = created.id!;
        createdDrafts.set(compose.key, draftId);
      }
      return { draftId, key: compose.key };
    };
    const job = saveQueue.then(run, run);
    saveQueue = job.catch(() => undefined);
    try {
      const result = await job;
      // t("Draft saved")
      if (!silent) dispatch(pushAlertStack({ message: "Draft saved", severity: "success" }));
      return result;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const addDraftAttachments = createAsyncThunk<{ key: number; attachments: Attachment[] }, { files: File[]; patch: DraftPatch }, ThunkApi>(
  "mail/addDraftAttachments",
  async ({ files, patch }, { dispatch, getState, rejectWithValue }) => {
    try {
      const compose = getState().mail.compose;
      if (!compose) return rejectWithValue("No open draft");
      await draftSavesSettled();
      let draftId = getState().mail.compose?.draftId || createdDrafts.get(compose.key);
      if (!draftId) {
        draftId = (await dispatch(saveDraft({ patch, silent: true })).unwrap()).draftId;
      }
      for (const file of files) {
        await messagesApi.addFileAttachment(draftId, file);
      }
      // Reload to get ids/sizes for attachments created through upload sessions
      const all = await messagesApi.getAttachments(draftId);
      return { key: compose.key, attachments: all };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const addInlineImage = createAsyncThunk<string, { file: File; patch: DraftPatch }, ThunkApi>(
  "mail/addInlineImage",
  async ({ file, patch }, { dispatch, getState, rejectWithValue }) => {
    try {
      const compose = getState().mail.compose;
      if (!compose) return rejectWithValue("No open draft");
      await draftSavesSettled();
      let draftId = getState().mail.compose?.draftId || createdDrafts.get(compose.key);
      if (!draftId) {
        draftId = (await dispatch(saveDraft({ patch, silent: true })).unwrap()).draftId;
      }
      const contentId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}@grommunio`;
      await messagesApi.addFileAttachment(draftId, file, true, contentId);
      return `cid:${contentId}`;
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const removeDraftAttachment = createAsyncThunk<{ key: number; attachmentId: string }, string, ThunkApi>(
  "mail/removeDraftAttachment",
  async (attachmentId, { dispatch, getState, rejectWithValue }) => {
    const compose = getState().mail.compose;
    if (!compose?.draftId) return rejectWithValue("No draft");
    try {
      await messagesApi.deleteAttachment(compose.draftId, attachmentId);
      return { key: compose.key, attachmentId };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const sendCompose = createAsyncThunk<number, { patch: DraftPatch }, ThunkApi>(
  "mail/sendCompose",
  async ({ patch }, { dispatch, getState, rejectWithValue }) => {
    const compose = getState().mail.compose;
    if (!compose) return rejectWithValue("No open draft");
    try {
      // A running autosave may be creating the draft right now
      await draftSavesSettled();
      const draftId = getState().mail.compose?.draftId || createdDrafts.get(compose.key);
      if (draftId || compose.initial.attachments.length) {
        const saved = await dispatch(saveDraft({ patch, silent: true })).unwrap();
        await messagesApi.sendDraft(saved.draftId);
        dispatch(mailSlice.actions.messagesRemoved([saved.draftId]));
      } else {
        await messagesApi.sendMail(toMessagePatch({ ...compose.initial, ...patch }) as Message);
      }
      createdDrafts.delete(compose.key);
      // t("Message sent")
      dispatch(pushAlertStack({ message: "Message sent", severity: "success" }));
      dispatch(loadFolders());
      return compose.key;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const discardCompose = createAsyncThunk<number, void, ThunkApi>(
  "mail/discardCompose",
  async (_arg, { dispatch, getState }) => {
    const compose = getState().mail.compose;
    if (!compose) return -1;
    await draftSavesSettled();
    const draftId = getState().mail.compose?.draftId || createdDrafts.get(compose.key);
    createdDrafts.delete(compose.key);
    if (draftId) {
      try {
        await messagesApi.deleteMessage(draftId, true);
        dispatch(mailSlice.actions.messagesRemoved([draftId]));
        dispatch(loadFolders());
      } catch (err) {
        dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      }
    }
    return compose.key;
  },
);

const initialState: MailState = {
  folders: [],
  foldersLoading: false,
  foldersLoaded: false,
  expandedFolders: loadExpanded(),
  favoriteFolders: loadFavorites(),
  messages: {},
  loadedDetails: {},
  loadingDetails: {},
  detailsError: {},
  lists: {},
  categories: [],
  categoriesLoaded: false,
  pinned: loadPinned(),
  selection: [],
  compose: null,
  prefs: loadPrefs(),
  lastSync: 0,
  newArrivals: [],
  sync: {},
  conversations: {},
  deleteConfirm: null,
};

function mergeMessages(state: MailState, messages: Message[]) {
  messages.forEach(message => {
    if (!message.id) return;
    const existing = state.messages[message.id];
    // Keep an already loaded body when a list refresh delivers the slim version
    state.messages[message.id] = existing?.body && !message.body ? { ...existing, ...message, body: existing.body } : { ...existing, ...message };
  });
}

function removeFromLists(state: MailState, ids: string[]) {
  const set = new Set(ids);
  Object.values(state.lists).forEach(list => {
    const before = list.ids.length;
    list.ids = list.ids.filter(id => !set.has(id));
    if (list.total !== undefined) list.total = Math.max(0, list.total - (before - list.ids.length));
  });
  state.selection = state.selection.filter(id => !set.has(id));
}

function forgetMessages(state: MailState, ids: string[]) {
  removeFromLists(state, ids);
  ids.forEach(id => {
    delete state.messages[id];
    delete state.loadedDetails[id];
    delete state.detailsError[id];
  });
}

const time = (m?: Message) => new Date(m?.receivedDateTime || 0).getTime();

// Inserts matches that fall into the loaded window, drops ones that no longer
// match, like mail moved between Focused and Other.
function applySyncToList(state: MailState, list: MessageList, added: Message[], changed: Message[]): number {
  const syncable = list.filter === "all" || list.filter === "focused" || list.filter === "other";
  if (!syncable) return 0;
  const matches = (m: Message) => list.filter === "all" || m.inferenceClassification === list.filter;
  const byDate = list.sort.field === "receivedDateTime";
  const desc = list.sort.direction === "desc";
  let inserted = 0;

  // Changed messages whose classification no longer matches leave the list
  const leaving = new Set(changed.filter(m => !matches(m)).map(m => m.id!));
  if (leaving.size) list.ids = list.ids.filter(id => !leaving.has(id));

  const candidates = [...added, ...(byDate ? changed : [])].filter(m => m.id && matches(m) && !list.ids.includes(m.id));
  candidates.forEach(m => {
    if (!byDate) {
      // Other sorts: append new messages only
      if (added.includes(m) && !list.nextLink) { list.ids.push(m.id!); inserted++; }
      return;
    }
    const t = time(m);
    const idx = list.ids.findIndex(id => desc ? time(state.messages[id]) < t : time(state.messages[id]) > t);
    if (idx === -1) {
      // Beyond the loaded window, it arrives with the next page
      if (list.nextLink) return;
      list.ids.push(m.id!);
    } else {
      list.ids.splice(idx, 0, m.id!);
    }
    inserted++;
  });
  return inserted - leaving.size;
}

const mailSlice = createSlice({
  name: "mail",
  initialState,
  reducers: {
    messagesReceived(state, action: PayloadAction<Message[]>) {
      mergeMessages(state, action.payload);
    },
    messagesPatched(state, action: PayloadAction<{ ids: string[]; props: Partial<Message> }>) {
      action.payload.ids.forEach(id => {
        if (state.messages[id]) state.messages[id] = { ...state.messages[id], ...action.payload.props };
      });
    },
    messagesRemoved(state, action: PayloadAction<string[]>) {
      forgetMessages(state, action.payload);
    },
    messagesRestored(state, action: PayloadAction<{ messages: Message[]; lists: ListSnapshot[] }>) {
      mergeMessages(state, action.payload.messages);
      const restore = new Set(action.payload.messages.map(m => m.id));
      action.payload.lists.forEach(snapshot => {
        const list = state.lists[snapshot.key];
        // A reload in between already shows the server state
        if (!list || list.requestId !== snapshot.requestId) return;
        const current = new Set(list.ids);
        const before = new Set(snapshot.ids);
        const kept = snapshot.ids.filter(id => current.has(id) || restore.has(id));
        const restored = kept.filter(id => !current.has(id)).length;
        list.ids = [...list.ids.filter(id => !before.has(id)), ...kept];
        if (list.total !== undefined) list.total += restored;
      });
    },
    setSelection(state, action: PayloadAction<string[]>) {
      state.selection = action.payload;
    },
    toggleSelection(state, action: PayloadAction<string>) {
      const idx = state.selection.indexOf(action.payload);
      if (idx === -1) state.selection.push(action.payload);
      else state.selection.splice(idx, 1);
    },
    clearSelection(state) {
      state.selection = [];
    },
    setListFilter(state, action: PayloadAction<{ key: string; filter: MailFilter }>) {
      const list = state.lists[action.payload.key];
      if (list) {
        list.filter = action.payload.filter;
        list.loaded = false;
      }
    },
    setListSort(state, action: PayloadAction<{ key: string; sort: MailSort }>) {
      const list = state.lists[action.payload.key];
      if (list) {
        list.sort = action.payload.sort;
        list.loaded = false;
      }
    },
    clearSearchLists(state) {
      Object.keys(state.lists).filter(k => k.startsWith("search:")).forEach(k => delete state.lists[k]);
    },
    togglePinned(state, action: PayloadAction<string>) {
      const idx = state.pinned.indexOf(action.payload);
      if (idx === -1) state.pinned.push(action.payload);
      else state.pinned.splice(idx, 1);
      savePinned(state.pinned);
    },
    toggleFolderExpanded(state, action: PayloadAction<string>) {
      const idx = state.expandedFolders.indexOf(action.payload);
      if (idx === -1) state.expandedFolders.push(action.payload);
      else state.expandedFolders.splice(idx, 1);
      saveExpanded(state.expandedFolders);
    },
    toggleFavoriteFolder(state, action: PayloadAction<string>) {
      const idx = state.favoriteFolders.indexOf(action.payload);
      if (idx === -1) state.favoriteFolders.push(action.payload);
      else state.favoriteFolders.splice(idx, 1);
      saveFavorites(state.favoriteFolders);
    },
    updatePrefs(state, action: PayloadAction<Partial<MailPrefs>>) {
      state.prefs = { ...state.prefs, ...action.payload };
      savePrefs(state.prefs);
    },
    composeMinimized(state, action: PayloadAction<boolean>) {
      if (state.compose) state.compose.minimized = action.payload;
    },
    composeClosed(state) {
      if (state.compose) createdDrafts.delete(state.compose.key);
      state.compose = null;
    },
    clearNewArrivals(state) {
      state.newArrivals = [];
    },
    // Local update so the badge reacts immediately
    adjustUnreadCount(state, action: PayloadAction<{ folderId: string; delta: number }>) {
      state.folders = mapFolders(state.folders, f => f.id === action.payload.folderId ?
        { ...f, unreadItemCount: Math.max(0, (f.unreadItemCount || 0) + action.payload.delta) } : f);
    },
    deleteConfirmRequested(state, action: PayloadAction<DeleteRequest>) {
      state.deleteConfirm = action.payload;
    },
    deleteConfirmClosed(state) {
      state.deleteConfirm = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadFolders.pending, state => { state.foldersLoading = true; state.foldersError = undefined; })
      .addCase(loadFolders.fulfilled, (state, action) => {
        // Preserve deeper levels that were loaded on demand
        const previous = state.folders;
        const merged = action.payload.map(folder => {
          const old = findFolder(previous, folder.id || undefined);
          return {
            ...folder,
            childFolders: (folder.childFolders || []).map(child => {
              const oldChild = old ? findFolder(old.childFolders || [], child.id || undefined) : undefined;
              return oldChild?.childFolders?.length && !child.childFolders?.length ? { ...child, childFolders: oldChild.childFolders } : child;
            }),
          };
        });
        state.folders = sortFolders(merged);
        state.foldersLoading = false;
        state.foldersLoaded = true;
      })
      .addCase(loadFolders.rejected, (state, action) => {
        state.foldersLoading = false;
        state.foldersError = action.payload || action.error.message;
      })
      .addCase(loadChildFolders.fulfilled, (state, action) => {
        state.folders = mapFolders(state.folders, f => f.id === action.payload.parentId ?
          { ...f, childFolders: sortFolders(action.payload.folders) } : f);
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        const { folder, parentId } = action.payload;
        if (parentId) {
          state.folders = mapFolders(state.folders, f => f.id === parentId ?
            { ...f, childFolderCount: (f.childFolderCount || 0) + 1, childFolders: sortFolders([...(f.childFolders || []).filter(c => c.id !== folder.id), folder]) } : f);
          if (!state.expandedFolders.includes(parentId)) {
            state.expandedFolders.push(parentId);
            saveExpanded(state.expandedFolders);
          }
        } else {
          state.folders = sortFolders([...state.folders, folder]);
        }
      })
      .addCase(renameFolder.fulfilled, (state, action) => {
        state.folders = sortFolders(mapFolders(state.folders, f => f.id === action.payload.id ? { ...f, displayName: action.payload.displayName } : f));
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.folders = removeFolder(state.folders, action.payload);
        delete state.lists[listKey(action.payload)];
        delete state.sync[action.payload];
        state.favoriteFolders = state.favoriteFolders.filter(id => id !== action.payload);
      })
      .addCase(markFolderRead.fulfilled, (state, action) => {
        state.folders = mapFolders(state.folders, f => f.id === action.payload ? { ...f, unreadItemCount: 0 } : f);
        const list = state.lists[listKey(action.payload)];
        list?.ids.forEach(id => { if (state.messages[id]) state.messages[id].isRead = true; });
      })
      .addCase(emptyFolder.fulfilled, (state, action) => {
        const list = state.lists[listKey(action.payload)];
        if (list) {
          forgetMessages(state, [...list.ids]);
          list.ids = [];
          list.total = 0;
          list.nextLink = undefined;
        }
        state.folders = mapFolders(state.folders, f => f.id === action.payload ? { ...f, unreadItemCount: 0, totalItemCount: 0 } : f);
      })
      .addCase(loadMessages.pending, (state, action) => {
        const key = listKey(action.meta.arg.folderId, action.meta.arg.search);
        const existing = state.lists[key];
        const list = existing || emptyList(key, action.meta.arg.folderId, action.meta.arg.search, action.meta.arg.filter || "all", action.meta.arg.sort || DEFAULT_SORT);
        if (action.meta.arg.filter) list.filter = action.meta.arg.filter;
        if (action.meta.arg.sort) list.sort = action.meta.arg.sort;
        list.loading = true;
        list.error = undefined;
        list.requestId = action.meta.requestId;
        state.lists[key] = list;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        const list = state.lists[action.payload.key];
        // Drop results of a superseded request
        if (!list || list.requestId !== action.meta.requestId) return;
        mergeMessages(state, action.payload.messages);
        list.ids = action.payload.messages.map(m => m.id!).filter(Boolean);
        list.nextLink = action.payload.nextLink;
        list.total = action.payload.total;
        list.loading = false;
        list.loadingMore = false;
        list.loaded = true;
        state.selection = [];
      })
      .addCase(loadMessages.rejected, (state, action) => {
        const list = state.lists[listKey(action.meta.arg.folderId, action.meta.arg.search)];
        if (list && list.requestId === action.meta.requestId) {
          list.loading = false;
          list.loaded = true;
          list.error = action.payload || action.error.message;
        }
      })
      .addCase(loadMoreMessages.pending, (state, action) => {
        const list = state.lists[action.meta.arg];
        if (list) list.loadingMore = true;
      })
      .addCase(loadMoreMessages.fulfilled, (state, action) => {
        const list = state.lists[action.payload.key];
        if (!list) return;
        list.loadingMore = false;
        if (list.requestId !== action.payload.requestId) return;
        mergeMessages(state, action.payload.messages);
        const known = new Set(list.ids);
        action.payload.messages.forEach(m => { if (m.id && !known.has(m.id)) list.ids.push(m.id); });
        list.nextLink = action.payload.nextLink;
      })
      .addCase(loadMoreMessages.rejected, (state, action) => {
        const list = state.lists[action.meta.arg];
        if (list) list.loadingMore = false;
      })
      .addCase(syncFolder.pending, (state, action) => {
        state.sync[action.meta.arg] = { ...state.sync[action.meta.arg], syncing: true };
      })
      .addCase(syncFolder.rejected, (state, action) => {
        if (state.sync[action.meta.arg]) state.sync[action.meta.arg].syncing = false;
      })
      .addCase(syncFolder.fulfilled, (state, action) => {
        const { folderId, added, changed, removed, arrivals, deltaLink, initial } = action.payload;
        state.sync[folderId] = { deltaLink, since: Date.now(), syncing: false };
        state.lastSync = Date.now();
        if (initial) return;
        mergeMessages(state, [...added, ...changed]);
        if (removed.length) forgetMessages(state, removed);
        const list = state.lists[listKey(folderId)];
        if (list?.loaded && !list.loading) {
          const delta = applySyncToList(state, list, added, changed);
          if (list.total !== undefined) list.total = Math.max(0, list.total + delta);
        }
        state.newArrivals.push(...arrivals.filter(id => !state.newArrivals.includes(id)));
      })
      .addCase(loadMessageDetails.pending, (state, action) => {
        state.loadingDetails[action.meta.arg] = true;
        delete state.detailsError[action.meta.arg];
      })
      .addCase(loadMessageDetails.fulfilled, (state, action) => {
        delete state.loadingDetails[action.meta.arg];
        if (action.payload.id) {
          state.messages[action.payload.id] = { ...state.messages[action.payload.id], ...action.payload };
          state.loadedDetails[action.payload.id] = true;
        }
      })
      .addCase(loadMessageDetails.rejected, (state, action) => {
        delete state.loadingDetails[action.meta.arg];
        state.detailsError[action.meta.arg] = action.payload || action.error.message || "Error";
      })
      .addCase(loadConversation.pending, (state, action) => {
        state.conversations[action.meta.arg] = { loading: true, loaded: Boolean(state.conversations[action.meta.arg]?.loaded) };
      })
      .addCase(loadConversation.fulfilled, (state, action) => {
        mergeMessages(state, action.payload);
        state.conversations[action.meta.arg] = { loading: false, loaded: true };
      })
      .addCase(loadConversation.rejected, (state, action) => {
        state.conversations[action.meta.arg] = { loading: false, loaded: true, error: action.payload || action.error.message };
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.categoriesLoaded = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.categories = state.categories.map(c => c.id === action.payload.id ? action.payload : c);
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      })
      .addCase(createComposeState.pending, (state, action) => {
        state.compose = { key: Date.now(), mode: action.meta.arg.mode, status: "creating", initial: emptyDraft(), minimized: false, requestId: action.meta.requestId };
      })
      .addCase(createComposeState.fulfilled, (state, action) => {
        // Ignore the result when the compose was closed or replaced meanwhile
        if (state.compose?.requestId !== action.meta.requestId) return;
        state.compose = { ...action.payload, requestId: action.meta.requestId };
      })
      .addCase(createComposeState.rejected, (state, action) => {
        if (state.compose?.requestId === action.meta.requestId) state.compose = null;
      })
      .addCase(saveDraft.pending, state => {
        // Saving as part of sending must keep the compose busy
        if (state.compose && state.compose.status !== "sending") state.compose.status = "saving";
      })
      .addCase(saveDraft.fulfilled, (state, action) => {
        if (state.compose && state.compose.key === action.payload.key) {
          state.compose.draftId = action.payload.draftId;
          if (state.compose.status === "saving") state.compose.status = "ready";
          state.compose.lastSaved = Date.now();
        }
      })
      .addCase(saveDraft.rejected, (state, action) => {
        if (state.compose) {
          if (state.compose.status === "saving") state.compose.status = "ready";
          state.compose.error = action.payload;
        }
      })
      .addCase(addDraftAttachments.fulfilled, (state, action) => {
        if (state.compose && state.compose.key === action.payload.key) {
          state.compose.initial.attachments = action.payload.attachments;
        }
      })
      .addCase(removeDraftAttachment.fulfilled, (state, action) => {
        if (state.compose && state.compose.key === action.payload.key) {
          state.compose.initial.attachments = state.compose.initial.attachments.filter(a => a.id !== action.payload.attachmentId);
        }
      })
      .addCase(sendCompose.pending, state => { if (state.compose) state.compose.status = "sending"; })
      .addCase(sendCompose.fulfilled, (state, action) => {
        if (state.compose?.key === action.payload) state.compose = null;
        // The sent message may belong to an open conversation: reload it
        Object.values(state.conversations).forEach(c => { c.loaded = false; });
      })
      .addCase(sendCompose.rejected, (state, action) => {
        if (state.compose) { state.compose.status = "ready"; state.compose.error = action.payload; }
      })
      .addCase(discardCompose.fulfilled, (state, action) => {
        if (state.compose?.key === action.payload || action.payload === -1) state.compose = null;
      });
  },
});

export const {
  messagesReceived, messagesPatched, messagesRemoved, messagesRestored, setSelection, toggleSelection, clearSelection,
  setListFilter, setListSort, clearSearchLists, togglePinned, toggleFolderExpanded, toggleFavoriteFolder,
  updatePrefs, composeMinimized, composeClosed, clearNewArrivals, adjustUnreadCount, deleteConfirmRequested, deleteConfirmClosed,
} = mailSlice.actions;

export default mailSlice.reducer;
