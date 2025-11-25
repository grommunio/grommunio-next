// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { useCallback, useMemo } from "react";
import type { Message, OutlookCategory } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../store";
import {
  copyMessages, createFolder, deleteMessages, moveMessages, startCompose, togglePinned, updateMessages, findWellKnownFolder,
} from "./mailSlice";
import { pushAlertStack } from "../../features/alerts/alertsSlice";
import { getMessageSource } from "../../api/messages";
import { buildPrintDocument, printHtml } from "./utils";

// Shared by toolbar, context menu and shortcuts
export default function useMailActions(ids: string[]) {
  const dispatch = useTypeDispatch();
  const folders = useTypeSelector(state => state.mail.folders);
  const messages = useTypeSelector(state => state.mail.messages);

  const targets = useMemo(() => ids.map(id => messages[id]).filter(Boolean) as Message[], [ids, messages]);
  const first = targets[0];

  const allRead = targets.length > 0 && targets.every(m => m.isRead);
  const allFlagged = targets.length > 0 && targets.every(m => m.flag?.flagStatus === "flagged");
  const appliedCategories = useMemo(() => {
    if (targets.length === 0) return [];
    return (targets[0].categories || []).filter(c => targets.every(m => m.categories?.includes(c)));
  }, [targets]);

  const wellKnown = (name: Parameters<typeof findWellKnownFolder>[1]) => findWellKnownFolder(folders, name)?.id;

  const remove = useCallback((permanent = false) => {
    if (ids.length) dispatch(deleteMessages({ ids, permanent }));
  }, [dispatch, ids]);

  const archive = useCallback(() => {
    const archiveId = wellKnown("archive");
    if (!archiveId) {
      dispatch(pushAlertStack({ message: "This mailbox has no archive folder", severity: "warning" }));
      return;
    }
    if (ids.length) dispatch(moveMessages({ ids, destinationId: archiveId }));
  }, [dispatch, ids, folders]);

  const junk = useCallback(() => {
    const inJunk = first?.parentFolderId && first.parentFolderId === wellKnown("junkemail");
    const destination = inJunk ? wellKnown("inbox") : wellKnown("junkemail");
    if (destination && ids.length) dispatch(moveMessages({ ids, destinationId: destination }));
  }, [dispatch, ids, folders, first]);

  const move = useCallback((destinationId: string) => {
    if (ids.length) dispatch(moveMessages({ ids, destinationId }));
  }, [dispatch, ids]);

  const copy = useCallback((destinationId: string) => {
    if (ids.length) dispatch(copyMessages({ ids, destinationId }));
  }, [dispatch, ids]);

  const moveToNewFolder = useCallback(async (displayName: string) => {
    const result = await dispatch(createFolder({ displayName }));
    if (createFolder.fulfilled.match(result) && result.payload.folder.id) {
      dispatch(moveMessages({ ids, destinationId: result.payload.folder.id }));
    }
  }, [dispatch, ids]);

  const setRead = useCallback((isRead: boolean) => {
    const changed = targets.filter(m => Boolean(m.isRead) !== isRead).map(m => m.id!);
    if (changed.length) dispatch(updateMessages({ ids: changed, props: { isRead } }));
  }, [dispatch, targets]);

  const toggleRead = useCallback(() => setRead(!allRead), [setRead, allRead]);

  const setFlag = useCallback((flagged: boolean) => {
    if (ids.length) dispatch(updateMessages({ ids, props: { flag: { flagStatus: flagged ? "flagged" : "notFlagged" } } }));
  }, [dispatch, ids]);

  const toggleFlag = useCallback(() => setFlag(!allFlagged), [setFlag, allFlagged]);

  const toggleCategory = useCallback((category: OutlookCategory) => {
    const name = category.displayName || "";
    const remove = appliedCategories.includes(name);
    targets.forEach(m => {
      const current = m.categories || [];
      const next = remove ? current.filter(c => c !== name) : current.includes(name) ? current : [...current, name];
      dispatch(updateMessages({ ids: [m.id!], props: { categories: next } }));
    });
  }, [dispatch, targets, appliedCategories]);

  const clearCategories = useCallback(() => {
    if (ids.length) dispatch(updateMessages({ ids, props: { categories: [] } }));
  }, [dispatch, ids]);

  const togglePin = useCallback(() => {
    ids.forEach(id => dispatch(togglePinned(id)));
  }, [dispatch, ids]);

  const setImportance = useCallback((importance: "high" | "normal" | "low") => {
    if (ids.length) dispatch(updateMessages({ ids, props: { importance } }));
  }, [dispatch, ids]);

  const reply = useCallback(() => { if (first?.id) dispatch(startCompose({ mode: "reply", originalId: first.id })); }, [dispatch, first]);
  const replyAll = useCallback(() => { if (first?.id) dispatch(startCompose({ mode: "replyAll", originalId: first.id })); }, [dispatch, first]);
  const forward = useCallback(() => { if (first?.id) dispatch(startCompose({ mode: "forward", originalId: first.id })); }, [dispatch, first]);

  const print = useCallback((bodyHtml: string) => {
    if (first) printHtml(buildPrintDocument(first, bodyHtml));
  }, [first]);

  const viewSource = useCallback(async () => {
    if (!first?.id) return;
    try {
      const source = await getMessageSource(first.id);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<pre style="white-space:pre-wrap;font:12px monospace;padding:16px">${source.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string))}</pre>`);
        win.document.title = first.subject || "Message source";
        win.document.close();
      }
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err?.message || String(err), severity: "error" }));
    }
  }, [first, dispatch]);

  return {
    targets, first, allRead, allFlagged, appliedCategories,
    remove, archive, junk, move, copy, moveToNewFolder, setRead, toggleRead, setFlag, toggleFlag,
    toggleCategory, clearCategories, togglePin, setImportance, reply, replyAll, forward, print, viewSource,
    isJunkFolder: Boolean(first?.parentFolderId && first.parentFolderId === wellKnown("junkemail")),
    isDeletedFolder: Boolean(first?.parentFolderId && first.parentFolderId === wellKnown("deleteditems")),
  };
}
