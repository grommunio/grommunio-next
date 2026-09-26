import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../api/tasks";
import { taskNotesText } from "../taskNotes";
import reducer, { addChecklistItem, createTask, deleteTask, loadTaskLists, loadTasks, setTaskSort, updateTask } from "../tasksSlice";

vi.mock("../../../api/tasks", () => ({ patchTask: vi.fn(), getUserTasks: vi.fn(async () => []) }));
const mocked = vi.mocked(api);

describe("tasks reducer", () => {
  const initial = reducer(undefined, { type: "init" });

  it("orders the well-known lists first", () => {
    const state = reducer(initial, loadTaskLists.fulfilled([
      { id: "c", displayName: "Zeta" },
      { id: "f", displayName: "Flagged", wellknownListName: "flaggedEmails" },
      { id: "a", displayName: "Alpha" },
      { id: "d", displayName: "Tasks", wellknownListName: "defaultList" },
    ], "req"));
    expect(state.lists.map(l => l.id)).toEqual(["d", "f", "a", "c"]);
  });

  it("tracks tasks per list and keeps steps across updates", () => {
    let state = reducer(initial, loadTasks.fulfilled({ listId: "L", tasks: [{ id: "t1", title: "one", checklistItems: [{ id: "s1", displayName: "step" }] }] }, "req", { listId: "L" }));
    expect(state.loaded.L).toBe(true);
    state = reducer(state, updateTask.fulfilled({ listId: "L", task: { id: "t1", status: "completed", checklistItems: state.tasks.L[0].checklistItems } }, "req", { listId: "L", task: { id: "t1" } }));
    expect(state.tasks.L[0].status).toBe("completed");
    expect(state.tasks.L[0].checklistItems).toHaveLength(1);
    state = reducer(state, addChecklistItem.fulfilled({ listId: "L", taskId: "t1", item: { id: "s2", displayName: "two" } }, "req", { listId: "L", taskId: "t1", displayName: "two" }));
    expect(state.tasks.L[0].checklistItems).toHaveLength(2);
    state = reducer(state, createTask.fulfilled({ listId: "L", task: { id: "t2", title: "new" } }, "req", { listId: "L", task: {} }));
    expect(state.tasks.L[0].id).toBe("t2");
    state = reducer(state, deleteTask.fulfilled({ listId: "L", taskId: "t1" }, "req", { listId: "L", taskId: "t1" }));
    expect(state.tasks.L.map(t => t.id)).toEqual(["t2"]);
  });

  it("keeps load errors per list instead of marking the list loaded", () => {
    let state = reducer(initial, loadTasks.pending("req", { listId: "L" }));
    state = reducer(state, loadTasks.rejected(null, "req", { listId: "L" }, "boom"));
    expect(state.loaded.L).toBeUndefined();
    expect(state.loading.L).toBeUndefined();
    expect(state.errors.L).toBe("boom");
    state = reducer(state, loadTasks.pending("req", { listId: "L", force: true }));
    expect(state.errors.L).toBeUndefined();
    state = reducer(state, loadTaskLists.rejected(null, "req", undefined, "nope"));
    expect(state.listsError).toBe("nope");
  });

  it("persists the sort preference", () => {
    const state = reducer(initial, setTaskSort("dueDate"));
    expect(state.sort).toBe("dueDate");
    expect(window.localStorage.getItem("tasks.sort")).toBe("dueDate");
  });
});

describe("updateTask", () => {
  beforeEach(() => vi.clearAllMocks());

  const setup = (task: any) => {
    let state = { tasks: reducer(reducer(undefined, { type: "init" }), loadTasks.fulfilled({ listId: "L", tasks: [task] }, "r", { listId: "L" })) } as any;
    const dispatch = vi.fn((action: any) => {
      if (typeof action === "function") return action(dispatch, () => state, undefined);
      if (action?.type) state = { tasks: reducer(state.tasks, action) };
      return action;
    });
    return { dispatch, getState: () => state };
  };

  it("keeps steps added while the PATCH is in flight", async () => {
    const { dispatch, getState } = setup({ id: "t1", title: "a", checklistItems: [{ id: "s1" }] });
    let resolve: (t: any) => void = () => {};
    mocked.patchTask.mockReturnValue(new Promise(r => { resolve = r; }));
    const pending = updateTask({ listId: "L", task: { id: "t1", title: "b" } })(dispatch as any, getState, undefined);
    dispatch(addChecklistItem.fulfilled({ listId: "L", taskId: "t1", item: { id: "s2" } }, "r", { listId: "L", taskId: "t1", displayName: "x" }));
    resolve({ id: "t1", title: "b" });
    await pending;
    expect(getState().tasks.tasks.L[0].title).toBe("b");
    expect(getState().tasks.tasks.L[0].checklistItems.map((s: any) => s.id)).toEqual(["s1", "s2"]);
  });

  it("rolls back only the patched fields", async () => {
    const { dispatch, getState } = setup({ id: "t1", title: "a", importance: "normal", checklistItems: [] });
    mocked.patchTask.mockRejectedValue(new Error("boom"));
    const pending = updateTask({ listId: "L", task: { id: "t1", importance: "high" } })(dispatch as any, getState, undefined);
    dispatch(addChecklistItem.fulfilled({ listId: "L", taskId: "t1", item: { id: "s2" } }, "r", { listId: "L", taskId: "t1", displayName: "x" }));
    await pending;
    expect(getState().tasks.tasks.L[0].importance).toBe("normal");
    expect(getState().tasks.tasks.L[0].checklistItems).toHaveLength(1);
  });

  it("reloads the list after completing a recurring task", async () => {
    const { dispatch, getState } = setup({ id: "t1", status: "notStarted", recurrence: { pattern: { type: "daily", interval: 1 } } });
    mocked.patchTask.mockResolvedValue({ id: "t1", status: "completed" });
    await updateTask({ listId: "L", task: { id: "t1", status: "completed" } })(dispatch as any, getState, undefined);
    expect(mocked.getUserTasks).toHaveBeenCalledWith("L");
  });

  it("does not reload for non-recurring tasks", async () => {
    const { dispatch, getState } = setup({ id: "t1", status: "notStarted" });
    mocked.patchTask.mockResolvedValue({ id: "t1", status: "completed" });
    await updateTask({ listId: "L", task: { id: "t1", status: "completed" } })(dispatch as any, getState, undefined);
    expect(mocked.getUserTasks).not.toHaveBeenCalled();
  });
});

describe("taskNotesText", () => {
  it("returns text bodies unchanged and converts HTML bodies to text", () => {
    expect(taskNotesText({ contentType: "text", content: "a <b>" })).toBe("a <b>");
    expect(taskNotesText({ contentType: "html", content: "<html><head><style>p{}</style></head><body><p>One</p><p>Two<br>Three &amp; four</p><script>x()</script></body></html>" })).toBe("One\nTwo\nThree & four");
    expect(taskNotesText(undefined)).toBe("");
  });
});
