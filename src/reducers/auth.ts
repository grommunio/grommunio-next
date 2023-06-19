// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { AnyAction } from 'redux'
import {
  AUTH_LOGIN, SET_ME,
} from '../actions/types';

const defaultState = {
  authenticated: false, // TODO: Change in the future
};

function authReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case AUTH_LOGIN:
    return {
      ...state,
      authenticated: action.authenticated,
    };

  case SET_ME:
    return {
      ...state,
      authenticated: true,
    }

  default:
    return state;
  }
}

export default authReducer;