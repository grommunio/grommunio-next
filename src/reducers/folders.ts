// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  FETCH_MAIL_FOLDERS_DATA,
  NEW_MESSAGE_RECEIVED,
  POST_MAIL_FOLDER,
} from '../actions/types';
import { addItem } from '../utils';
import { COMMON_FOLDER_ORDER, FOLDER_COMMONNAME_DICT_MAPPING } from '../constants';
import { ExtendedMailFolder } from '../types/messages';

type state = {
  mailFolders: Array<ExtendedMailFolder>;
  count: number;
}

const defaultState: state = {
  mailFolders: [],
  count: 0,
};

function addCommonName(folders: Array<ExtendedMailFolder>): Array<ExtendedMailFolder> {
  folders.forEach(folder => {
    folder['wellKnownName'] = FOLDER_COMMONNAME_DICT_MAPPING[folder?.displayName || ""] || "custom";
  });
  return folders;
}

function sortFolders(folders: Array<ExtendedMailFolder>): Array<ExtendedMailFolder> {
  folders = addCommonName(folders);
  folders.sort((a: ExtendedMailFolder, b: ExtendedMailFolder) => {
    return (COMMON_FOLDER_ORDER[a["wellKnownName"]] ?? 9) - (COMMON_FOLDER_ORDER[b["wellKnownName"]] ?? 9);
  });
  return folders;
}

function addLeaf(folders:  Array<ExtendedMailFolder>, newFolder: ExtendedMailFolder, parentFolderId: string) {
  for(const folder of folders) {
    if(folder.id === parentFolderId) {
      folder.childFolders?.push(newFolder);
      return true;
    } else {
      const found = addLeaf((folder?.childFolders || []) as Array<ExtendedMailFolder>, newFolder, folder?.id || "");
      if(found) return true;
    }
  }
  return false;
}

function addTreeItem(folders:  Array<ExtendedMailFolder>, newFolder: ExtendedMailFolder, parentFolderId: string) {
  addLeaf(folders, newFolder, parentFolderId);
  return folders;
}

function foldersReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {
  case FETCH_MAIL_FOLDERS_DATA:
    return {
      ...state,
      count: action.payload ? action.payload["@odata.count"] || 0 : 0,
      mailFolders: action.payload ? sortFolders(action.payload.value) : [],
    };

  case POST_MAIL_FOLDER:
    return {
      ...state,
      mailFolders: action.parentFolderId ? 
        addTreeItem(structuredClone(state.mailFolders), action.payload, action.parentFolderId) :
        addItem(state.mailFolders, action.payload),
    };

  case NEW_MESSAGE_RECEIVED:
    return {
      ...state,
      mailFolders: [
        {
          ...state.mailFolders[0],
          unreadItemCount: state.mailFolders[0].unreadItemCount + action.payload.value.length,
        },
        ...state.mailFolders.slice(1),
      ]
    }

  default:
    return state;
  }
}

export default foldersReducer;