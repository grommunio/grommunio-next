// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { Message } from "microsoft-graph";
import { graphClient } from "./utils";

export async function getNotes(): Promise<Message[]> {
  const response: PageCollection = await graphClient!.api('/me/MailFolders/notes/messages')
    .get();

  return response.value;
}

export async function postNote(note: Message): Promise<Message> {
  return await graphClient!.api('/me/MailFolders/notes/messages')
    .post(note);
}

export async function deleteNote(noteId: string): Promise<Message> {
  return await graphClient!.api('/me/MailFolders/notes/messages/' + noteId)
    .delete();
}

export async function patchNote(note: Message): Promise<Message> {
  
  return await graphClient!.api('/me/MailFolders/notes/messages/' + note.id)
    .patch(note);
}
