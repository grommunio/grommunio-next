// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { TodoTask, TodoTaskList } from "microsoft-graph";
import { deleteTask, getUserTaskLists, getUserTasks, patchTask, postTask, postTaskList, deleteTaskList } from "../api/tasks";
import { DELETE_TASKS_DATA, FETCH_TASKS_DATA, FETCH_TASK_LISTS_DATA, POST_TASK_DATA,
  POST_TASK_LIST_DATA, DELETE_TASK_LIST_DATA } from "./types";
import { defaultDeleteHandler, defaultFetchHandler, defaultPatchHandler, defaultPostHandler } from "./defaults";


export function fetchTaskListsData() {
  return defaultFetchHandler(getUserTaskLists, FETCH_TASK_LISTS_DATA)
}

export function fetchTasksData(taskList: TodoTaskList) {
  return defaultFetchHandler(getUserTasks, FETCH_TASKS_DATA, taskList.id)
}

export function deleteTaskData(taskId: string, taskListId: string) {
  return defaultDeleteHandler(deleteTask, DELETE_TASKS_DATA, taskId, taskListId);
}

export function patchTaskData(task: TodoTask, taskListId: string) {
  return defaultPatchHandler(patchTask, null, task, taskListId)
}
  
export function postTaskListData(...endpointProps: [TodoTaskList]) {
  return defaultPostHandler(postTaskList, POST_TASK_LIST_DATA, ...endpointProps)
}

export function deleteTaskListData(taskListId: string) {
  return defaultDeleteHandler(deleteTaskList, DELETE_TASK_LIST_DATA, taskListId);
}

export function postTaskData(...endpointProps: [string, TodoTask]) {
  return defaultPostHandler(postTask, POST_TASK_DATA, ...endpointProps)
}
