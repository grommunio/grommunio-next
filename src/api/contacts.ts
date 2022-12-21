// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { Contact } from "microsoft-graph";
import { ensureClient, graphClient } from "./utils";

export async function getContacts(authProvider: AuthCodeMSALBrowserAuthenticationProvider): Promise<Contact[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api('/me/contacts')
    .get();

  return response.value;
}

export async function postContact(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  contact: Contact): Promise<Contact> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/contacts')
    .post(contact);
}