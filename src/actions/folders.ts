// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MailFolder } from "microsoft-graph";
import { AppContext } from "../azure/AppContext";
import { FETCH_MAIL_FOLDERS_DATA, POST_MAIL_FOLDER } from "./types";
import { getMailFolders, postMailFolder } from "../api/folders";
import { defaultFetchHandler, defaultPostHandler } from "./defaults";


export function fetchMailFoldersData(...endpointProps: []) {
  return defaultFetchHandler(getMailFolders, FETCH_MAIL_FOLDERS_DATA, ...endpointProps)
}


export function postMailFolderData(...endpointProps: [AppContext, MailFolder]) {
  return defaultPostHandler(postMailFolder, POST_MAIL_FOLDER, ...endpointProps)
}