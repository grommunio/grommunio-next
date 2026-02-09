import { describe, expect, it } from "vitest";
import reducer, { createNote, deleteNote, loadNotes, noteSubject, setNoteColor, updateNote } from "../notesSlice";

describe("noteSubject", () => {
  it("uses the first non-empty text line and truncates", () => {
    expect(noteSubject("<p></p><p>  Shopping </p><p>milk</p>")).toBe("Shopping");
    expect(noteSubject("<p>" + "x".repeat(100) + "</p>")).toHaveLength(80);
    expect(noteSubject("<p><br></p>")).toBe("");
  });
});

describe("notes reducer", () => {
  const initial = reducer(undefined, { type: "init" });

  it("loads, creates, updates and deletes notes", () => {
    let state = reducer(initial, loadNotes.fulfilled([{ id: "a", subject: "A", lastModifiedDateTime: "2024-01-02T00:00:00Z" }], "req"));
    state = reducer(state, createNote.fulfilled({ id: "b", subject: "B", lastModifiedDateTime: "2024-01-03T00:00:00Z" }, "req", { content: "" }));
    expect(state.notes.map(n => n.id)).toEqual(["b", "a"]);
    state = reducer(state, updateNote.fulfilled({ id: "a", subject: "A2", lastModifiedDateTime: "2024-01-04T00:00:00Z" }, "req", { id: "a", content: "" }));
    expect(state.notes.map(n => n.id)).toEqual(["a", "b"]);
    state = reducer(state, setNoteColor({ id: "a", color: "green" }));
    expect(state.colors.a).toBe("green");
    state = reducer(state, deleteNote.fulfilled("a", "req", "a"));
    expect(state.notes.map(n => n.id)).toEqual(["b"]);
    expect(state.colors.a).toBeUndefined();
  });
});
