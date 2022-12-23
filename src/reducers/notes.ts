// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { Message } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  DELETE_NOTES_DATA,
  FETCH_NOTES_DATA,
} from '../actions/types';

const defaultState = {
  notes: [],
};

function notesReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_NOTES_DATA + "/fulfilled":
    return {
      ...state,
      notes: action.payload ?? [],
    };

  case DELETE_NOTES_DATA + "/fulfilled":
    return {
      ...state,
      notes: action.payload ? state.notes.filter((note: Message) => note.id !== action.payload) : state.notes,
    }

  default:
    return state;
  }
}

export default notesReducer;