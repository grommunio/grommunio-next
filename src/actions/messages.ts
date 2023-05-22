// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { MailFolder, Message } from "microsoft-graph";
import { deleteMessage, getMailFolders, getUserMessages, moveMessage, patchMessage } from "../api/messages";
import { AppContext } from "../azure/AppContext";
import { DELETE_MESSAGE_DATA, FETCH_MAILS_DATA, FETCH_MAIL_FOLDERS_DATA, PATCH_MESSAGE_DATA } from "./types";

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

type patchMessageDataArgTypes = {
  app: AppContext,
  message: Message,
  specificProps?: any,
};

export const patchMessageData = createAsyncThunk<
  Message | boolean,
  patchMessageDataArgTypes
>(
  PATCH_MESSAGE_DATA,
  async ({app, message, specificProps}: patchMessageDataArgTypes) => {
    if (app.user) {
      try {
        const res = await patchMessage(app.authProvider!, message, specificProps);
        return res || false;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return false;
  }
);

type deleteMessageDataArgTypes = {
  app: AppContext,
  messages: Message[],
  force?: boolean,
};

export const deleteMessageData = createAsyncThunk<
  string[],
  deleteMessageDataArgTypes
>(
  DELETE_MESSAGE_DATA,
  async ({app, messages, force}: deleteMessageDataArgTypes) => {
    const succ: string[] = [];
    if (app.user) {
      for(let i = 0; i < messages.length; i++) {
        const id=messages[i].id;
        try {
          if(id) {
            await deleteMessage(app.authProvider!, id || "", force);
            succ.push(id);
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

type moveMessageDataArgTypes = {
  app: AppContext,
  messages: Message[],
  destinationId?: string,
};

export const moveMessageData = createAsyncThunk<
  string[],
  moveMessageDataArgTypes
>(
  DELETE_MESSAGE_DATA, // On success, this action simply removes the moved mails from the currently displayed list
  async ({app, messages, destinationId}: moveMessageDataArgTypes) => {
    const succ: string[] = [];
    if (app.user) {
      for(let i = 0; i < messages.length; i++) {
        const id=messages[i].id;
        try {
          if(id) {
            await moveMessage(app.authProvider!, id || "", destinationId || "");
            succ.push(id);
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