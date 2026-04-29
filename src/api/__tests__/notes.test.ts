import { beforeEach, describe, expect, it, vi } from "vitest";
import * as graph from "../graph";
import { getNotes, getNotesFolderId, resetNotesFolderCache } from "../notes";

vi.mock("../graph", async () => {
  const actual = await vi.importActual<typeof import("../graph")>("../graph");
  return { ...actual, get: vi.fn(), getAll: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() };
});

const get = vi.mocked(graph.get);
const getAll = vi.mocked(graph.getAll);
const post = vi.mocked(graph.post);

describe("notes folder resolution", () => {
  beforeEach(() => {
    resetNotesFolderCache();
    vi.clearAllMocks();
  });

  it("uses the well-known name when the server supports it, once", async () => {
    get.mockResolvedValue({ id: "N1" });
    getAll.mockResolvedValue([]);
    await getNotes();
    await getNotes();
    expect(get).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenLastCalledWith("/me/mailFolders/N1/messages", expect.anything());
  });

  it("falls back to a localized top-level folder", async () => {
    get.mockRejectedValue(new graph.ApiError("not found", 404));
    getAll.mockResolvedValue([{ id: "N2", displayName: "Notizen" }]);
    expect(await getNotesFolderId()).toBe("N2");
    expect(getAll.mock.calls[0][1]?.filter).toContain("displayName eq 'Notizen'");
    expect(post).not.toHaveBeenCalled();
  });

  it("creates a hidden Notes folder as last resort and retries after failures", async () => {
    get.mockRejectedValue(new graph.ApiError("bad id", 400));
    getAll.mockRejectedValueOnce(new Error("offline"));
    await expect(getNotesFolderId()).rejects.toThrow("offline");
    getAll.mockResolvedValue([]);
    post.mockResolvedValue({ id: "N3" });
    expect(await getNotesFolderId()).toBe("N3");
    expect(post).toHaveBeenCalledWith("/me/mailFolders", { displayName: "Notes", isHidden: true });
  });
});
