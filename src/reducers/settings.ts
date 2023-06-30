// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  CHANGE_SETTINGS,
} from '../actions/types';

const defaultState = {
  language: 'en-US',
};

function settingsReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case CHANGE_SETTINGS:
    return {
      ...state,
      [action.field]: action.value,
    };

  default:
    return state;
  }
}

export default settingsReducer;