// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { MailFolder, Message } from "microsoft-graph";
import { ensureClient, graphClient } from "./utils";

export async function getUserMessages(authProvider: AuthCodeMSALBrowserAuthenticationProvider, folderid = 'inbox'): Promise<Message[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api(`/me/mailFolders/${folderid}/messages`)
    .get();

  return response.value;
}


export async function postMessage(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  message: Message, send: boolean): Promise<Message> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/' + (send ? 'sendMail' : 'messages'))
    .post(send ? { message } : message);
}


export async function getMailFolders(authProvider: AuthCodeMSALBrowserAuthenticationProvider): Promise<MailFolder[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api('/me/mailFolders')
    .get();

  return response.value;
}
