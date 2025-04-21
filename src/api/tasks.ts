// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { ChecklistItem, TodoTask, TodoTaskList } from "microsoft-graph";
import { del, getAll, patch, post } from "./graph";

const tasksBase = (listId: string) => `/me/todo/lists/${listId}/tasks`;

export async function getUserTaskLists(): Promise<TodoTaskList[]> {
  return getAll<TodoTaskList>('/me/todo/lists', { top: 100 });
}

export async function getUserTasks(tasklistID: string): Promise<TodoTask[]> {
  return getAll<TodoTask>(tasksBase(tasklistID), { expand: "checklistItems", top: 200, orderby: "createdDateTime desc" });
}

export async function postTaskList(taskList: TodoTaskList): Promise<TodoTaskList> {
  return post<TodoTaskList>('/me/todo/lists', taskList);
}

export async function patchTaskList(taskListId: string, displayName: string): Promise<TodoTaskList> {
  return patch<TodoTaskList>('/me/todo/lists/' + taskListId, { displayName });
}

export async function deleteTaskList(taskListId: string): Promise<void> {
  return del('/me/todo/lists/' + taskListId);
}

export async function postTask(tasklistID: string, task: TodoTask): Promise<TodoTask> {
  return post<TodoTask>(tasksBase(tasklistID), task);
}

export async function deleteTask(taskId: string, tasklistID: string): Promise<void> {
  return del(tasksBase(tasklistID) + '/' + taskId);
}

export async function patchTask(task: TodoTask, tasklistID: string): Promise<TodoTask> {
  const { id, checklistItems, ...props } = task as TodoTask & { checklistItems?: ChecklistItem[] };
  void checklistItems;
  return patch<TodoTask>(tasksBase(tasklistID) + '/' + id, props);
}

export async function postChecklistItem(listId: string, taskId: string, displayName: string): Promise<ChecklistItem> {
  return post<ChecklistItem>(`${tasksBase(listId)}/${taskId}/checklistItems`, { displayName });
}

export async function patchChecklistItem(listId: string, taskId: string, item: ChecklistItem): Promise<ChecklistItem> {
  const { id, ...props } = item;
  return patch<ChecklistItem>(`${tasksBase(listId)}/${taskId}/checklistItems/${id}`, props);
}

export async function deleteChecklistItem(listId: string, taskId: string, itemId: string): Promise<void> {
  return del(`${tasksBase(listId)}/${taskId}/checklistItems/${itemId}`);
}
