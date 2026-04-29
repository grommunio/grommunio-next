import { describe, expect, it } from "vitest";
import reducer, { addChecklistItem, createTask, deleteTask, loadTaskLists, loadTasks, setTaskSort, updateTask } from "../tasksSlice";

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
