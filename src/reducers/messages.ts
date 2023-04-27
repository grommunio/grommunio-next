// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { AnyAction } from 'redux'
import {
  DELETE_MESSAGE_DATA,
  FETCH_MAILS_DATA, FETCH_MAIL_FOLDERS_DATA,
} from '../actions/types';
import { Message } from 'microsoft-graph';

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

  case DELETE_MESSAGE_DATA + "/fulfilled":
    return {
      ...state,
      mails: state.mails.filter((mail: Message) => {
        console.log(action.payload, mail.id);
        // For some unknown reason '.includes' does not work here.
        let res = true;
        action.payload.forEach((id: string) => {
          if(id === mail.id) res = false;
        });
        return res;
      }),
    };

  default:
    return state;
  }
}

export default messagesReducer;