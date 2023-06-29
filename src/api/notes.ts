// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { Message } from "microsoft-graph";
import { ensureClient, graphClient } from "./utils";

export async function getNotes(authProvider: AuthCodeMSALBrowserAuthenticationProvider): Promise<Message[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api('/me/MailFolders/notes/messages')
    .get();

  return response.value;
}

export async function postNote(note: Message): Promise<Message> {
  return await graphClient!
    .api('/me/MailFolders/notes/messages')
    .post(note);
}

export async function deleteNote(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  noteId: string): Promise<Message> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/MailFolders/notes/messages/' + noteId)
    .delete();
}

export async function patchNote(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  note: Message): Promise<Message> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/MailFolders/notes/messages/' + note.id)
    .patch(note);
}
