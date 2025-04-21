// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Message } from "microsoft-graph";
import { del, getAll, patch, post } from "./graph";

// Notes are messages in the well-known Notes folder, like Outlook sticky notes
const NOTES = '/me/mailFolders/notes/messages';

export async function getNotes(): Promise<Message[]> {
  return getAll<Message>(NOTES, {
    select: ["id", "subject", "body", "bodyPreview", "lastModifiedDateTime", "createdDateTime", "categories"],
    orderby: "lastModifiedDateTime desc",
    top: 200,
  });
}

export async function postNote(note: Message): Promise<Message> {
  return post<Message>(NOTES, note);
}

export async function deleteNote(noteId: string): Promise<void> {
  return del(NOTES + '/' + noteId);
}

export async function patchNote(note: Message): Promise<Message> {
  const { id, ...props } = note;
  return patch<Message>(NOTES + '/' + id, props);
}
