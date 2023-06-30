// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Message } from "microsoft-graph";
import { copyMessage, deleteMessage, getUserMessages, mailCategories, moveMessage, patchMessage, postMailCategory } from "../api/messages";
import { AppContext } from "../azure/AppContext";
import { DELETE_MESSAGE_DATA, FETCH_MAILS_DATA, FETCH_MESSAGE_CATEGORIES, PATCH_MESSAGE_DATA, POST_MESSAGE_CATEGORY } from "./types";
import { MessageCategory } from "../types/messages";
import { defaultFetchHandler, defaultMultiMailHandler, defaultPatchHandler, defaultPostHandler } from "./defaults";


export function fetchMessagesData(folderid = 'inbox', params={}) {
  return defaultFetchHandler(getUserMessages, FETCH_MAILS_DATA, folderid, params)
}

export function patchMessageData(message: Message, specificProps?: any) {
  return defaultPatchHandler(patchMessage, PATCH_MESSAGE_DATA, true, message, specificProps)
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
