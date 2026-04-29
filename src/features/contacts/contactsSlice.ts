// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Contact, ContactFolder } from "microsoft-graph";
import type { RootState } from "../../store";
import * as api from "../../api/contacts";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../features/alerts/alertsSlice";
import { folderWithDescendants } from "./contactUtils";

const errorMessage = (err: unknown) => err instanceof ApiError || err instanceof Error ? err.message : String(err);
type ThunkApi = { state: RootState; rejectValue: string };

export const ALL_CONTACTS = "all";

export type ContactList = {
  key: string;
  folderId?: string;
  search?: string;
  ids: string[];
  nextLink?: string;
  total?: number;
  loading: boolean;
  loadingMore: boolean;
  loaded: boolean;
  error?: string;
};

export type ContactsState = {
  folders: ContactFolder[];
  foldersLoaded: boolean;
  contacts: Record<string, Contact>;
  lists: Record<string, ContactList>;
  // null when the contact has no photo
  photos: Record<string, string | null>;
  selection: string[];
  // all contacts loaded, for recipient suggestions
  allLoaded: boolean;
};

export const contactListKey = (folderId?: string, search?: string) => `${folderId || ALL_CONTACTS}|${search || ""}`;

export const loadContactFolders = createAsyncThunk<ContactFolder[], void, ThunkApi>(
  "contacts/loadFolders",
  async (_arg, { rejectWithValue }) => {
    try {
      return await api.getContactFolders();
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

async function allFolderIds(state: RootState): Promise<string[]> {
  const folders = state.contacts.foldersLoaded ? state.contacts.folders : await api.getContactFolders();
  return folders.map(f => f.id!).filter(Boolean);
}

export const loadContacts = createAsyncThunk<{ key: string; contacts: Contact[]; nextLink?: string; total?: number }, { folderId?: string; search?: string; force?: boolean }, ThunkApi>(
  "contacts/loadContacts",
  async ({ folderId, search }, { getState, rejectWithValue }) => {
    const key = contactListKey(folderId, search);
    try {
      // "All contacts" aggregates the default folder and every contact folder
      if (!folderId || folderId === ALL_CONTACTS) {
        const contacts = await api.getContactsOfFolders(await allFolderIds(getState()), search);
        return { key, contacts, total: contacts.length };
      }
      const page = await api.getContactsPage(folderId === ALL_CONTACTS ? undefined : folderId, search);
      return { key, contacts: page.value, nextLink: page.nextLink, total: page.count };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  {
    condition: ({ folderId, search, force }, { getState }) => {
      const list = getState().contacts.lists[contactListKey(folderId, search)];
      return !list || force || (!list.loaded && !list.loading);
    },
  },
);

export const loadMoreContacts = createAsyncThunk<{ key: string; contacts: Contact[]; nextLink?: string }, string, ThunkApi>(
  "contacts/loadMore",
  async (key, { getState, rejectWithValue }) => {
    const list = getState().contacts.lists[key];
    if (!list?.nextLink) return { key, contacts: [] };
    try {
      const page = await api.getContactsNextPage(list.nextLink);
      return { key, contacts: page.value, nextLink: page.nextLink };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  { condition: (key, { getState }) => { const l = getState().contacts.lists[key]; return Boolean(l?.nextLink && !l.loadingMore); } },
);

export const loadAllContacts = createAsyncThunk<Contact[], void, ThunkApi>(
  "contacts/loadAll",
  async (_arg, { getState, rejectWithValue }) => {
    try {
      return await api.getContactsOfFolders(await allFolderIds(getState()));
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
  { condition: (_arg, { getState }) => !getState().contacts.allLoaded },
);

export const loadContact = createAsyncThunk<Contact, string, ThunkApi>(
  "contacts/loadContact",
  async (id, { rejectWithValue }) => {
    try {
      return await api.getContact(id);
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  },
);

// silent: bulk import reports one summary instead
export const createContact = createAsyncThunk<{ contact: Contact; folderId?: string }, { contact: Contact; folderId?: string; photo?: File; silent?: boolean }, ThunkApi>(
  "contacts/create",
  async ({ contact, folderId, photo, silent }, { dispatch, rejectWithValue }) => {
    try {
      const created = await api.postContact(contact, folderId === ALL_CONTACTS ? undefined : folderId);
      if (photo && created.id) await api.putContactPhoto(created.id, photo);
      if (!silent) dispatch(pushAlertStack({ message: "Contact saved", severity: "success" }));
      return { contact: created, folderId };
    } catch (err) {
      if (!silent) dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const updateContact = createAsyncThunk<Contact, { contact: Contact; photo?: File }, ThunkApi>(
  "contacts/update",
  async ({ contact, photo }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await api.patchContact(contact);
      if (photo && contact.id) {
        await api.putContactPhoto(contact.id, photo);
        dispatch(contactsSlice.actions.photoLoaded({ id: contact.id, url: URL.createObjectURL(photo) }));
      }
      dispatch(pushAlertStack({ message: "Contact saved", severity: "success" }));
      return updated;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteContacts = createAsyncThunk<string[], string[], ThunkApi>(
  "contacts/delete",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      await Promise.all(ids.map(id => api.deleteContact(id)));
      // t("{{count}} contacts deleted")
      dispatch(pushAlertStack({ message: ids.length === 1 ? "Contact deleted" : "{{count}} contacts deleted", params: { count: ids.length }, severity: "success" }));
      return ids;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const loadContactPhoto = createAsyncThunk<{ id: string; url: string | null }, string, ThunkApi>(
  "contacts/loadPhoto",
  async (id) => ({ id, url: await api.getContactPhoto(id).catch(() => null) }),
  { condition: (id, { getState }) => getState().contacts.photos[id] === undefined },
);

export const createContactFolder = createAsyncThunk<ContactFolder, string, ThunkApi>(
  "contacts/createFolder",
  async (displayName, { dispatch, rejectWithValue }) => {
    try {
      return await api.postContactFolder(displayName);
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const renameContactFolder = createAsyncThunk<ContactFolder, { id: string; displayName: string }, ThunkApi>(
  "contacts/renameFolder",
  async ({ id, displayName }, { dispatch, rejectWithValue }) => {
    try {
      return await api.patchContactFolder(id, displayName);
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

export const deleteContactFolder = createAsyncThunk<string, string, ThunkApi>(
  "contacts/deleteFolder",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.deleteContactFolder(id);
      return id;
    } catch (err) {
      dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
      return rejectWithValue(errorMessage(err));
    }
  },
);

const initialState: ContactsState = {
  folders: [],
  foldersLoaded: false,
  contacts: {},
  lists: {},
  photos: {},
  selection: [],
  allLoaded: false,
};

const byName = (a: Contact, b: Contact) => (a.displayName || "").localeCompare(b.displayName || "", undefined, { sensitivity: "base" });

function merge(state: ContactsState, contacts: Contact[]) {
  contacts.forEach(c => { if (c.id) state.contacts[c.id] = { ...state.contacts[c.id], ...c }; });
}

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    setContactSelection(state, action: PayloadAction<string[]>) { state.selection = action.payload; },
    toggleContactSelection(state, action: PayloadAction<string>) {
      const idx = state.selection.indexOf(action.payload);
      if (idx === -1) state.selection.push(action.payload); else state.selection.splice(idx, 1);
    },
    photoLoaded(state, action: PayloadAction<{ id: string; url: string | null }>) { state.photos[action.payload.id] = action.payload.url; },
    clearContactSearches(state) {
      Object.keys(state.lists).filter(k => !k.endsWith("|")).forEach(k => delete state.lists[k]);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadContactFolders.fulfilled, (state, action) => {
        state.folders = action.payload;
        state.foldersLoaded = true;
      })
      .addCase(loadContacts.pending, (state, action) => {
        const key = contactListKey(action.meta.arg.folderId, action.meta.arg.search);
        state.lists[key] = { ...(state.lists[key] || { key, folderId: action.meta.arg.folderId, search: action.meta.arg.search, ids: [], loadingMore: false, loaded: false }), loading: true, error: undefined };
      })
      .addCase(loadContacts.fulfilled, (state, action) => {
        const list = state.lists[action.payload.key];
        if (!list) return;
        merge(state, action.payload.contacts);
        list.ids = action.payload.contacts.map(c => c.id!).filter(Boolean);
        list.nextLink = action.payload.nextLink;
        list.total = action.payload.total;
        list.loading = false;
        list.loaded = true;
      })
      .addCase(loadContacts.rejected, (state, action) => {
        const list = state.lists[contactListKey(action.meta.arg.folderId, action.meta.arg.search)];
        if (list) { list.loading = false; list.loaded = true; list.error = action.payload || action.error.message; }
      })
      .addCase(loadMoreContacts.pending, (state, action) => { const l = state.lists[action.meta.arg]; if (l) l.loadingMore = true; })
      .addCase(loadMoreContacts.fulfilled, (state, action) => {
        const list = state.lists[action.payload.key];
        if (!list) return;
        merge(state, action.payload.contacts);
        const known = new Set(list.ids);
        action.payload.contacts.forEach(c => { if (c.id && !known.has(c.id)) list.ids.push(c.id); });
        list.nextLink = action.payload.nextLink;
        list.loadingMore = false;
      })
      .addCase(loadMoreContacts.rejected, (state, action) => { const l = state.lists[action.meta.arg]; if (l) l.loadingMore = false; })
      .addCase(loadAllContacts.fulfilled, (state, action) => {
        merge(state, action.payload);
        state.allLoaded = true;
      })
      .addCase(loadContact.fulfilled, (state, action) => { merge(state, [action.payload]); })
      .addCase(createContact.fulfilled, (state, action) => {
        const { contact, folderId } = action.payload;
        merge(state, [contact]);
        Object.values(state.lists).forEach(list => {
          if (list.search) return;
          const inScope = !list.folderId || list.folderId === ALL_CONTACTS || list.folderId === folderId;
          if (inScope && contact.id) {
            list.ids = [...list.ids, contact.id].sort((a, b) => byName(state.contacts[a], state.contacts[b]));
            if (list.total !== undefined) list.total += 1;
          }
        });
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        merge(state, [action.payload]);
        Object.values(state.lists).forEach(list => { list.ids.sort((a, b) => byName(state.contacts[a], state.contacts[b])); });
      })
      .addCase(deleteContacts.fulfilled, (state, action) => {
        const set = new Set(action.payload);
        Object.values(state.lists).forEach(list => {
          const before = list.ids.length;
          list.ids = list.ids.filter(id => !set.has(id));
          if (list.total !== undefined) list.total -= before - list.ids.length;
        });
        action.payload.forEach(id => { delete state.contacts[id]; delete state.photos[id]; });
        state.selection = state.selection.filter(id => !set.has(id));
      })
      .addCase(loadContactPhoto.fulfilled, (state, action) => { state.photos[action.payload.id] = action.payload.url; })
      .addCase(createContactFolder.fulfilled, (state, action) => {
        state.folders = [...state.folders, action.payload];
      })
      .addCase(renameContactFolder.fulfilled, (state, action) => {
        state.folders = state.folders.map(f => f.id === action.payload.id ? { ...f, ...action.payload } : f);
      })
      .addCase(deleteContactFolder.fulfilled, (state, action) => {
        const removed = folderWithDescendants(state.folders, action.payload);
        state.folders = state.folders.filter(f => !removed.has(f.id!));
        Object.keys(state.lists).filter(k => removed.has(k.split("|")[0])).forEach(k => delete state.lists[k]);
        // Drop the deleted folders' contacts from the aggregated lists
        Object.values(state.lists).forEach(list => {
          const before = list.ids.length;
          list.ids = list.ids.filter(id => !removed.has(state.contacts[id]?.parentFolderId || ""));
          if (list.total !== undefined) list.total -= before - list.ids.length;
        });
      });
  },
});

export const { setContactSelection, toggleContactSelection, clearContactSearches } = contactsSlice.actions;
export default contactsSlice.reducer;

export const selectAllContacts = createSelector([(state: RootState) => state.contacts.contacts], contacts => Object.values(contacts).sort(byName));

export const makeSelectContactList = (key: string) => createSelector(
  [(state: RootState) => state.contacts.lists[key], (state: RootState) => state.contacts.contacts],
  (list, contacts): Contact[] => list ? list.ids.map(id => contacts[id]).filter(Boolean) : [],
);
