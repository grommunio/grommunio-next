// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MailFolder, Message } from "microsoft-graph";
import { copyMessage, deleteMessage, getUserMessages, mailCategories, messageAttachments, moveMessage, newMessages, patchMessage, postMailCategory } from "../api/messages";
import { AppContext } from "../azure/AppContext";
import { DELETE_MESSAGE_DATA, FETCH_MAILS_DATA, FETCH_MESSAGE_CATEGORIES, PATCH_MESSAGE_DATA, POST_MESSAGE_CATEGORY,
  NEW_MESSAGE_RECEIVED, PATCH_BADGE_COUNT } from "./types";
import { MessageCategory } from "../types/messages";
import { defaultFetchHandler, defaultMultiMailHandler, defaultPostHandler } from "./defaults";
import { pushAlertStack } from "./alerts";


export function fetchMessagesData(folderid = 'inbox', params={}) {
  return defaultFetchHandler(getUserMessages, FETCH_MAILS_DATA, folderid, params)
}

export function patchMessageData(message: Message, specificProps?: any, mailFolder?: MailFolder) {
  return async (dispatch: any) => {
    try {
      // Update badge count
      if(mailFolder && specificProps.isRead !== undefined) {
        dispatch({ type: PATCH_BADGE_COUNT, folder: mailFolder, isRead: specificProps.isRead });
      }
      const resp = await patchMessage(message, specificProps);
      await dispatch({ type: PATCH_MESSAGE_DATA, payload: resp });
      return resp;
    } catch(error: any) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  };
}

export function fetchMessageAttachments(message: Message) {
  return defaultFetchHandler(messageAttachments, null, message);
}

export function deleteMessageData(messages: Array<Message>, force?: boolean) {
  return defaultMultiMailHandler(deleteMessage, DELETE_MESSAGE_DATA, messages, force)
}

export function moveMessageData(messages: Array<Message>, destinationId: string) {
  return defaultMultiMailHandler(moveMessage, DELETE_MESSAGE_DATA, messages, destinationId)
}

export function copyMessageData(...endpointProps: [AppContext, string, string]) {
  return defaultPostHandler(copyMessage, null, ...endpointProps)
}

export function fetchMessageCategories(...endpointProps: []) {
  return defaultFetchHandler(mailCategories, FETCH_MESSAGE_CATEGORIES, ...endpointProps)
}

export function postMessageCategory(...endpointProps: [MessageCategory]) {
  return defaultPostHandler(postMailCategory, POST_MESSAGE_CATEGORY, ...endpointProps)
}

export function fetchNewMessages(folderid = 'inbox') {
  return async (dispatch: any, getState: any) => {
    try {
      const data = await newMessages(folderid);
      const totalCount = data["@odata.count"];
      const localCount = getState().messages.count || 0;
      if(totalCount === localCount + 1) { // 1 new email received, data is already fetched in previous request
        await dispatch({ type: NEW_MESSAGE_RECEIVED, payload: data });
        return data;
      } else if (totalCount > localCount) {
        // This might cause issues with really unlucky timing...
        const data = await newMessages(folderid, totalCount - localCount);
        await dispatch({ type: NEW_MESSAGE_RECEIVED, payload: data });
        return data;
      }
    } catch (error) {
      return false;
    }
  }
}
