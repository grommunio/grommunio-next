import { createAsyncThunk } from "@reduxjs/toolkit";
import { MailFolder } from "microsoft-graph";
import { AppContext } from "../azure/AppContext";
import { FETCH_MAIL_FOLDERS_DATA, POST_MAIL_FOLDER } from "./types";
import { getMailFolders, postMailFolder } from "../api/folders";


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


type postMailFolderDataProps = {
  app: AppContext,
  folder: MailFolder,
}

export const postMailFolderData = createAsyncThunk<
  MailFolder | boolean,
  postMailFolderDataProps
>(
  POST_MAIL_FOLDER,
  async ({app, folder}: postMailFolderDataProps, { rejectWithValue }) => {
    if (app.user) {
      try {
        const result = await postMailFolder(app.authProvider!, folder);
        return result;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
        return rejectWithValue(error.message);
      }
    }
    return false;
  }
);