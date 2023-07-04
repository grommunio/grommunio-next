// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  FETCH_MAIL_FOLDERS_DATA,
  POST_MAIL_FOLDER,
} from '../actions/types';
import { addItem } from '../utils';
import { COMMON_FOLDER_ORDER, FOLDER_COMMONNAME_DICT_MAPPING } from '../constants';
import { ExtendedMailFolder } from '../types/messages';

type state = {
  mailFolders: Array<ExtendedMailFolder>
}

const defaultState: state = {
  mailFolders: [],
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
  })
  return folders;
}

function foldersReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_MAIL_FOLDERS_DATA:
    return {
      ...state,
      mailFolders: action.payload ? sortFolders(action.payload) : [],
    };
  case POST_MAIL_FOLDER:
    return {
      ...state,
      mailFolders: addItem(state.mailFolders, action.payload),
    }

  default:
    return state;
  }
}

export default foldersReducer;