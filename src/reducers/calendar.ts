// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { AnyAction } from 'redux'
import {
  FETCH_EVENTS_DATA,
} from '../actions/types';

const defaultState = {
  events: [],
};

function calendarReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_EVENTS_DATA + "/fulfilled":
    return {
      ...state,
      events: action.payload ?? [],
    };

  default:
    return state;
  }
}

export default calendarReducer;