// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Attachment, Message, OutlookCategory, Recipient } from "microsoft-graph";
import type { RootState } from "../../store";
import type { ExtendedMailFolder, WellKnownFolderName } from "../../types/messages";
import * as foldersApi from "../../api/folders";
import * as messagesApi from "../../api/messages";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../features/alerts/alertsSlice";
import { COMMON_FOLDER_ORDER, SCROLL_ITEMS } from "../../constants";
import {
  ComposeDraft, ComposeMode, ComposeState, MailFilter, MailPrefs, MailSort, MailState, MessageList,
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
      if (list.loading) return false;
      const sameParams = (arg.filter ?? list.filter) === list.filter && (arg.sort ?? list.sort) === list.sort;
      return arg.force || !list.loaded || !sameParams;
    },
  },
);

export const loadMoreMessages = createAsyncThunk<{ key: string; messages: Message[]; nextLink?: string }, string, ThunkApi>(
  "mail/loadMoreMessages",
  async (key, { getState, rejectWithValue }) => {
    const list = getState().mail.lists[key];
    if (!list?.nextLink) return { key, messages: [], nextLink: undefined };
    try {
      const page = await messagesApi.getMessagesNextPage(list.nextLink);
      return { key, messages: page.value, nextLink: page.nextLink };
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

// First sync only stores the delta link
export const syncFolder = createAsyncThunk<{ key: string; folderId: string; added: Message[]; changed: Message[]; removed: string[]; deltaLink?: string; initial: boolean }, string, ThunkApi>(
  "mail/syncFolder",
  async (folderId, { getState, rejectWithValue }) => {
    const key = listKey(folderId);
    const list = getState().mail.lists[key];
    const initial = !list?.deltaLink;
    try {
      const result = await messagesApi.getMessagesDelta(folderId, list?.deltaLink);
      if (initial) {
        return { key, folderId, added: [], changed: [], removed: [], deltaLink: result.deltaLink, initial: true };
      }
      const known = new Set(list?.ids || []);
      const added = result.value.filter(m => m.id && !known.has(m.id));
      const changed = result.value.filter(m => m.id && known.has(m.id));
      return { key, folderId, added, changed, removed: result.removed, deltaLink: result.deltaLink, initial: false };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: (folderId, { getState }) => {
      const list = getState().mail.lists[listKey(folderId)];
      return Boolean(list && list.loaded && !list.loading && list.filter === "all" && !list.search);
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

export const updateMessages = createAsyncThunk<void, { ids: string[]; props: Partial<Message> }, ThunkApi>(
  "mail/updateMessages",
  async ({ ids, props }, { dispatch, getState, rejectWithValue }) => {
    const previous = ids.map(id => getState().mail.messages[id]).filter(Boolean);
    dispatch(mailSlice.actions.messagesPatched({ ids, props }));
    try {
      const responses = ids.length === 1 ?
        [{ id: "0", status: 200, body: await messagesApi.patchMessage({ id: ids[0] }, props) }] :
        await messagesApi.patchMessages(ids, props);
      const failed = responses.filter(r => r.status >= 400);
      if (failed.length) throw new Error(`${failed.length} of ${ids.length} messages could not be updated`);
      // Server values win, it fills in flag due dates
      dispatch(mailSlice.actions.messagesReceived(responses.map(r => r.body).filter(Boolean) as Message[]));
    } catch (err) {
      dispatch(mailSlice.actions.messagesReceived(previous));
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const moveMessages = createAsyncThunk<{ ids: string[]; destinationId: string }, { ids: string[]; destinationId: string; silent?: boolean }, ThunkApi>(
  "mail/moveMessages",
  async ({ ids, destinationId, silent }, { dispatch, getState, rejectWithValue }) => {
    const folderName = findFolder(getState().mail.folders, destinationId)?.displayName || destinationId;
    dispatch(mailSlice.actions.messagesRemoved(ids));
    try {
      const responses = await messagesApi.moveMessages(ids, destinationId);
      const failed = responses.filter(r => r.status >= 400);
      if (failed.length) throw new Error(`${failed.length} of ${ids.length} messages could not be moved`);
      if (!silent) {
        dispatch(pushAlertStack({
          message: ids.length === 1 ? `Message moved to ${folderName}` : `${ids.length} messages moved to ${folderName}`,
          severity: "success",
          undo: { ids: responses.map(r => r.body?.id).filter(Boolean) as string[], destinationId: getState().mail.messages[ids[0]]?.parentFolderId },
        }));
      }
      dispatch(loadFolders());
      return { ids, destinationId };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      ids.forEach(id => dispatch(loadMessageDetails(id)));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const copyMessages = createAsyncThunk<void, { ids: string[]; destinationId: string }, ThunkApi>(
  "mail/copyMessages",
  async ({ ids, destinationId }, { dispatch, getState, rejectWithValue }) => {
    try {
      const responses = await messagesApi.copyMessages(ids, destinationId);
      const failed = responses.filter(r => r.status >= 400);
      if (failed.length) throw new Error(`${failed.length} of ${ids.length} messages could not be copied`);
      const folderName = findFolder(getState().mail.folders, destinationId)?.displayName || destinationId;
      dispatch(pushAlertStack({ message: `Copied to ${folderName}`, severity: "success" }));
      dispatch(loadFolders());
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteMessages = createAsyncThunk<string[], { ids: string[]; permanent?: boolean }, ThunkApi>(
  "mail/deleteMessages",
  async ({ ids, permanent }, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const first = state.mail.messages[ids[0]];
    const folder = findFolder(state.mail.folders, first?.parentFolderId || undefined);
    const hard = permanent || folder?.wellKnownName === "deleteditems";
    dispatch(mailSlice.actions.messagesRemoved(ids));
    try {
      const responses = await messagesApi.deleteMessages(ids, Boolean(hard));
      const failed = responses.filter(r => r.status >= 400);
      if (failed.length) throw new Error(`${failed.length} of ${ids.length} messages could not be deleted`);
      if (!hard) {
        dispatch(pushAlertStack({
          message: ids.length === 1 ? "Message deleted" : `${ids.length} messages deleted`,
          severity: "success",
          undo: { ids: responses.map(r => r.body?.id).filter(Boolean) as string[], destinationId: first?.parentFolderId },
        }));
      }
      dispatch(loadFolders());
      return ids;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

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

export const startCompose = createAsyncThunk<ComposeState, StartComposeArg, ThunkApi>(
  "mail/startCompose",
  async (arg, { dispatch, getState, rejectWithValue }) => {
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

export const saveDraft = createAsyncThunk<{ draftId: string; key: number }, { patch: DraftPatch; silent?: boolean }, ThunkApi>(
  "mail/saveDraft",
  async ({ patch, silent }, { dispatch, getState, rejectWithValue }) => {
    const compose = getState().mail.compose;
    if (!compose) return rejectWithValue("No open draft");
    try {
      let draftId = compose.draftId;
      if (draftId) {
        await messagesApi.updateDraft(draftId, toMessagePatch(patch));
      } else {
        const created = await messagesApi.createDraft(toMessagePatch({ ...compose.initial, ...patch }));
        draftId = created.id!;
      }
      if (!silent) dispatch(pushAlertStack({ message: "Draft saved", severity: "success" }));
      return { draftId, key: compose.key };
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
      let compose = getState().mail.compose;
      if (!compose) return rejectWithValue("No open draft");
      if (!compose.draftId) {
        await dispatch(saveDraft({ patch, silent: true })).unwrap();
        compose = getState().mail.compose!;
      }
      const attachments: Attachment[] = [];
      for (const file of files) {
        attachments.push(await messagesApi.addFileAttachment(compose.draftId!, file));
      }
      // Reload to get ids/sizes for attachments created through upload sessions
      const all = await messagesApi.getAttachments(compose.draftId!);
      return { key: compose.key, attachments: all };
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
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
      if (compose.draftId || compose.initial.attachments.length) {
        const { draftId } = await dispatch(saveDraft({ patch, silent: true })).unwrap();
        await messagesApi.sendDraft(draftId);
        dispatch(mailSlice.actions.messagesRemoved([draftId]));
      } else {
        await messagesApi.sendMail(toMessagePatch({ ...compose.initial, ...patch }) as Message);
      }
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
    if (compose.draftId) {
      try {
        await messagesApi.deleteMessage(compose.draftId, true);
        dispatch(mailSlice.actions.messagesRemoved([compose.draftId]));
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
  lists: {},
  categories: [],
  categoriesLoaded: false,
  pinned: loadPinned(),
  selection: [],
  compose: null,
  prefs: loadPrefs(),
  lastSync: 0,
  newArrivals: [],
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
      removeFromLists(state, action.payload);
      action.payload.forEach(id => {
        delete state.messages[id];
        delete state.loadedDetails[id];
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
            { ...f, childFolderCount: (f.childFolderCount || 0) + 1, childFolders: sortFolders([...(f.childFolders || []), folder]) } : f);
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
          list.ids.forEach(id => delete state.messages[id]);
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
        state.lists[key] = list;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        const list = state.lists[action.payload.key];
        if (!list) return;
        mergeMessages(state, action.payload.messages);
        list.ids = action.payload.messages.map(m => m.id!).filter(Boolean);
        list.nextLink = action.payload.nextLink;
        list.total = action.payload.total;
        list.loading = false;
        list.loaded = true;
        list.deltaLink = undefined;
        state.selection = [];
      })
      .addCase(loadMessages.rejected, (state, action) => {
        const list = state.lists[listKey(action.meta.arg.folderId, action.meta.arg.search)];
        if (list) {
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
        mergeMessages(state, action.payload.messages);
        const known = new Set(list.ids);
        action.payload.messages.forEach(m => { if (m.id && !known.has(m.id)) list.ids.push(m.id); });
        list.nextLink = action.payload.nextLink;
        list.loadingMore = false;
      })
      .addCase(loadMoreMessages.rejected, (state, action) => {
        const list = state.lists[action.meta.arg];
        if (list) list.loadingMore = false;
      })
      .addCase(syncFolder.fulfilled, (state, action) => {
        const { key, added, changed, removed, deltaLink, initial } = action.payload;
        const list = state.lists[key];
        if (!list) return;
        list.deltaLink = deltaLink;
        state.lastSync = Date.now();
        if (initial) return;
        mergeMessages(state, [...added, ...changed]);
        if (removed.length) {
          removeFromLists(state, removed);
          removed.forEach(id => delete state.messages[id]);
        }
        if (added.length) {
          const sortDesc = list.sort.field === "receivedDateTime" && list.sort.direction === "desc";
          const ids = added.map(m => m.id!).filter(id => !list.ids.includes(id));
          list.ids = sortDesc ? [...ids, ...list.ids] : [...list.ids, ...ids];
          if (list.total !== undefined) list.total += ids.length;
          const folderId = action.payload.folderId;
          const unreadNew = added.filter(m => !m.isRead && !m.isDraft).map(m => m.id!);
          state.newArrivals.push(...unreadNew);
          const folder = findFolder(state.folders, folderId);
          if (folder && unreadNew.length) {
            state.folders = mapFolders(state.folders, f => f.id === folderId ?
              { ...f, unreadItemCount: (f.unreadItemCount || 0) + unreadNew.length, totalItemCount: (f.totalItemCount || 0) + ids.length } : f);
          }
        }
      })
      .addCase(loadMessageDetails.pending, (state, action) => { state.loadingDetails[action.meta.arg] = true; })
      .addCase(loadMessageDetails.fulfilled, (state, action) => {
        delete state.loadingDetails[action.meta.arg];
        if (action.payload.id) {
          state.messages[action.payload.id] = { ...state.messages[action.payload.id], ...action.payload };
          state.loadedDetails[action.payload.id] = true;
        }
      })
      .addCase(loadMessageDetails.rejected, (state, action) => { delete state.loadingDetails[action.meta.arg]; })
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
      .addCase(startCompose.pending, state => {
        state.compose = { key: Date.now(), mode: "new", status: "creating", initial: emptyDraft(), minimized: false };
      })
      .addCase(startCompose.fulfilled, (state, action) => {
        state.compose = action.payload;
      })
      .addCase(startCompose.rejected, state => {
        state.compose = null;
      })
      .addCase(saveDraft.pending, state => { if (state.compose) state.compose.status = "saving"; })
      .addCase(saveDraft.fulfilled, (state, action) => {
        if (state.compose && state.compose.key === action.payload.key) {
          state.compose.draftId = action.payload.draftId;
          state.compose.status = "ready";
          state.compose.lastSaved = Date.now();
        }
      })
      .addCase(saveDraft.rejected, (state, action) => {
        if (state.compose) { state.compose.status = "ready"; state.compose.error = action.payload; }
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
  messagesReceived, messagesPatched, messagesRemoved, setSelection, toggleSelection, clearSelection,
  setListFilter, setListSort, clearSearchLists, togglePinned, toggleFolderExpanded, toggleFavoriteFolder,
  updatePrefs, composeMinimized, composeClosed, clearNewArrivals, adjustUnreadCount,
} = mailSlice.actions;

export default mailSlice.reducer;
