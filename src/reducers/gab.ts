// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  SET_GAB_CONTACTS_SELECTION, SET_GAB_OPEN,
} from '../actions/types';

const defaultState = {
  seletion: [],
  open: false,
};

function gabReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case SET_GAB_CONTACTS_SELECTION:
    return {
      ...state,
      seletion: action.contacts,
      open: false,
    };
  
  case SET_GAB_OPEN:
    return {
      ...state,
      open: action.open,
    }

  default:
    return state;
  }
}

export default gabReducer;