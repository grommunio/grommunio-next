// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "microsoft-graph";
import type { RootState } from "../../store";
import * as api from "../../api/notes";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../actions/alerts";

const errorMessage = (err: unknown) => err instanceof ApiError || err instanceof Error ? err.message : String(err);
type ThunkApi = { state: RootState; rejectValue: string };

export type NoteColor = "yellow" | "green" | "pink" | "blue" | "purple" | "gray";
// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Yellow")
// t("Green")
// t("Pink")
// t("Blue")
// t("Purple")
// t("Gray")
export const NOTE_COLORS: Record<NoteColor, { light: string; dark: string; label: string }> = {
  yellow: { light: "#fff4b8", dark: "#5c4d12", label: "Yellow" },
  green: { light: "#d3f3c5", dark: "#2f4d24", label: "Green" },
  pink: { light: "#ffd6e7", dark: "#5a2a3c", label: "Pink" },
  blue: { light: "#cfe6ff", dark: "#1f3a57", label: "Blue" },
  purple: { light: "#e5d9ff", dark: "#3d2d5e", label: "Purple" },
  gray: { light: "#e6e8eb", dark: "#3a3d42", label: "Gray" },
};

export type NotesState = {
  notes: Message[];
  loaded: boolean;
  loading: boolean;
  // Graph has no note color, kept locally per id
  colors: Record<string, NoteColor>;
  error?: string;
};

const COLORS_KEY = "notes.colors";
const loadColors = (): Record<string, NoteColor> => { try { return JSON.parse(window.localStorage.getItem(COLORS_KEY) || "{}"); } catch { return {}; } };

export const loadNotes = createAsyncThunk<Message[], void, ThunkApi>("notes/load", async (_a, { rejectWithValue }) => {
  try { return await api.getNotes(); } catch (err) { return rejectWithValue(errorMessage(err)); }
});

// First line goes into the subject so other clients show a title
export function noteSubject(html: string): string {
  const doc = document.implementation.createHTMLDocument("");
  doc.body.innerHTML = html;
  const text = (doc.body.textContent || "").trim();
  const first = text.split("\n").map(l => l.trim()).find(Boolean) || "";
  return first.length > 80 ? first.slice(0, 79) + "…" : first;
}

export const createNote = createAsyncThunk<Message, { content: string }, ThunkApi>("notes/create", async ({ content }, { dispatch, rejectWithValue }) => {
  try {
    return await api.postNote({ subject: noteSubject(content) || "Note", body: { contentType: "html", content } });
  } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const updateNote = createAsyncThunk<Message, { id: string; content: string }, ThunkApi>("notes/update", async ({ id, content }, { dispatch, rejectWithValue }) => {
  try {
    return await api.patchNote({ id, subject: noteSubject(content) || "Note", body: { contentType: "html", content } });
  } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const deleteNote = createAsyncThunk<string, string, ThunkApi>("notes/delete", async (id, { dispatch, rejectWithValue }) => {
  try { await api.deleteNote(id); return id; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

const initialState: NotesState = { notes: [], loaded: false, loading: false, colors: loadColors() };

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setNoteColor(state, action: PayloadAction<{ id: string; color: NoteColor }>) {
      state.colors[action.payload.id] = action.payload.color;
      window.localStorage.setItem(COLORS_KEY, JSON.stringify(state.colors));
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadNotes.pending, state => { state.loading = true; })
      .addCase(loadNotes.fulfilled, (state, action) => { state.notes = action.payload; state.loaded = true; state.loading = false; })
      .addCase(loadNotes.rejected, (state, action) => { state.loading = false; state.loaded = true; state.error = action.payload || action.error.message; })
      .addCase(createNote.fulfilled, (state, action) => { state.notes.unshift(action.payload); })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.notes = state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n);
        state.notes.sort((a, b) => (b.lastModifiedDateTime || "").localeCompare(a.lastModifiedDateTime || ""));
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n.id !== action.payload);
        delete state.colors[action.payload];
        window.localStorage.setItem(COLORS_KEY, JSON.stringify(state.colors));
      });
  },
});

export const { setNoteColor } = notesSlice.actions;
export default notesSlice.reducer;
