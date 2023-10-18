// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { Contact } from "microsoft-graph";
import { graphClient } from "./utils";

export async function getContacts(): Promise<Contact[]> {
  const response: PageCollection = await graphClient!
    .api('/me/contacts')
    .get();

  return response.value;
}

export async function getContactFolders(): Promise<Contact[]> {
  const response: PageCollection = await graphClient!
    .api('/me/contactFolders')
    .get();

  return response.value;
}

export async function postContact(contact: Contact): Promise<Contact> {
  return await graphClient!
    .api('/me/contacts')
    .post(contact);
}

export async function deleteContact(contactId: string): Promise<void> {
  return await graphClient!
    .api('/me/contacts/' + contactId)
    .delete();
}

export async function getContact(contactId: string): Promise<Contact> {
  return await graphClient!
    .api('/me/contacts/' + contactId)
    .get();
}

export async function patchContact(contact: Contact): Promise<Contact> {
  
  return await graphClient!
    .api('/me/contacts/' + contact.id)
    .patch(contact);
}