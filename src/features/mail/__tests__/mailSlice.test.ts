import { describe, expect, it } from "vitest";
import reducer, {
  buildListParams, canSortBy, effectiveSort, filterToOData, findFolder, isInsideFolder, listKey, loadFolders, loadMessages, loadMoreMessages,
  messagesReceived, messagesRemoved, messagesRestored, setListSort, setSelection, shiftNextLink, sortToOData, toggleSelection, togglePinned,
} from "../mailSlice";
import type { ExtendedMailFolder } from "../../../types/messages";

const folders: ExtendedMailFolder[] = [
  { id: "inbox-id", displayName: "Posteingang", wellKnownName: "inbox", childFolders: [{ id: "sub", displayName: "Sub", wellKnownName: "custom", childFolders: [] }] },
  { id: "custom-id", displayName: "Zeta", wellKnownName: "custom", childFolders: [] },
  { id: "drafts-id", displayName: "Entwürfe", wellKnownName: "drafts", childFolders: [] },
];

describe("mail helpers", () => {
  it("builds list keys", () => {
    expect(listKey("abc")).toBe("folder:abc");
    expect(listKey("abc", "hello")).toBe("search:abc:hello");
    expect(listKey(undefined, "hello")).toBe("search:all:hello");
  });

  it("translates filters and sorts to OData", () => {
    expect(filterToOData("all")).toBeUndefined();
    expect(filterToOData("unread")).toBe("isRead eq false");
    expect(filterToOData("flagged")).toBe("flag/flagStatus eq 'flagged'");
    expect(filterToOData("tome", "me@x.org")).toContain("me@x.org");
    expect(filterToOData("tome", "o'neil@x.org")).toContain("o''neil@x.org");
    expect(sortToOData({ field: "from", direction: "asc" })).toBe("from/emailAddress/name asc");
    expect(sortToOData({ field: "receivedDateTime", direction: "desc" })).toBe("receivedDateTime desc");
  });

  it("finds folders recursively", () => {
    expect(findFolder(folders, "sub")?.displayName).toBe("Sub");
    expect(findFolder(folders, "nope")).toBeUndefined();
    expect(findFolder(folders, undefined)).toBeUndefined();
  });
});

describe("mail reducer", () => {
  const initial = reducer(undefined, { type: "init" });

  it("sorts well-known folders first and custom folders alphabetically", () => {
    const state = reducer(initial, loadFolders.fulfilled(folders, "req"));
    expect(state.folders.map(f => f.wellKnownName)).toEqual(["inbox", "drafts", "custom"]);
    expect(state.foldersLoaded).toBe(true);
  });

  it("stores list results and merges messages", () => {
    const arg = { folderId: "inbox-id" };
    let state = reducer(initial, loadMessages.pending("req", arg));
    expect(state.lists["folder:inbox-id"].loading).toBe(true);
    state = reducer(state, loadMessages.fulfilled({ key: "folder:inbox-id", messages: [{ id: "m1", subject: "a" }, { id: "m2", subject: "b" }], nextLink: "next", total: 2 }, "req", arg));
    expect(state.lists["folder:inbox-id"].ids).toEqual(["m1", "m2"]);
    expect(state.lists["folder:inbox-id"].nextLink).toBe("next");
    expect(state.messages.m1.subject).toBe("a");

    // A later slim update must not drop an already loaded body
    state = reducer(state, messagesReceived([{ id: "m1", body: { content: "<p>x</p>" } }]));
    state = reducer(state, messagesReceived([{ id: "m1", subject: "a2" }]));
    expect(state.messages.m1.body?.content).toBe("<p>x</p>");
    expect(state.messages.m1.subject).toBe("a2");

    state = reducer(state, messagesRemoved(["m1"]));
    expect(state.lists["folder:inbox-id"].ids).toEqual(["m2"]);
    expect(state.lists["folder:inbox-id"].total).toBe(1);
    expect(state.messages.m1).toBeUndefined();
  });

  it("manages selection and pins", () => {
    let state = reducer(initial, setSelection(["a", "b"]));
    state = reducer(state, toggleSelection("a"));
    expect(state.selection).toEqual(["b"]);
    state = reducer(state, togglePinned("x"));
    expect(state.pinned).toContain("x");
    state = reducer(state, togglePinned("x"));
    expect(state.pinned).not.toContain("x");
  });
});

describe("list paging, filters and sorts", () => {
  const initial = reducer(undefined, { type: "init" });
  const arg = { folderId: "inbox-id" };

  it("combines the Focused Inbox tab with the user filter", () => {
    expect(filterToOData("unread", undefined, "focused")).toBe("inferenceClassification eq 'focused' and isRead eq false");
    expect(filterToOData("all", undefined, "other")).toBe("inferenceClassification eq 'other'");
  });

  it("falls back to the date sort Graph supports with a filter and stores it", () => {
    const from = { field: "from" as const, direction: "asc" as const };
    expect(buildListParams({ filter: "all", sort: from })).toEqual({ filter: undefined, orderby: "from/emailAddress/name asc" });
    expect(buildListParams({ filter: "unread", sort: from }).orderby).toBe("receivedDateTime desc");
    expect(effectiveSort({ filter: "all", inference: "focused", sort: from })).toEqual({ field: "receivedDateTime", direction: "desc" });
    expect(canSortBy({ filter: "flagged" }, "receivedDateTime")).toBe(true);

    let state = reducer(initial, loadMessages.pending("r", { ...arg, inference: "focused" }));
    state = reducer(state, setListSort({ key: "folder:inbox-id", sort: from }));
    expect(state.lists["folder:inbox-id"].sort.field).toBe("receivedDateTime");
    // A filter keeps the Focused tab
    state = reducer(state, loadMessages.pending("r2", { ...arg, filter: "unread" }));
    expect(state.lists["folder:inbox-id"]).toMatchObject({ filter: "unread", inference: "focused" });
    state = reducer(state, loadMessages.pending("r3", { ...arg, inference: null }));
    expect(state.lists["folder:inbox-id"].inference).toBeUndefined();
  });

  it("shifts the $skip of the next page by removed and restored messages", () => {
    expect(shiftNextLink("https://x/messages?%24top=50&%24skip=50", -3)).toBe("https://x/messages?%24top=50&%24skip=47");
    expect(shiftNextLink("https://x/messages?$top=50&$skip=2", -5)).toBe("https://x/messages?$top=50&$skip=0");
    expect(shiftNextLink("https://x/messages?$skiptoken=abc", -1)).toBe("https://x/messages?$skiptoken=abc");

    let state = reducer(initial, loadMessages.pending("req", arg));
    state = reducer(state, loadMessages.fulfilled({ key: "folder:inbox-id", messages: [{ id: "a" }, { id: "b" }], nextLink: "u?$top=2&$skip=2" }, "req", arg));
    state = reducer(state, messagesRemoved(["a"]));
    expect(state.lists["folder:inbox-id"].nextLink).toBe("u?$top=2&$skip=1");
    state = reducer(state, messagesRestored({ messages: [{ id: "a" }], lists: [{ key: "folder:inbox-id", ids: ["a", "b"], requestId: "req" }] }));
    expect(state.lists["folder:inbox-id"].nextLink).toBe("u?$top=2&$skip=2");
    expect(state.removedIds).not.toContain("a");
  });

  it("corrects the next page for removals while a page was loading and drops removed messages", () => {
    let state = reducer(initial, loadMessages.pending("req", arg));
    state = reducer(state, loadMessages.fulfilled({ key: "folder:inbox-id", messages: [{ id: "a" }, { id: "b" }], nextLink: "u?$skip=2" }, "req", arg));
    state = reducer(state, loadMoreMessages.pending("more", "folder:inbox-id"));
    state = reducer(state, messagesRemoved(["a", "c"]));
    state = reducer(state, loadMoreMessages.fulfilled(
      { key: "folder:inbox-id", messages: [{ id: "c" }, { id: "d" }], nextLink: "u?$skip=4", requested: "u?$skip=2", requestId: "req" }, "more", "folder:inbox-id"));
    expect(state.lists["folder:inbox-id"].ids).toEqual(["b", "d"]);
    expect(state.lists["folder:inbox-id"].nextLink).toBe("u?$skip=3");
  });

  it("detects folders inside another folder", () => {
    const tree: ExtendedMailFolder[] = [
      { id: "del", wellKnownName: "deleteditems", childFolders: [{ id: "x", parentFolderId: "del", wellKnownName: "custom", childFolders: [{ id: "y", parentFolderId: "x", wellKnownName: "custom" }] }] },
      { id: "z", wellKnownName: "custom", parentFolderId: "root" },
    ];
    expect(isInsideFolder(tree, findFolder(tree, "y"), "del")).toBe(true);
    expect(isInsideFolder(tree, findFolder(tree, "z"), "del")).toBe(false);
  });
});
