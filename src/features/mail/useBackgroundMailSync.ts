// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Message } from "microsoft-graph";
import store, { useTypeDispatch, useTypeSelector } from "../../store";
import { findFolder, loadFolders, syncFolder } from "./mailSlice";
import { selectWellKnownFolder } from "./selectors";
import { folderSlug } from "./utils";
import useMailNotifications from "./useMailNotifications";

const SYNC_INTERVAL = 30000;
const HIDDEN_SYNC_INTERVAL = 120000;
const FOLDER_REFRESH_INTERVAL = 120000;

// Runs in every module so notifications and the unread title count work outside Mail
export default function useBackgroundMailSync() {
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const foldersLoaded = useTypeSelector(state => state.mail.foldersLoaded);
  const inboxId = useTypeSelector(state => selectWellKnownFolder("inbox")(state)?.id);

  useEffect(() => {
    if (!foldersLoaded) dispatch(loadFolders());
    const timer = setInterval(() => document.visibilityState === "visible" && dispatch(loadFolders()), FOLDER_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!inboxId) return;
    let last = 0;
    const run = () => {
      last = Date.now();
      dispatch(syncFolder(inboxId));
    };
    // Hidden tabs sync less often but still deliver desktop notifications
    const tick = () => {
      if (document.visibilityState !== "visible" && Date.now() - last < HIDDEN_SYNC_INTERVAL) return;
      run();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") run(); };
    run();
    const timer = setInterval(tick, SYNC_INTERVAL);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [inboxId]);

  const openArrival = useCallback((message: Message) => {
    const target = findFolder(store.getState().mail.folders, message.parentFolderId || undefined);
    if (target && message.id) navigate(`/mail/${folderSlug(target)}/${encodeURIComponent(message.id)}`);
  }, [navigate]);

  useMailNotifications(openArrival);
}
