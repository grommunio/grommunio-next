// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "microsoft-graph";
import { deleteNote, getNotes, postNote } from "../api/notes";
import { AppContext } from "../azure/AppContext";
import { FETCH_NOTES_DATA, DELETE_NOTES_DATA, POST_NOTE_DATA } from "./types";

export const fetchNotesData = createAsyncThunk<
  Message[],
  AppContext
>(
  FETCH_NOTES_DATA,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const mails = await getNotes(app.authProvider!);
        return mails;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

type deleteNoteDataParams = {
  app: AppContext,
  noteId: string,
}

export const deleteNoteData = createAsyncThunk<
  string | boolean,
  deleteNoteDataParams
  >(
    DELETE_NOTES_DATA,
    async ({ noteId, app }: deleteNoteDataParams) => {
      if (app.user) {
        try {
          await deleteNote(app.authProvider!, noteId);
          return noteId;
        } catch (err) {
          const error = err as Error;
        app.displayError!(error.message);
        return false;
        }
      }
      return false;
    }
  );

type postNoteDataParams = {
    app: AppContext,
    note: Message,
  }
  
export const postNoteData = createAsyncThunk<
    Message | boolean,
    postNoteDataParams
    >(
      POST_NOTE_DATA,
      async ({ note, app }: postNoteDataParams) => {
        if (app.user) {
          try {
            const resp = await postNote(app.authProvider!, note);
            return resp;
          } catch (err) {
            const error = err as Error;
          app.displayError!(error.message);
          return false;
          }
        }
        return false;
      }
    );
