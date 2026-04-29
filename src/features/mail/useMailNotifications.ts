// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Message } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../store";
import { clearNewArrivals } from "./mailSlice";
import { selectInboxUnread } from "./selectors";
import { senderName } from "./utils";
import { pushAlertStack } from "../../features/alerts/alertsSlice";

// Desktop notification while the tab is hidden, a toast otherwise
export default function useMailNotifications(onOpen: (message: Message) => void) {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const unread = useTypeSelector(selectInboxUnread);
  const count = useTypeSelector(state => state.mail.newArrivals.length);
  // Only the first arrival is needed; selecting all messages would re-render on every change
  const first = useTypeSelector(state => state.mail.newArrivals[0] ? state.mail.messages[state.mail.newArrivals[0]] : undefined);
  const desktop = useTypeSelector(state => state.mail.prefs.desktopNotifications);

  useEffect(() => {
    document.title = unread ? `(${unread}) grommunio Next` : "grommunio Next";
    return () => { document.title = "grommunio Next"; };
  }, [unread]);

  useEffect(() => {
    if (count === 0) return;
    const single = count === 1 && first;
    const subject = first?.subject || t("(No subject)");

    if (desktop && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
      const body = single ? `${senderName(first)}: ${subject}` : t("{{count}} new messages", { count });
      const notification = new Notification(t("New mail"), { body, tag: "grommunio-next-mail" });
      notification.onclick = () => {
        window.focus();
        if (single) onOpen(first);
        notification.close();
      };
    } else if (single) {
      // t("{{sender}}: {{subject}}")
      dispatch(pushAlertStack({ message: "{{sender}}: {{subject}}", params: { sender: senderName(first), subject }, severity: "info" }));
    } else {
      // t("{{count}} new messages_one")
      // t("{{count}} new messages_other")
      dispatch(pushAlertStack({ message: "{{count}} new messages", params: { count }, severity: "info" }));
    }
    dispatch(clearNewArrivals());
  }, [count]);
}
