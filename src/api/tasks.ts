// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { PageCollection } from "@microsoft/microsoft-graph-client";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { TodoTask, TodoTaskList } from "microsoft-graph";
import { ensureClient, graphClient } from "./utils";

export async function getUserTaskLists(authProvider: AuthCodeMSALBrowserAuthenticationProvider): Promise<TodoTaskList[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api('/me/todo/lists')
    .get();

  return response.value;
}

export async function getUserTasks(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  tasklistID: string): Promise<TodoTask[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks')
    .get();

  return response.value;
}

export async function postTaskList(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  taskList: TodoTaskList): Promise<TodoTask> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/todo/lists')
    .post(taskList);
}

export async function postTask(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  tasklistID: string, task: TodoTask): Promise<TodoTask> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks')
    .post(task);
}

export async function deleteTask(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  tasklistID: string, taskId: string): Promise<TodoTask> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks/' + taskId)
    .delete();
}

export async function patchTask(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  tasklistID: string, task: TodoTask): Promise<TodoTask> {
  ensureClient(authProvider);
  
  return await graphClient!
    .api('/me/todo/lists/' + tasklistID + '/tasks/' + task.id)
    .patch(task);
}
