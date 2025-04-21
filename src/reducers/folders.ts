// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import { Message } from 'microsoft-graph';
import {
  FETCH_MAIL_FOLDERS_DATA,
  NEW_MESSAGE_RECEIVED,
  PATCH_BADGE_COUNT,
  POST_MAIL_FOLDER,
} from '../actions/types';
import { addItem } from '../utils';
import { COMMON_FOLDER_ORDER } from '../constants';
import { ExtendedMailFolder } from '../types/messages';

type state = {
  mailFolders: Array<ExtendedMailFolder>;
  count: number;
}

const defaultState: state = {
  mailFolders: [],
  count: 0,
};

function sortFolders(folders: Array<ExtendedMailFolder>): Array<ExtendedMailFolder> {
  const copy = [...folders];
  copy.sort((a: ExtendedMailFolder, b: ExtendedMailFolder) => {
    const orderA = COMMON_FOLDER_ORDER[a.wellKnownName] ?? 7;
    const orderB = COMMON_FOLDER_ORDER[b.wellKnownName] ?? 7;
    if (orderA !== orderB) return orderA - orderB;
    return (a.displayName || "").localeCompare(b.displayName || "");
  });
  return copy;
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

// This can be optimized. TODO: When less tired, optimize.
function recursiveTreePatch(folder: ExtendedMailFolder, isRead: boolean, folders: Array<ExtendedMailFolder>): Array<ExtendedMailFolder> {
  return (folders || []).map(f => {
    if (f.id === folder.id) {
      return {
        ...f,
        unreadItemCount: Math.max((f.unreadItemCount || 0) + (isRead ? -1 : 1), 0),
      }
    } else {
      return {
        ...f,
        childFolders: recursiveTreePatch(folder, isRead, f.childFolders as Array<ExtendedMailFolder>)
      }
    }
  });
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
      count: action.payload?.count || 0,
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
      mailFolders: state.mailFolders.map(folder => folder.wellKnownName === "inbox" ? {
        ...folder,
        unreadItemCount: (folder.unreadItemCount || 0) + action.payload.value.filter((m: Message) => !m.isRead).length,
      } : folder),
    }

  case PATCH_BADGE_COUNT: {
    return {
      ...state,
      mailFolders: recursiveTreePatch(action.folder, action.isRead, state.mailFolders)
    }
    
  }

  default:
    return state;
  }
}

export default foldersReducer;