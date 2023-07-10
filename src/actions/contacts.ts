// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Contact } from "microsoft-graph";
import { deleteContact, getContacts, postContact } from "../api/contacts";
import { FETCH_CONTACTS_DATA, DELETE_CONTACTS_DATA, POST_CONTACT_DATA } from "./types";
import { defaultDeleteHandler, defaultFetchHandler, defaultPostHandler } from "./defaults";


export function fetchContactsData() {
  return defaultFetchHandler(getContacts, FETCH_CONTACTS_DATA)
}

export function deleteContactData(contactId: string) {
  return defaultDeleteHandler(deleteContact, DELETE_CONTACTS_DATA, contactId)
}

export function postContactData(contact: Contact) {
  return defaultPostHandler(postContact, POST_CONTACT_DATA, contact)
}