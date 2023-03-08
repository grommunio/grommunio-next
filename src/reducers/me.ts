// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { AnyAction } from 'redux'
import {
  SET_ME,
} from '../actions/types';

const defaultState = {
  displayName: "",
  givenName: "",
  jobTitle: "",
  mail: "",
  surname: ""
};

export default function meReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case SET_ME:
    return {
      ...state,
      ...action.data
    };

  default:
    return state;
  }
}
