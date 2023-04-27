// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { MailFolder, Message } from "microsoft-graph";
import { deleteMessage, getMailFolders, getUserMessages } from "../api/messages";
import { AppContext } from "../azure/AppContext";
import { DELETE_MESSAGE_DATA, FETCH_MAILS_DATA, FETCH_MAIL_FOLDERS_DATA } from "./types";

type fetchMessagesDataArgTypes = {
  app: AppContext,
  folderid?: string,
  params?: any,
};

export const fetchMessagesData = createAsyncThunk<
  Message[],
  fetchMessagesDataArgTypes
>(
  FETCH_MAILS_DATA,
  async ({app, folderid, params}: fetchMessagesDataArgTypes) => {
    if (app.user) {
      try {
        const mails = await getUserMessages(app.authProvider!, folderid, params);
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

type deleteMessageDataArgTypes = {
  app: AppContext,
  messages: Message[],
};

export const deleteMessageData = createAsyncThunk<
  string[],
  deleteMessageDataArgTypes
>(
  DELETE_MESSAGE_DATA,
  async ({app, messages}: deleteMessageDataArgTypes) => {
    const succ: string[] = [];
    if (app.user) {
      for(let i = 0; i < messages.length; i++) {
        const id=messages[i].id;
        try {
          if(id) {
            await deleteMessage(app.authProvider!, id || "");
            succ.push(id)
          }
        } catch (err) {
          const error = err as Error;
          app.displayError!(error.message);
        }
      }
    }
    return succ;
  }
);
