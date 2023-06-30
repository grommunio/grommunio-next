// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { Contact } from "microsoft-graph";
import { deleteContact, getContacts, postContact } from "../api/contacts";
import { FETCH_CONTACTS_DATA, DELETE_CONTACTS_DATA } from "./types";
import { defaultDeleteHandler, defaultFetchHandler, defaultPostHandler } from "./defaults";


export function fetchContactsData() {
  return defaultFetchHandler(getContacts, FETCH_CONTACTS_DATA)
}

export function deleteContactData(contactId: string) {
  return defaultDeleteHandler(deleteContact, DELETE_CONTACTS_DATA, contactId)
}

export function postContactData(contact: Contact) {
  //TODO: Add proper dispatch type to update reducer
  return defaultPostHandler(postContact, null, contact)
}