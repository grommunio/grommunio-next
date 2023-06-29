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

export async function postContact(contact: Contact): Promise<Contact> {
  return await graphClient!
    .api('/me/contacts')
    .post(contact);
}

export async function deleteContact(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  contactId: string): Promise<void> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/contacts/' + contactId)
    .delete();
}

export async function getContact(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  contactId: string): Promise<Contact> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/contacts/' + contactId)
    .get();
}

export async function patchContact(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  contact: Contact): Promise<Contact> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/contacts/' + contact.id)
    .patch(contact);
}