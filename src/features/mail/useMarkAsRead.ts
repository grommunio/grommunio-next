// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { useEffect, useRef } from "react";
import { useStore } from "react-redux";
import { RootState, useTypeDispatch, useTypeSelector } from "../../store";
import { updateMessages } from "./mailSlice";

// Each id is handled once per resetKey so "mark as unread" sticks
export default function useMarkAsRead(ids: string[], resetKey: string | undefined) {
  const dispatch = useTypeDispatch();
  const store = useStore<RootState>();
  const mode = useTypeSelector(state => state.mail.prefs.markAsRead);
  const delay = useTypeSelector(state => state.mail.prefs.markAsReadDelay);
  const handled = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    handled.current = new Set();
    const pending = timers.current;
    return () => {
      pending.forEach(timer => clearTimeout(timer));
      pending.clear();
    };
  }, [resetKey, mode, delay]);

  const key = ids.join("|");
  useEffect(() => {
    // Messages hidden before their delay ran out stay unread
    timers.current.forEach((timer, id) => {
      if (ids.includes(id)) return;
      clearTimeout(timer);
      timers.current.delete(id);
      handled.current.delete(id);
    });
    if (mode === "never") return;
    const unread = (list: string[]) => list.filter(id => {
      const current = store.getState().mail.messages[id];
      return current && !current.isRead;
    });
    const fresh = ids.filter(id => !handled.current.has(id));
    fresh.forEach(id => handled.current.add(id));
    if (mode === "onSelect") {
      const changed = unread(fresh);
      if (changed.length) dispatch(updateMessages({ ids: changed, props: { isRead: true } }));
      return;
    }
    fresh.forEach(id => timers.current.set(id, setTimeout(() => {
      timers.current.delete(id);
      if (unread([id]).length) dispatch(updateMessages({ ids: [id], props: { isRead: true } }));
    }, delay * 1000)));
  }, [key, resetKey, mode, delay]);
}
