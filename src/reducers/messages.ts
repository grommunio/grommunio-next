// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { AnyAction } from 'redux'
import {
  FETCH_MAILS_DATA, FETCH_MAIL_FOLDERS_DATA,
} from '../actions/types';

const defaultState = {
  mails: [],
  mailFolders: [],
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

  default:
    return state;
  }
}

export default messagesReducer;