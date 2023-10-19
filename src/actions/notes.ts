// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Message } from "microsoft-graph";
import { deleteNote, getNotes, patchNote, postNote } from "../api/notes";
import { FETCH_NOTES_DATA, DELETE_NOTES_DATA, POST_NOTE_DATA, PATCH_NOTE_DATA } from "./types";
import { defaultDeleteHandler, defaultFetchHandler, defaultPatchHandler, defaultPostHandler } from "./defaults";


export function fetchNotesData() {
  return defaultFetchHandler(getNotes, FETCH_NOTES_DATA)
}

export function deleteNoteData(noteId: string) {
  return defaultDeleteHandler(deleteNote, DELETE_NOTES_DATA, noteId)
}

export function postNoteData(...endpointProps: [Message]) {
  return defaultPostHandler(postNote, POST_NOTE_DATA, ...endpointProps)
}

export function patchNoteData(note: Message) {
  return defaultPatchHandler(patchNote, PATCH_NOTE_DATA, false, note)
}
