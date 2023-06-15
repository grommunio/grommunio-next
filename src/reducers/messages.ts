// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { AnyAction } from 'redux'
import {
  DELETE_MESSAGE_DATA,
  FETCH_MAILS_DATA,
  FETCH_MAIL_FOLDERS_DATA,
  PATCH_MESSAGE_DATA,
  FETCH_MESSAGE_CATEGORIES,
} from '../actions/types';
import { Message } from 'microsoft-graph';

const defaultState = {
  mails: [],
  mailFolders: [],
  categories: [],
};

function messagesReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_MAILS_DATA + "/fulfilled":
    return {
      ...state,
      mails: action.payload ?? [],
    };

  case FETCH_MAIL_FOLDERS_DATA + "/fulfilled":
    return {
      ...state,
      mailFolders: action.payload ?? [],
    };

  case DELETE_MESSAGE_DATA + "/fulfilled":
    return {
      ...state,
      mails: state.mails.filter((mail: Message) => !action.payload.includes(mail.id)),
    };
  
  case PATCH_MESSAGE_DATA + "/fulfilled":
    return {
      ...state,
      mails: state.mails.map((mail: Message) => mail.id === action.payload.id ?
        {...mail, ...action.payload} : mail),
    };

  case FETCH_MESSAGE_CATEGORIES + "/fulfilled":
    return {
      ...state,
      categories: action.payload ?? [],
    };

  default:
    return state;
  }
}

export default messagesReducer;