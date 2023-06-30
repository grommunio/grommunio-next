// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { Message } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  DELETE_NOTES_DATA,
  FETCH_NOTES_DATA,
  POST_NOTE_DATA,
} from '../actions/types';
import { addItem } from '../utils';

const defaultState = {
  notes: [],
};

function notesReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_NOTES_DATA:
    return {
      ...state,
      notes: action.payload ?? [],
    };

  case DELETE_NOTES_DATA:
    return {
      ...state,
      notes: action.payload ? state.notes.filter((note: Message) => note.id !== action.payload) : state.notes,
    }

  case POST_NOTE_DATA:
    return {
      ...state,
      notes: addItem(state.notes, action.payload),
    }

  default:
    return state;
  }
}

export default notesReducer;