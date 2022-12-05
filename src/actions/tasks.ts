// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { TodoTask, TodoTaskList } from "microsoft-graph";
import { getUserTaskLists, getUserTasks } from "../api/tasks";
import { AppContext } from "../azure/AppContext";
import { FETCH_TASKS_DATA, FETCH_TASK_LISTS_DATA } from "./types";

export const fetchTaskListsData = createAsyncThunk<
  TodoTaskList[],
  AppContext
>(
  FETCH_TASK_LISTS_DATA,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const taskLists = await getUserTaskLists(app.authProvider!);
        return taskLists;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

type fetchTasksDataParams = {
  app: AppContext,
  taskList: TodoTaskList,
}

export const fetchTasksData = createAsyncThunk<
  TodoTask[],
  fetchTasksDataParams
>(
  FETCH_TASKS_DATA,
  async ({ taskList, app }: fetchTasksDataParams) => {
    if (app.user) {
      try {
        const task = await getUserTasks(app.authProvider!, taskList.id || '');
        return task;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);
