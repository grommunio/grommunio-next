// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  PUSH_ALERT_STACK, SPLICE_ALERT_STACK,
} from '../actions/types';
import { AlertType } from '../types/misc';
import { addItem } from '../utils';

type AlertReducerType = {
  stack: Array<AlertType>;
}

const defaultState: AlertReducerType = {
  stack: [],
};

function alertsReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case PUSH_ALERT_STACK:
    return {
      ...state,
      stack: addItem(state.stack, action.alert),
    };

  case SPLICE_ALERT_STACK:
    return {
      ...state,
      stack: state.stack.filter((alert: AlertType) => alert.id !== action.payload)
    };

  default:
    return state;
  }
}

export default alertsReducer;