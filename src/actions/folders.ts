import { createAsyncThunk } from "@reduxjs/toolkit";
import { MailFolder } from "microsoft-graph";
import { AppContext } from "../azure/AppContext";
import { FETCH_MAIL_FOLDERS_DATA, POST_MAIL_FOLDER } from "./types";
import { getMailFolders, postMailFolder } from "../api/folders";
import { defaultPostHandler } from "./defaults";


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


export function postMailFolderData(...endpointProps: [AppContext, MailFolder]) {
  return defaultPostHandler(postMailFolder, POST_MAIL_FOLDER, ...endpointProps)
}