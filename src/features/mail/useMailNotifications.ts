// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTypeDispatch, useTypeSelector } from "../../store";
import { clearNewArrivals } from "./mailSlice";
import { selectInboxUnread } from "./selectors";
import { senderName } from "./utils";
import { pushAlertStack } from "../../features/alerts/alertsSlice";

// Unread count in the title, notification for new mail
export default function useMailNotifications(onOpen: (messageId: string) => void) {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const unread = useTypeSelector(selectInboxUnread);
  const arrivals = useTypeSelector(state => state.mail.newArrivals);
  const messages = useTypeSelector(state => state.mail.messages);
  const desktop = useTypeSelector(state => state.mail.prefs.desktopNotifications);

  useEffect(() => {
    document.title = unread ? `(${unread}) grommunio Next` : "grommunio Next";
    return () => { document.title = "grommunio Next"; };
  }, [unread]);

  useEffect(() => {
    if (arrivals.length === 0) return;
    const first = messages[arrivals[0]];
    const text = arrivals.length === 1 && first ?
      `${senderName(first)}: ${first.subject || t("(No subject)")}` :
      t("{{count}} new messages", { count: arrivals.length });

    if (desktop && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
      const notification = new Notification(t("New mail"), { body: text, tag: "grommunio-next-mail" });
      notification.onclick = () => {
        window.focus();
        if (arrivals.length === 1) onOpen(arrivals[0]);
        notification.close();
      };
    } else {
      dispatch(pushAlertStack({ message: text, severity: "info" }));
    }
    dispatch(clearNewArrivals());
  }, [arrivals.length]);
}
