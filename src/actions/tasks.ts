// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { TodoTask, TodoTaskList } from "microsoft-graph";
import { deleteTask, getUserTaskLists, getUserTasks, patchTask, postTask, postTaskList, deleteTaskList } from "../api/tasks";
import { AppContext } from "../azure/AppContext";
import { DELETE_TASKS_DATA, FETCH_TASKS_DATA, FETCH_TASK_LISTS_DATA, PATCH_TASK_DATA, POST_TASK_DATA,
  POST_TASK_LIST_DATA, DELETE_TASK_LIST_DATA } from "./types";
import { defaultDeleteHandler, defaultFetchHandler, defaultPostHandler } from "./defaults";


export function fetchTaskListsData() {
  return defaultFetchHandler(getUserTaskLists, FETCH_TASK_LISTS_DATA)
}


export function fetchTasksData(taskList: TodoTaskList) {
  return defaultFetchHandler(getUserTasks, FETCH_TASKS_DATA, taskList.id)
}

export function deleteTaskData(taskId: string, taskListId: string) {
  return defaultDeleteHandler(deleteTask, DELETE_TASKS_DATA, taskId, taskListId);
}

type patchTaskDataParams = {
  app: AppContext,
  taskListId: string,
  task: TodoTask,
}

export const patchTaskData = createAsyncThunk<
  TodoTask | false,
  patchTaskDataParams
  >(
    PATCH_TASK_DATA,
    async ({ taskListId, task, app }: patchTaskDataParams) => {
      if (app.user) {
        try {
          const res = await patchTask(app.authProvider!, taskListId, task);
          return res;
        } catch (err) {
          const error = err as Error;
        app.displayError!(error.message);
        return false
        }
      }
      return false;
    }
  );

export function postTaskListData(...endpointProps: [TodoTaskList]) {
  return defaultPostHandler(postTaskList, POST_TASK_LIST_DATA, ...endpointProps)
}

export function deleteTaskListData(taskListId: string) {
  return defaultDeleteHandler(deleteTaskList, DELETE_TASK_LIST_DATA, taskListId);
}

export function postTaskData(...endpointProps: [string, TodoTask]) {
  return defaultPostHandler(postTask, POST_TASK_DATA, ...endpointProps)
}
