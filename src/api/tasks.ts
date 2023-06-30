// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { TodoTask, TodoTaskList } from "microsoft-graph";
import { graphClient } from "./utils";

export async function getUserTaskLists(): Promise<TodoTaskList[]> {
  const response: PageCollection = await graphClient!
    .api('/me/todo/lists')
    .get();

  return response.value;
}

export async function getUserTasks(tasklistID: string): Promise<TodoTask[]> {
  
  const response: PageCollection = await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks')
    .get();

  return response.value;
}

export async function postTaskList(taskList: TodoTaskList): Promise<TodoTask> {
  
  return await graphClient!
    .api('/me/todo/lists')
    .post(taskList);
}

export async function deleteTaskList(taskListId: string): Promise<TodoTask> {
  
  return await graphClient!
    .api('/me/todo/lists/' + taskListId)
    .delete();
}

export async function postTask(tasklistID: string, task: TodoTask): Promise<TodoTask> {
  
  return await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks')
    .post(task);
}

export async function deleteTask(taskId: string, tasklistID: string): Promise<TodoTask> {
  return await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks/' + taskId)
    .delete();
}

export async function patchTask(task: TodoTask, tasklistID: string): Promise<TodoTask> {
  
  return await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks/' + task.id)
    .patch(task);
}
