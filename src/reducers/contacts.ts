// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { Contact } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_CONTACTS_DATA,
  DELETE_CONTACTS_DATA,
  POST_CONTACT_DATA,
} from '../actions/types';
import { addItem } from '../utils';

const defaultState = {
  contacts: [],
};

function contactsReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_CONTACTS_DATA:
    return {
      ...state,
      contacts: action.payload ?? [],
    };

  case DELETE_CONTACTS_DATA:
    return {
      ...state,
      contacts: action.payload ? state.contacts.filter((contact: Contact) => contact.id !== action.payload) : state.contacts,
    };

  case POST_CONTACT_DATA:
    return {
      ...state,
      contacts: addItem(state.contacts, action.payload),
    };

  default:
    return state;
  }
}

export default contactsReducer;