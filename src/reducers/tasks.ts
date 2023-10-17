// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH
import { TodoTask, TodoTaskList } from 'microsoft-graph';
import { AnyAction } from 'redux'
import {
  FETCH_TASK_LISTS_DATA,
  FETCH_TASKS_DATA,
  DELETE_TASKS_DATA,
  POST_TASK_LIST_DATA,
  POST_TASK_DATA,
  DELETE_TASK_LIST_DATA,
  PATCH_TASK_DATA,
} from '../actions/types';
import { addItem, editItem } from '../utils';

const defaultState = {
  taskLists: [] as Array<TodoTaskList>,
  tasks: [] as Array<TodoTask>,
};

const sortTasks = (tasks: Array<TodoTask>) => {
  const copy: Array<TodoTask> = [...tasks];
  copy.sort((a, b) => {
    if(a.status !== "completed" && b.status !== "completed") {
      return 0;
    } else if(a.status == "completed") {
      return 1;
    } else return -1;
  });
  return copy;
}

function tasksReducer(state = defaultState, action: AnyAction) {
  switch (action.type) {

  case FETCH_TASK_LISTS_DATA:
    return {
      ...state,
      taskLists: action.payload ?? [],
    };
  
  case FETCH_TASKS_DATA:
    return {
      ...state,
      tasks: sortTasks(action.payload) ?? [],
    }
  
  case DELETE_TASKS_DATA:
    return {
      ...state,
      tasks: action.payload ? state.tasks.filter((task: TodoTask) => task.id !== action.payload) : state.tasks,
    }

  case DELETE_TASK_LIST_DATA:
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

  case PATCH_TASK_DATA:
    return {
      ...state,
      tasks: sortTasks(editItem(state.tasks, action.payload)),
    };

  default:
    return state;
  }
}

export default tasksReducer;