import { describe, expect, it, vi } from "vitest";
import reducer, { createContact, deleteContactFolder, loadContactFolders, loadContacts } from "../contactsSlice";
import * as api from "../../../api/contacts";

vi.mock("../../../api/contacts", () => ({
  getContactFolders: vi.fn(async () => [{ id: "f1", displayName: "F1" }]),
  getContactsOfFolders: vi.fn(async () => [{ id: "c1", displayName: "A" }, { id: "c2", displayName: "B", parentFolderId: "f1" }]),
  getContactsPage: vi.fn(),
}));

describe("contacts reducer", () => {
  const initial = reducer(undefined, { type: "init" });

  it("loads All contacts from every folder", async () => {
    let state = { contacts: initial } as any;
    const dispatch = vi.fn((action: any) => { if (action?.type) state = { contacts: reducer(state.contacts, action) }; return action; });
    await loadContacts({ folderId: "all" })(dispatch as any, () => state, undefined);
    expect(api.getContactsOfFolders).toHaveBeenCalledWith(["f1"], undefined);
    expect(api.getContactsPage).not.toHaveBeenCalled();
    expect(state.contacts.lists["all|"].ids).toEqual(["c1", "c2"]);
    expect(state.contacts.lists["all|"].total).toBe(2);
  });

  it("adds contacts created in any folder to All contacts", () => {
    let state = reducer(initial, loadContacts.fulfilled({ key: "all|", contacts: [{ id: "c1", displayName: "B" }], total: 1 }, "r", { folderId: "all" }));
    state = reducer(state, loadContacts.pending("r", { folderId: "all" }));
    state = reducer(state, loadContacts.fulfilled({ key: "all|", contacts: [{ id: "c1", displayName: "B" }], total: 1 }, "r", { folderId: "all" }));
    state = reducer(state, createContact.fulfilled({ contact: { id: "c0", displayName: "A" }, folderId: "f1" }, "r", { contact: {}, folderId: "f1" }));
    expect(state.lists["all|"].ids).toEqual(["c0", "c1"]);
  });

  it("removes a deleted folder, its subfolders and their contacts", () => {
    let state = reducer(initial, loadContactFolders.fulfilled([
      { id: "f1", displayName: "F1" }, { id: "f2", displayName: "F2", parentFolderId: "f1" }, { id: "f3", displayName: "F3" },
    ], "r"));
    state = reducer(state, loadContacts.pending("r", { folderId: "all" }));
    state = reducer(state, loadContacts.fulfilled({ key: "all|", contacts: [{ id: "a", parentFolderId: "f2" }, { id: "b", parentFolderId: "f3" }], total: 2 }, "r", { folderId: "all" }));
    state = reducer(state, deleteContactFolder.fulfilled("f1", "r", "f1"));
    expect(state.folders.map(f => f.id)).toEqual(["f3"]);
    expect(state.lists["all|"].ids).toEqual(["b"]);
    expect(state.lists["all|"].total).toBe(1);
  });
});
