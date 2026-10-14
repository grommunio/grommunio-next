import { beforeEach, describe, expect, it, vi } from "vitest";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import type { Message } from "microsoft-graph";
import mailReducer, {
  composeClosed, createComposeState, deleteMessages, emptyFolder, loadFolders, loadMessages, messagesRemoved, moveMessages, requestDelete,
  saveDraft, sendCompose, setSelection, syncFolder, updateMessages, updatePrefs,
} from "../mailSlice";
import alertsReducer from "../../alerts/alertsSlice";
import sessionReducer from "../../session/sessionSlice";
import * as messagesApi from "../../../api/messages";
import * as foldersApi from "../../../api/folders";
import type { ExtendedMailFolder } from "../../../types/messages";

vi.mock("../../../api/messages", () => ({
  moveMessages: vi.fn(),
  deleteMessages: vi.fn(),
  patchMessage: vi.fn(),
  patchMessages: vi.fn(),
  getMessagesDelta: vi.fn(),
  createDraft: vi.fn(),
  updateDraft: vi.fn(),
  sendDraft: vi.fn(),
  sendMail: vi.fn(),
  createReply: vi.fn(),
  createForward: vi.fn(),
  deleteMessage: vi.fn(),
  getAttachments: vi.fn(),
  getMessage: vi.fn(),
  getMessagesPage: vi.fn(),
}));
vi.mock("../../../api/folders", () => ({
  getMailFolders: vi.fn(),
  getChildFolders: vi.fn(),
  emptyFolder: vi.fn(),
}));

const api = vi.mocked(messagesApi);
const folderApi = vi.mocked(foldersApi);

const FOLDERS: ExtendedMailFolder[] = [
  { id: "inbox", displayName: "Inbox", wellKnownName: "inbox", unreadItemCount: 5, childFolders: [] },
  { id: "deleted", displayName: "Deleted Items", wellKnownName: "deleteditems", childFolders: [] },
  { id: "archive", displayName: "Archive", wellKnownName: "archive", childFolders: [] },
  { id: "other", displayName: "Other", wellKnownName: "custom", unreadItemCount: 1, childFolders: [] },
];

const msg = (id: string, folder: string, extra: Partial<Message> = {}): Message =>
  ({ id, parentFolderId: folder, isRead: true, receivedDateTime: "2024-09-01T10:00:00Z", ...extra });

function makeStore() {
  const store = configureStore({
    reducer: combineReducers({ mail: mailReducer, alerts: alertsReducer, session: sessionReducer }),
    middleware: gdm => gdm({ serializableCheck: false }),
  });
  store.dispatch(loadFolders.fulfilled(FOLDERS, "init"));
  return store;
}
type TestStore = ReturnType<typeof makeStore>;
// The thunks are typed against the full RootState; the test store has the parts they use
const run = (store: TestStore, action: any) => (store.dispatch as any)(action);

function loadList(store: TestStore, folderId: string, messages: Message[], extra: { nextLink?: string } = {}) {
  const arg = { folderId };
  store.dispatch(loadMessages.pending("r-" + folderId, arg));
  store.dispatch(loadMessages.fulfilled({ key: `folder:${folderId}`, messages, total: messages.length, ...extra }, "r-" + folderId, arg));
}

beforeEach(() => {
  vi.resetAllMocks();
  folderApi.getMailFolders.mockResolvedValue({ value: FOLDERS, count: FOLDERS.length });
});

describe("moveMessages", () => {
  it("offers undo to the source folder captured before the optimistic removal", async () => {
    const store = makeStore();
    loadList(store, "inbox", [msg("a", "inbox"), msg("b", "inbox")]);
    api.moveMessages.mockResolvedValue([{ id: "0", status: 201, body: { id: "a2" } }]);
    await run(store, moveMessages({ ids: ["a"], destinationId: "archive" }));
    const alert = store.getState().alerts.stack.at(-1)!;
    expect(alert.undo).toEqual({ ids: ["a2"], destinationId: "inbox" });
    expect(alert.params).toEqual({ count: 1, folder: "Archive" });
    expect(store.getState().mail.lists["folder:inbox"].ids).toEqual(["b"]);
  });

  it("puts failed messages back at their position; missing batch responses count as failed", async () => {
    const store = makeStore();
    loadList(store, "inbox", [msg("a", "inbox"), msg("b", "inbox"), msg("c", "inbox")]);
    api.moveMessages.mockResolvedValue([{ id: "0", status: 201, body: { id: "a2" } }, { id: "1", status: 0 }]);
    await run(store, moveMessages({ ids: ["a", "b"], destinationId: "archive" }));
    const mail = store.getState().mail;
    expect(mail.lists["folder:inbox"].ids).toEqual(["b", "c"]);
    expect(mail.lists["folder:inbox"].total).toBe(2);
    expect(mail.messages.b).toBeDefined();
    expect(store.getState().alerts.stack.at(-1)).toMatchObject({ severity: "error", params: { failed: 1, count: 2 } });
  });

  it("restores everything when the request fails", async () => {
    const store = makeStore();
    loadList(store, "inbox", [msg("a", "inbox"), msg("b", "inbox")]);
    api.moveMessages.mockRejectedValue(new Error("offline"));
    await run(store, moveMessages({ ids: ["a", "b"], destinationId: "archive" }));
    expect(store.getState().mail.lists["folder:inbox"].ids).toEqual(["a", "b"]);
  });

  it("has no undo when the messages came from several folders", async () => {
    const store = makeStore();
    store.dispatch({ type: "mail/messagesReceived", payload: [msg("a", "inbox"), msg("b", "other")] });
    api.moveMessages.mockResolvedValue([{ id: "0", status: 201, body: { id: "a2" } }, { id: "1", status: 201, body: { id: "b2" } }]);
    await run(store, moveMessages({ ids: ["a", "b"], destinationId: "archive" }));
    expect(store.getState().alerts.stack.at(-1)!.undo).toBeUndefined();
  });
});

describe("deleteMessages", () => {
  it("deletes only messages in Deleted Items permanently", async () => {
    const store = makeStore();
    store.dispatch({ type: "mail/messagesReceived", payload: [msg("a", "deleted"), msg("b", "inbox")] });
    api.deleteMessages.mockImplementation(async (ids: string[]) => ids.map((_id, i) => ({ id: String(i), status: 201, body: { id: "x" + i } })));
    await run(store, deleteMessages({ ids: ["a", "b"] }));
    expect(api.deleteMessages).toHaveBeenCalledWith(["a"], true);
    expect(api.deleteMessages).toHaveBeenCalledWith(["b"], false);
    const alert = store.getState().alerts.stack.at(-1)!;
    expect(alert.params).toEqual({ count: 1 });
    expect(alert.undo?.destinationId).toBe("inbox");
  });

  it("asks for confirmation when configured or permanent", () => {
    const store = makeStore();
    store.dispatch({ type: "mail/messagesReceived", payload: [msg("a", "deleted"), msg("b", "inbox")] });
    run(store, requestDelete(["a"]));
    expect(store.getState().mail.deleteConfirm).toEqual({ ids: ["a"], permanent: false, hard: true });
    store.dispatch({ type: "mail/deleteConfirmClosed" });
    run(store, requestDelete(["b"]));
    expect(store.getState().mail.deleteConfirm).toBeNull();
    store.dispatch(updatePrefs({ confirmDelete: true }));
    run(store, requestDelete(["b"]));
    expect(store.getState().mail.deleteConfirm).toEqual({ ids: ["b"], permanent: false, hard: false });
    store.dispatch(updatePrefs({ confirmDelete: false }));
  });
});

describe("updateMessages", () => {
  it("adjusts unread counts and reverts them on failure", async () => {
    const store = makeStore();
    store.dispatch({ type: "mail/messagesReceived", payload: [msg("a", "inbox", { isRead: false })] });
    api.patchMessage.mockResolvedValue({ id: "a", isRead: true });
    await run(store, updateMessages({ ids: ["a"], props: { isRead: true } }));
    expect(store.getState().mail.folders.find(f => f.id === "inbox")!.unreadItemCount).toBe(4);

    api.patchMessage.mockRejectedValue(new Error("nope"));
    await run(store, updateMessages({ ids: ["a"], props: { isRead: false } }));
    expect(store.getState().mail.folders.find(f => f.id === "inbox")!.unreadItemCount).toBe(4);
    expect(store.getState().mail.messages.a.isRead).toBe(true);
  });
});

describe("loadMessages", () => {
  it("drops results of a superseded request", () => {
    const store = makeStore();
    store.dispatch(loadMessages.pending("first", { folderId: "inbox" }));
    store.dispatch(loadMessages.pending("second", { folderId: "inbox", filter: "unread" }));
    store.dispatch(loadMessages.fulfilled({ key: "folder:inbox", messages: [msg("old", "inbox")] }, "first", { folderId: "inbox" }));
    let list = store.getState().mail.lists["folder:inbox"];
    expect(list.loading).toBe(true);
    expect(list.ids).toEqual([]);
    store.dispatch(loadMessages.fulfilled({ key: "folder:inbox", messages: [msg("new", "inbox")] }, "second", { folderId: "inbox", filter: "unread" }));
    list = store.getState().mail.lists["folder:inbox"];
    expect(list.ids).toEqual(["new"]);
    expect(list.filter).toBe("unread");
  });
});

describe("emptyFolder", () => {
  it("removes the messages from selection and details", async () => {
    const store = makeStore();
    loadList(store, "other", [msg("a", "other"), msg("b", "other")]);
    store.dispatch(setSelection(["a"]));
    folderApi.emptyFolder.mockResolvedValue(2);
    await run(store, emptyFolder("other"));
    expect(store.getState().mail.selection).toEqual([]);
    expect(store.getState().mail.messages.a).toBeUndefined();
  });
});

describe("syncFolder", () => {
  it("keeps the delta link across reloads and inserts arrivals by date", async () => {
    const store = makeStore();
    loadList(store, "inbox", [msg("n", "inbox", { receivedDateTime: "2024-09-03T10:00:00Z" }), msg("o", "inbox", { receivedDateTime: "2024-09-01T10:00:00Z" })]);
    api.getMessagesDelta.mockResolvedValueOnce({ value: [], removed: [], deltaLink: "d1" });
    await run(store, syncFolder("inbox"));
    expect(store.getState().mail.sync.inbox.deltaLink).toBe("d1");

    // A reload keeps the delta link
    loadList(store, "inbox", [msg("n", "inbox", { receivedDateTime: "2024-09-03T10:00:00Z" }), msg("o", "inbox", { receivedDateTime: "2024-09-01T10:00:00Z" })]);
    const now = new Date().toISOString();
    api.getMessagesDelta.mockResolvedValueOnce({
      value: [msg("mid", "inbox", { receivedDateTime: "2024-09-02T10:00:00Z" }), msg("new", "inbox", { receivedDateTime: now, isRead: false })],
      removed: ["o"],
      deltaLink: "d2",
    });
    await run(store, syncFolder("inbox"));
    expect(api.getMessagesDelta).toHaveBeenLastCalledWith("inbox", "d1");
    const mail = store.getState().mail;
    expect(mail.lists["folder:inbox"].ids).toEqual(["new", "n", "mid"]);
    // Only the recent unread message is announced
    expect(mail.newArrivals).toEqual(["new"]);
  });

  it("syncs Focused/Other lists by inference classification", async () => {
    const store = makeStore();
    store.dispatch(loadMessages.pending("f", { folderId: "inbox", inference: "focused" }));
    store.dispatch(loadMessages.fulfilled({ key: "folder:inbox", messages: [msg("x", "inbox", { inferenceClassification: "focused" })] }, "f", { folderId: "inbox", inference: "focused" }));
    api.getMessagesDelta.mockResolvedValueOnce({ value: [], removed: [], deltaLink: "d1" });
    await run(store, syncFolder("inbox"));
    api.getMessagesDelta.mockResolvedValueOnce({
      value: [
        msg("f1", "inbox", { inferenceClassification: "focused", receivedDateTime: "2024-09-05T10:00:00Z" }),
        msg("o1", "inbox", { inferenceClassification: "other", receivedDateTime: "2024-09-05T10:00:00Z" }),
        msg("x", "inbox", { inferenceClassification: "other" }),
      ],
      removed: [],
      deltaLink: "d2",
    });
    await run(store, syncFolder("inbox"));
    expect(store.getState().mail.lists["folder:inbox"].ids).toEqual(["f1"]);
  });

  it("treats an expired delta link like a first sync", async () => {
    const store = makeStore();
    api.getMessagesDelta.mockResolvedValueOnce({ value: [], removed: [], deltaLink: "d1" });
    await run(store, syncFolder("inbox"));
    api.getMessagesDelta.mockResolvedValueOnce({ value: [], removed: [], deltaLink: "fresh", reset: true });
    await run(store, syncFolder("inbox"));
    expect(store.getState().mail.sync.inbox.deltaLink).toBe("fresh");
    expect(store.getState().mail.newArrivals).toEqual([]);
  });

  const recentUnread = (id: string, folder: string) => msg(id, folder, { isRead: false, receivedDateTime: new Date().toISOString() });

  it("does not bring back messages removed while the sync was in flight", async () => {
    const store = makeStore();
    loadList(store, "inbox", [recentUnread("a", "inbox")]);
    api.getMessagesDelta.mockResolvedValueOnce({ value: [], removed: [], deltaLink: "d1" });
    await run(store, syncFolder("inbox"));
    let resolve: (r: Awaited<ReturnType<typeof api.getMessagesDelta>>) => void = () => undefined;
    api.getMessagesDelta.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const sync = run(store, syncFolder("inbox"));
    store.dispatch(messagesRemoved(["a"]));
    resolve({ value: [recentUnread("a", "inbox")], removed: [], deltaLink: "d2" });
    await sync;
    expect(store.getState().mail.lists["folder:inbox"].ids).toEqual([]);
    expect(store.getState().mail.newArrivals).toEqual([]);
  });

  it("announces new mail only in the inbox and not for messages the user moved there", async () => {
    const store = makeStore();
    api.getMessagesDelta.mockResolvedValue({ value: [], removed: [], deltaLink: "d1" });
    await run(store, syncFolder("other"));
    await run(store, syncFolder("inbox"));
    api.moveMessages.mockResolvedValue([{ id: "0", status: 201, body: { id: "moved" } }]);
    await run(store, moveMessages({ ids: ["x"], destinationId: "inbox", silent: true }));
    api.getMessagesDelta.mockResolvedValue({ value: [recentUnread("junk", "other"), recentUnread("moved", "inbox")], removed: [], deltaLink: "d2" });
    await run(store, syncFolder("other"));
    await run(store, syncFolder("inbox"));
    expect(store.getState().mail.newArrivals).toEqual([]);
  });
});

describe("undo and partial failures", () => {
  it("reloads the source list when undo moves unknown messages back", async () => {
    const store = makeStore();
    loadList(store, "inbox", [msg("b", "inbox")]);
    api.moveMessages.mockResolvedValue([{ id: "0", status: 201, body: { id: "a3" } }]);
    api.getMessagesPage.mockResolvedValue({ value: [msg("a3", "inbox"), msg("b", "inbox")] });
    await run(store, moveMessages({ ids: ["a2"], destinationId: "inbox", silent: true }));
    expect(api.getMessagesPage).toHaveBeenCalledWith("inbox", expect.anything());
    await vi.waitFor(() => expect(store.getState().mail.lists["folder:inbox"].ids).toEqual(["a3", "b"]));
  });

  it("only rolls back the half of a delete that failed", async () => {
    const store = makeStore();
    loadList(store, "inbox", [msg("b", "inbox")]);
    store.dispatch({ type: "mail/messagesReceived", payload: [msg("a", "deleted")] });
    api.deleteMessages.mockImplementation(async (ids: string[], permanent: boolean) => {
      if (permanent) throw new Error("offline");
      return ids.map((_id, i) => ({ id: String(i), status: 201, body: { id: "x" + i } }));
    });
    await run(store, deleteMessages({ ids: ["a", "b"] }));
    const mail = store.getState().mail;
    expect(mail.messages.a).toBeDefined();
    expect(mail.messages.b).toBeUndefined();
    expect(mail.lists["folder:inbox"].ids).toEqual([]);
    expect(store.getState().alerts.stack.at(-1)).toMatchObject({ severity: "error", params: { failed: 1, count: 2 } });
  });
});

describe("folders", () => {
  it("refreshes subfolders below the second level", async () => {
    const store = makeStore();
    const deep: ExtendedMailFolder[] = [{ id: "inbox", displayName: "Inbox", wellKnownName: "inbox", childFolders: [
      { id: "l2", displayName: "L2", wellKnownName: "custom", parentFolderId: "inbox", childFolders: [
        { id: "l3", displayName: "L3", wellKnownName: "custom", parentFolderId: "l2", unreadItemCount: 1 },
      ] },
    ] }];
    store.dispatch(loadFolders.fulfilled(deep, "deep"));
    folderApi.getMailFolders.mockResolvedValue({ value: [{ ...deep[0], childFolders: [{ id: "l2", displayName: "L2", wellKnownName: "custom", parentFolderId: "inbox" }] }], count: 1 });
    folderApi.getChildFolders.mockResolvedValue([{ id: "l3", displayName: "L3", wellKnownName: "custom", parentFolderId: "l2", unreadItemCount: 7 }]);
    await run(store, loadFolders());
    expect(folderApi.getChildFolders).toHaveBeenCalledWith("l2");
    expect(store.getState().mail.folders[0].childFolders![0].childFolders![0].unreadItemCount).toBe(7);
  });

  it("empties folders inside Deleted Items permanently", async () => {
    const store = makeStore();
    store.dispatch(loadFolders.fulfilled([...FOLDERS.filter(f => f.id !== "deleted"),
      { id: "deleted", displayName: "Deleted Items", wellKnownName: "deleteditems", childFolders: [
        { id: "old", displayName: "Old", wellKnownName: "custom", parentFolderId: "deleted", childFolders: [] },
      ] }], "tree"));
    folderApi.emptyFolder.mockResolvedValue(0);
    await run(store, emptyFolder("old"));
    expect(folderApi.emptyFolder).toHaveBeenCalledWith("old", true);
    await run(store, emptyFolder("other"));
    expect(folderApi.emptyFolder).toHaveBeenLastCalledWith("other", false);
  });
});

describe("compose", () => {
  async function openNew(store: TestStore) {
    await run(store, createComposeState({ mode: "new" }));
  }

  it("serialises saves so only one draft is created", async () => {
    const store = makeStore();
    await openNew(store);
    let resolveCreate: (m: Message) => void = () => undefined;
    api.createDraft.mockReturnValue(new Promise(resolve => { resolveCreate = resolve; }));
    api.updateDraft.mockResolvedValue({});
    const first = run(store, saveDraft({ patch: { subject: "a" }, silent: true }));
    const second = run(store, saveDraft({ patch: { subject: "b" }, silent: true }));
    resolveCreate({ id: "draft1" });
    await Promise.all([first, second]);
    expect(api.createDraft).toHaveBeenCalledTimes(1);
    expect(api.updateDraft).toHaveBeenCalledWith("draft1", { subject: "b" });
    expect(store.getState().mail.compose?.draftId).toBe("draft1");
  });

  it("stays busy while saving as part of sending", async () => {
    const store = makeStore();
    await openNew(store);
    api.createDraft.mockResolvedValue({ id: "d" });
    await run(store, saveDraft({ patch: { subject: "a" }, silent: true }));
    let resolveUpdate: () => void = () => undefined;
    api.updateDraft.mockReturnValue(new Promise(resolve => { resolveUpdate = () => resolve({}); }));
    api.sendDraft.mockResolvedValue(undefined);
    const sending = run(store, sendCompose({ patch: { subject: "b" } }));
    await Promise.resolve();
    await Promise.resolve();
    expect(store.getState().mail.compose?.status).toBe("sending");
    resolveUpdate();
    await sending;
    expect(api.sendDraft).toHaveBeenCalledWith("d");
    expect(store.getState().mail.compose).toBeNull();
  });

  it("sends only once when send is triggered twice", async () => {
    const store = makeStore();
    await openNew(store);
    let resolveSend: () => void = () => undefined;
    api.sendMail.mockReturnValue(new Promise<void>(resolve => { resolveSend = resolve; }));
    const first = run(store, sendCompose({ patch: { subject: "a", toRecipients: [{ emailAddress: { address: "a@b.c" } }] } }));
    const second = run(store, sendCompose({ patch: { subject: "a", toRecipients: [{ emailAddress: { address: "a@b.c" } }] } }));
    resolveSend();
    await Promise.all([first, second]);
    expect(api.sendMail).toHaveBeenCalledTimes(1);
  });

  it("ignores a reply that finishes after the compose was closed", async () => {
    const store = makeStore();
    let resolveReply: (m: Message) => void = () => undefined;
    api.createReply.mockReturnValue(new Promise(resolve => { resolveReply = resolve; }));
    api.deleteMessage.mockResolvedValue(undefined);
    const pending = run(store, createComposeState({ mode: "reply", originalId: "m1" }));
    expect(store.getState().mail.compose?.status).toBe("creating");
    store.dispatch(composeClosed());
    resolveReply({ id: "reply-draft" });
    await pending;
    expect(store.getState().mail.compose).toBeNull();
    expect(api.deleteMessage).toHaveBeenCalledWith("reply-draft", true);
  });
});
