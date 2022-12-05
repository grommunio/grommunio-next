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
