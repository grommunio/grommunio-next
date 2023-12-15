// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  CHANGE_SETTINGS,
  FETCH_MAILBOX_SETTINGS,
} from '../actions/types';

const defaultState = {
  language: 'en-US',
  mailboxSettings: {
    language: {
      locale: "en-US",
      displayName: "en_US: English",
    },
  },
};

function settingsReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case CHANGE_SETTINGS:
    return {
      ...state,
      [action.field]: action.value,
    };

  case FETCH_MAILBOX_SETTINGS:
    return {
      ...state,
      mailboxSettings: {
        ...action.payload,
      }
    };

  default:
    return state;
  }
}

export default settingsReducer;