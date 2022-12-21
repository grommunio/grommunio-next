// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Contact } from "microsoft-graph";
import { deleteContact, getContacts } from "../api/contacts";
import { AppContext } from "../azure/AppContext";
import { FETCH_CONTACTS_DATA, DELETE_CONTACTS_DATA } from "./types";


export const fetchContactsData = createAsyncThunk<
  Contact[],
  AppContext
>(
  FETCH_CONTACTS_DATA,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const contacts = await getContacts(app.authProvider!);
        return contacts;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

type deleteContactArgs = {
  app: AppContext,
  contactId: string,
}

export const deleteContactData = createAsyncThunk<
  string | false,
  deleteContactArgs
>(
  DELETE_CONTACTS_DATA,
  async ({ contactId, app }: deleteContactArgs) => {
    if (app.user) {
      try {
        await deleteContact(app.authProvider!, contactId);
        return contactId;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
        return false;
      }
    }
    return false;
  }
);