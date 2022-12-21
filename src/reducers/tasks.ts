// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { TodoTask } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
    FETCH_TASK_LISTS_DATA,
    FETCH_TASKS_DATA,
    DELETE_TASKS_DATA
} from '../actions/types';

const defaultState = {
  taskLists: [],
  tasks: [],
};

function tasksReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_TASK_LISTS_DATA + "/fulfilled":
    return {
      ...state,
      taskLists: action.payload ?? [],
    };
  
  case FETCH_TASKS_DATA + "/fulfilled":
    return {
      ...state,
      tasks: action.payload ?? [],
    }
  
  case DELETE_TASKS_DATA + "/fulfilled":
    return {
      ...state,
      tasks: action.payload ? state.tasks.filter((task: TodoTask) => task.id !== action.payload) : state.tasks,
    }

  default:
    return state;
  }
}

export default tasksReducer;