// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH
import { TodoTask, TodoTaskList } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_TASK_LISTS_DATA,
  FETCH_TASKS_DATA,
  DELETE_TASKS_DATA,
  POST_TASK_LIST_DATA,
  POST_TASK_DATA,
  DELETE_TASK_LIST_DATA,
} from '../actions/types';
import { addItem } from '../utils';

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

  case DELETE_TASK_LIST_DATA + "/fulfilled":
    return {
      ...state,
      taskLists: action.payload ? state.taskLists.filter((taskList: TodoTaskList) => taskList.id !== action.payload) : state.taskLists,
    }

  case POST_TASK_LIST_DATA:
    return {
      ...state,
      taskLists: addItem(state.taskLists, action.payload),
    }

  case POST_TASK_DATA:
    return {
      ...state,
      tasks: addItem(state.tasks, action.payload),
    }

  default:
    return state;
  }
}

export default tasksReducer;