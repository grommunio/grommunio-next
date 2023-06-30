// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { AnyAction } from 'redux'
import {
  FETCH_PEOPLE_DATA,
} from '../actions/types';

const defaultState = {
  people: [],
};

export function userReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_PEOPLE_DATA:
    return {
      ...state,
      people: action.payload ?? [],
    };

  default:
    return state;
  }
}
