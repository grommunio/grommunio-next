// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { Contact } from "microsoft-graph";
import { SET_GAB_CONTACTS_SELECTION, SET_GAB_OPEN } from "./types";

export function setGABContactsSelection(contacts: Array<Contact>) {
  return {
    type: SET_GAB_CONTACTS_SELECTION,
    contacts,
  }
}

export function setGABOpen(open: boolean) {
  return {
    type: SET_GAB_OPEN,
    open,
  }
}
