// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Contact } from "microsoft-graph";
import { deleteContact, getContacts, postContact, getContactFolders, patchContact } from "../api/contacts";
import { FETCH_CONTACTS_DATA, DELETE_CONTACTS_DATA, POST_CONTACT_DATA, FETCH_CONTACT_FOLDERS, PATCH_CONTACT_DATA } from "./types";
import { defaultDeleteHandler, defaultFetchHandler, defaultPatchHandler, defaultPostHandler } from "./defaults";


export function fetchContactsData() {
  return defaultFetchHandler(getContacts, FETCH_CONTACTS_DATA)
}

export function fetchContactFoldersData() {
  return defaultFetchHandler(getContactFolders, FETCH_CONTACT_FOLDERS)
}

export function deleteContactData(contactId: string) {
  return defaultDeleteHandler(deleteContact, DELETE_CONTACTS_DATA, contactId)
}

export function postContactData(contact: Contact) {
  return defaultPostHandler(postContact, POST_CONTACT_DATA, contact)
}

export function patchContactData(contact: Contact) {
  return defaultPatchHandler(patchContact, PATCH_CONTACT_DATA, false, contact)
}