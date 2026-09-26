import { beforeEach, describe, expect, it, vi } from "vitest";
import reducer, { createNote, deleteNote, loadNotes, noteSubject, setNoteColor, updateNote } from "../notesSlice";
import * as api from "../../../api/notes";
import { ApiError } from "../../../api/graph";

vi.mock("../../../api/notes", async () => {
  const actual = await vi.importActual<typeof import("../../../api/notes")>("../../../api/notes");
  return { isNonDraftUpdateError: actual.isNonDraftUpdateError, patchNote: vi.fn(), postNote: vi.fn(), deleteNote: vi.fn(), getNotes: vi.fn() };
});
const mocked = vi.mocked(api);

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
    state = reducer(state, updateNote.fulfilled({ note: { id: "a", subject: "A2", lastModifiedDateTime: "2024-01-04T00:00:00Z" } }, "req", { id: "a", content: "" }));
    expect(state.notes.map(n => n.id)).toEqual(["a", "b"]);
    state = reducer(state, setNoteColor({ id: "a", color: "green" }));
    expect(state.colors.a).toBe("green");
    state = reducer(state, deleteNote.fulfilled("a", "req", "a"));
    expect(state.notes.map(n => n.id)).toEqual(["b"]);
    expect(state.colors.a).toBeUndefined();
  });

  it("keeps load errors without marking the notes loaded", () => {
    let state = reducer(initial, loadNotes.pending("req"));
    state = reducer(state, loadNotes.rejected(null, "req", undefined, "boom"));
    expect(state.loaded).toBe(false);
    expect(state.error).toBe("boom");
    state = reducer(state, loadNotes.pending("req"));
    expect(state.error).toBeUndefined();
  });
});

describe("updateNote", () => {
  beforeEach(() => vi.clearAllMocks());

  const run = async (notes: any[], arg: { id: string; content: string }) => {
    let state = { notes: reducer(reducer(undefined, { type: "init" }), loadNotes.fulfilled(notes, "r")) } as any;
    const dispatch = vi.fn((action: any) => { if (action?.type) state = { notes: reducer(state.notes, action) }; return action; });
    const result = await updateNote(arg)(dispatch as any, () => state, undefined);
    return { result, state: state.notes, dispatch };
  };

  it("patches draft notes", async () => {
    mocked.patchNote.mockResolvedValue({ id: "a", subject: "Hi" });
    const { state } = await run([{ id: "a", isDraft: true }], { id: "a", content: "<p>Hi</p>" });
    expect(mocked.postNote).not.toHaveBeenCalled();
    expect(state.notes.map((n: any) => n.id)).toEqual(["a"]);
  });

  it("replaces a non-draft note when the PATCH is refused", async () => {
    mocked.patchNote.mockRejectedValue(new ApiError("Update not allowed on a sent message", 400, "ErrorInvalidPropertyUpdateSentMessage"));
    mocked.postNote.mockResolvedValue({ id: "b", subject: "Hi", isDraft: true });
    mocked.deleteNote.mockResolvedValue();
    const { result, state } = await run([{ id: "a", categories: ["Work"] }], { id: "a", content: "<p>Hi</p>" });
    expect(mocked.postNote).toHaveBeenCalledWith(expect.objectContaining({ subject: "Hi", categories: ["Work"] }));
    expect(mocked.deleteNote).toHaveBeenCalledWith("a");
    expect(result.payload).toEqual({ note: { id: "b", subject: "Hi", isDraft: true }, replacedId: "a" });
    expect(state.notes.map((n: any) => n.id)).toEqual(["b"]);
    expect(state.replaced).toEqual({ a: "b" });
  });

  it("replaces notes known to be non-drafts without trying to patch", async () => {
    mocked.postNote.mockResolvedValue({ id: "b" });
    mocked.deleteNote.mockResolvedValue();
    await run([{ id: "a", isDraft: false }], { id: "a", content: "<p>x</p>" });
    expect(mocked.patchNote).not.toHaveBeenCalled();
    expect(mocked.postNote).toHaveBeenCalled();
  });

  it("does not replace notes on other errors", async () => {
    mocked.patchNote.mockRejectedValue(new ApiError("Server error", 500, "InternalServerError"));
    const { result } = await run([{ id: "a" }], { id: "a", content: "<p>x</p>" });
    expect(result.type).toBe("notes/update/rejected");
    expect(mocked.postNote).not.toHaveBeenCalled();
  });
});
