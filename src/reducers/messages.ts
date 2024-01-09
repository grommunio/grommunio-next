// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  DELETE_MESSAGE_DATA,
  FETCH_MAILS_DATA,
  PATCH_MESSAGE_DATA,
  FETCH_MESSAGE_CATEGORIES,
  POST_MESSAGE_CATEGORY,
  NEW_MESSAGE_RECEIVED,
} from '../actions/types';
import { Message } from 'microsoft-graph';
import { addItem } from '../utils';

const defaultState = {
  mails: [],
  count: 0,
  categories: [],
};

function messagesReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_MAILS_DATA: {
    const newMails = action.payload?.value ?? [];
    return {
      ...state,
      count: action.payload ? action.payload["@odata.count"] || 0 : 0,
      mails: action.skip > 0 ? [...state.mails, ...newMails] : newMails,
    };
  }

  case DELETE_MESSAGE_DATA:
    return {
      ...state,
      mails: state.mails.filter((mail: Message) => !action.payload.includes(mail.id)),
      count: state.count - 1,
    };
  
  case PATCH_MESSAGE_DATA:
    return {
      ...state,
      mails: state.mails.map((mail: Message) => mail.id === action.payload.id ?
        {...mail, ...action.payload} : mail),
    };

  case FETCH_MESSAGE_CATEGORIES:
    return {
      ...state,
      categories: action.payload ?? [],
    };

  case POST_MESSAGE_CATEGORY:
    return {
      ...state,
      categories: addItem(state.categories, action.payload),
    };

  case NEW_MESSAGE_RECEIVED: {
    const mails = [...state.mails];
    // Can't use Array<Message> here, because .unshift is crying otherwise
    const newMails: Array<never> = (action.payload?.value || []);
    mails.unshift(...newMails);
    return {
      ...state,
      mails,
      count: action.payload["@odata.count"] || mails.length,
    };
  }
    

  default:
    return state;
  }
}

export default messagesReducer;