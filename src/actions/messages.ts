// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "microsoft-graph";
import { copyMessage, deleteMessage, getUserMessages, mailCategories, moveMessage, patchMessage, postMailCategory } from "../api/messages";
import { AppContext } from "../azure/AppContext";
import { DELETE_MESSAGE_DATA, FETCH_MAILS_DATA, FETCH_MESSAGE_CATEGORIES, PATCH_MESSAGE_DATA, POST_MESSAGE_CATEGORY } from "./types";
import { MessageCategory } from "../types/messages";
import { defaultFetchHandler, defaultPatchHandler, defaultPostHandler } from "./defaults";


export function fetchMessagesData(folderid = 'inbox', params={}) {
  return defaultFetchHandler(getUserMessages, FETCH_MAILS_DATA, folderid, params)
}

export function patchMessageData(message: Message, specificProps?: any) {
  return defaultPatchHandler(patchMessage, PATCH_MESSAGE_DATA, true, message, specificProps)
}

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

export function copyMessageData(...endpointProps: [AppContext, string, string]) {
  return defaultPostHandler(copyMessage, null, ...endpointProps)
}

export function fetchMessageCategories(...endpointProps: []) {
  return defaultFetchHandler(mailCategories, FETCH_MESSAGE_CATEGORIES, ...endpointProps)
}

export function postMessageCategory(...endpointProps: [MessageCategory]) {
  return defaultPostHandler(postMailCategory, POST_MESSAGE_CATEGORY, ...endpointProps)
}
