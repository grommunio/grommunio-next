// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { MailFolder, Message } from "microsoft-graph";
import { getMailFolders, getUserMessages } from "../api/messages";
import { AppContext } from "../azure/AppContext";
import { FETCH_MAILS_DATA, FETCH_MAIL_FOLDERS_DATA } from "./types";

type fetchMessagesDataArgTypes = {
  app: AppContext,
  folderid?: string,
};

export const fetchMessagesData = createAsyncThunk<
  Message[],
  fetchMessagesDataArgTypes
>(
  FETCH_MAILS_DATA,
  async ({app, folderid}: fetchMessagesDataArgTypes) => {
    if (app.user) {
      try {
        const mails = await getUserMessages(app.authProvider!, folderid);
        return mails;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

export const fetchMailFoldersData = createAsyncThunk<
  MailFolder[],
  AppContext
>(
  FETCH_MAIL_FOLDERS_DATA,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const mails = await getMailFolders(app.authProvider!);
        return mails;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);
