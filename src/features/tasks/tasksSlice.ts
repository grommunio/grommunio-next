// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChecklistItem, TodoTask, TodoTaskList } from "microsoft-graph";
import type { RootState } from "../../store";
import * as api from "../../api/tasks";
import { ApiError } from "../../api/graph";
import { pushAlertStack } from "../../actions/alerts";

const errorMessage = (err: unknown) => err instanceof ApiError || err instanceof Error ? err.message : String(err);
type ThunkApi = { state: RootState; rejectValue: string };

export type TaskSort = "default" | "importance" | "dueDate" | "alphabetical" | "created";

export type TasksState = {
  lists: TodoTaskList[];
  listsLoaded: boolean;
  tasks: Record<string, TodoTask[]>;
  loading: Record<string, boolean>;
  loaded: Record<string, boolean>;
  sort: TaskSort;
  showCompleted: boolean;
  error?: string;
};

export const loadTaskLists = createAsyncThunk<TodoTaskList[], void, ThunkApi>("tasks/loadLists", async (_a, { rejectWithValue }) => {
  try { return await api.getUserTaskLists(); } catch (err) { return rejectWithValue(errorMessage(err)); }
});

export const createTaskList = createAsyncThunk<TodoTaskList, string, ThunkApi>("tasks/createList", async (displayName, { dispatch, rejectWithValue }) => {
  try { return await api.postTaskList({ displayName }); } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const renameTaskList = createAsyncThunk<TodoTaskList, { id: string; displayName: string }, ThunkApi>("tasks/renameList", async ({ id, displayName }, { dispatch, rejectWithValue }) => {
  try { return await api.patchTaskList(id, displayName); } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const deleteTaskList = createAsyncThunk<string, string, ThunkApi>("tasks/deleteList", async (id, { dispatch, rejectWithValue }) => {
  try { await api.deleteTaskList(id); return id; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const loadTasks = createAsyncThunk<{ listId: string; tasks: TodoTask[] }, { listId: string; force?: boolean }, ThunkApi>(
  "tasks/loadTasks",
  async ({ listId }, { rejectWithValue }) => {
    try { return { listId, tasks: await api.getUserTasks(listId) }; } catch (err) { return rejectWithValue(errorMessage(err)); }
  },
  { condition: ({ listId, force }, { getState }) => force || (!getState().tasks.loaded[listId] && !getState().tasks.loading[listId]) },
);

export const createTask = createAsyncThunk<{ listId: string; task: TodoTask }, { listId: string; task: TodoTask }, ThunkApi>("tasks/create", async ({ listId, task }, { dispatch, rejectWithValue }) => {
  try { return { listId, task: await api.postTask(listId, task) }; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const updateTask = createAsyncThunk<{ listId: string; task: TodoTask }, { listId: string; task: TodoTask }, ThunkApi>("tasks/update", async ({ listId, task }, { dispatch, getState, rejectWithValue }) => {
  const previous = getState().tasks.tasks[listId]?.find(t => t.id === task.id);
  dispatch(tasksSlice.actions.taskPatched({ listId, task }));
  try {
    const updated = await api.patchTask(task, listId);
    return { listId, task: { ...updated, checklistItems: previous?.checklistItems } };
  } catch (err) {
    if (previous) dispatch(tasksSlice.actions.taskPatched({ listId, task: previous }));
    dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" }));
    return rejectWithValue(errorMessage(err));
  }
});

export const deleteTask = createAsyncThunk<{ listId: string; taskId: string }, { listId: string; taskId: string }, ThunkApi>("tasks/delete", async ({ listId, taskId }, { dispatch, rejectWithValue }) => {
  try { await api.deleteTask(taskId, listId); return { listId, taskId }; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const addChecklistItem = createAsyncThunk<{ listId: string; taskId: string; item: ChecklistItem }, { listId: string; taskId: string; displayName: string }, ThunkApi>("tasks/addStep", async ({ listId, taskId, displayName }, { dispatch, rejectWithValue }) => {
  try { return { listId, taskId, item: await api.postChecklistItem(listId, taskId, displayName) }; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const updateChecklistItem = createAsyncThunk<{ listId: string; taskId: string; item: ChecklistItem }, { listId: string; taskId: string; item: ChecklistItem }, ThunkApi>("tasks/updateStep", async ({ listId, taskId, item }, { dispatch, rejectWithValue }) => {
  dispatch(tasksSlice.actions.stepPatched({ listId, taskId, item }));
  try { return { listId, taskId, item: await api.patchChecklistItem(listId, taskId, item) }; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

export const deleteChecklistItem = createAsyncThunk<{ listId: string; taskId: string; itemId: string }, { listId: string; taskId: string; itemId: string }, ThunkApi>("tasks/deleteStep", async ({ listId, taskId, itemId }, { dispatch, rejectWithValue }) => {
  try { await api.deleteChecklistItem(listId, taskId, itemId); return { listId, taskId, itemId }; } catch (err) { dispatch(pushAlertStack({ message: errorMessage(err), severity: "error" })); return rejectWithValue(errorMessage(err)); }
});

const SORT_KEY = "tasks.sort";
const COMPLETED_KEY = "tasks.showCompleted";

const initialState: TasksState = {
  lists: [],
  listsLoaded: false,
  tasks: {},
  loading: {},
  loaded: {},
  sort: (window.localStorage.getItem(SORT_KEY) as TaskSort) || "default",
  showCompleted: window.localStorage.getItem(COMPLETED_KEY) !== "false",
};

const WELL_KNOWN_ORDER: Record<string, number> = { defaultList: 0, flaggedEmails: 1 };
const sortLists = (lists: TodoTaskList[]) => [...lists].sort((a, b) => {
  const oa = WELL_KNOWN_ORDER[a.wellknownListName || ""] ?? 2;
  const ob = WELL_KNOWN_ORDER[b.wellknownListName || ""] ?? 2;
  return oa !== ob ? oa - ob : (a.displayName || "").localeCompare(b.displayName || "");
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTaskSort(state, action: PayloadAction<TaskSort>) { state.sort = action.payload; window.localStorage.setItem(SORT_KEY, action.payload); },
    setShowCompleted(state, action: PayloadAction<boolean>) { state.showCompleted = action.payload; window.localStorage.setItem(COMPLETED_KEY, String(action.payload)); },
    taskPatched(state, action: PayloadAction<{ listId: string; task: TodoTask }>) {
      const { listId, task } = action.payload;
      state.tasks[listId] = (state.tasks[listId] || []).map(t => t.id === task.id ? { ...t, ...task } : t);
    },
    stepPatched(state, action: PayloadAction<{ listId: string; taskId: string; item: ChecklistItem }>) {
      const { listId, taskId, item } = action.payload;
      state.tasks[listId] = (state.tasks[listId] || []).map(t => t.id === taskId ? { ...t, checklistItems: (t.checklistItems || []).map(i => i.id === item.id ? { ...i, ...item } : i) } : t);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadTaskLists.fulfilled, (state, action) => { state.lists = sortLists(action.payload); state.listsLoaded = true; })
      .addCase(loadTaskLists.rejected, (state, action) => { state.error = action.payload || action.error.message; state.listsLoaded = true; })
      .addCase(createTaskList.fulfilled, (state, action) => { state.lists = sortLists([...state.lists, action.payload]); })
      .addCase(renameTaskList.fulfilled, (state, action) => { state.lists = sortLists(state.lists.map(l => l.id === action.payload.id ? { ...l, ...action.payload } : l)); })
      .addCase(deleteTaskList.fulfilled, (state, action) => {
        state.lists = state.lists.filter(l => l.id !== action.payload);
        delete state.tasks[action.payload];
        delete state.loaded[action.payload];
      })
      .addCase(loadTasks.pending, (state, action) => { state.loading[action.meta.arg.listId] = true; })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.tasks[action.payload.listId] = action.payload.tasks;
        state.loaded[action.payload.listId] = true;
        delete state.loading[action.payload.listId];
      })
      .addCase(loadTasks.rejected, (state, action) => { delete state.loading[action.meta.arg.listId]; state.loaded[action.meta.arg.listId] = true; state.error = action.payload || action.error.message; })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks[action.payload.listId] = [{ ...action.payload.task, checklistItems: [] }, ...(state.tasks[action.payload.listId] || [])];
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const { listId, task } = action.payload;
        state.tasks[listId] = (state.tasks[listId] || []).map(t => t.id === task.id ? { ...t, ...task } : t);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks[action.payload.listId] = (state.tasks[action.payload.listId] || []).filter(t => t.id !== action.payload.taskId);
      })
      .addCase(addChecklistItem.fulfilled, (state, action) => {
        const { listId, taskId, item } = action.payload;
        state.tasks[listId] = (state.tasks[listId] || []).map(t => t.id === taskId ? { ...t, checklistItems: [...(t.checklistItems || []), item] } : t);
      })
      .addCase(updateChecklistItem.fulfilled, (state, action) => {
        const { listId, taskId, item } = action.payload;
        state.tasks[listId] = (state.tasks[listId] || []).map(t => t.id === taskId ? { ...t, checklistItems: (t.checklistItems || []).map(i => i.id === item.id ? item : i) } : t);
      })
      .addCase(deleteChecklistItem.fulfilled, (state, action) => {
        const { listId, taskId, itemId } = action.payload;
        state.tasks[listId] = (state.tasks[listId] || []).map(t => t.id === taskId ? { ...t, checklistItems: (t.checklistItems || []).filter(i => i.id !== itemId) } : t);
      });
  },
});

export const { setTaskSort, setShowCompleted } = tasksSlice.actions;
export default tasksSlice.reducer;
