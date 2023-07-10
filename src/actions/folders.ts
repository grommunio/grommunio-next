// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MailFolder } from "microsoft-graph";
import { FETCH_MAIL_FOLDERS_DATA, POST_MAIL_FOLDER } from "./types";
import { getMailFolders, postMailFolder } from "../api/folders";
import { defaultFetchHandler } from "./defaults";
import { pushAlertStack } from "./alerts";


export function fetchMailFoldersData(...endpointProps: []) {
  return defaultFetchHandler(getMailFolders, FETCH_MAIL_FOLDERS_DATA, ...endpointProps)
}


export function postMailFolderData(mailFolder: MailFolder, parentFolderId?: string) {
  return async (dispatch: any) => {
    try {
      const data = await postMailFolder(mailFolder, parentFolderId);
      await dispatch({ type: POST_MAIL_FOLDER, payload: data, parentFolderId });
      await dispatch(pushAlertStack());
      return data;
    } catch (error: any) {
      await dispatch(pushAlertStack({ message: error?.message || "", severity: "error" }));
      return false;
    }
  }
}