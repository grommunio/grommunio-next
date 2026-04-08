// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Alert, Button, IconButton, Slide, Stack } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertType } from "../types/misc";
import { useTypeDispatch, useTypeSelector } from "../store";
import { spliceAlertStack } from "../features/alerts/alertsSlice";
import { moveMessages } from "../features/mail/mailSlice";

const AlertStack = () => {
  const stack = useTypeSelector(state => state.alerts.stack);
  return <Stack
    sx={{
      zIndex: 1400,
      maxWidth: 440,
      position: 'fixed',
      bottom: 16,
      left: 80,
    }}
    spacing={1}
  >
    {stack.map((alert: AlertType) =>
      <AutohideAlert
        alert={alert}
        key={alert.id}
      />
    )}
  </Stack>;
}

// Default message of pushAlert:
// t("Success")
const AutohideAlert = ({ alert }: { alert: AlertType }) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const remove = () => {
    setVisible(false);
    setTimeout(() => dispatch(spliceAlertStack(alert.id)), 200);
  }

  useEffect(() => {
    timer.current = setTimeout(remove, alert.duration || (alert.undo ? 8000 : 5000));
    return () => clearTimeout(timer.current);
  }, []);

  const handleUndo = () => {
    if (alert.undo?.destinationId && alert.undo.ids.length) {
      dispatch(moveMessages({ ids: alert.undo.ids, destinationId: alert.undo.destinationId, silent: true }));
    }
    remove();
  };

  return <Slide
    direction="right"
    in={visible}
    unmountOnExit
  >
    <Alert
      variant="filled"
      severity={alert.severity}
      role={alert.severity === "error" ? "alert" : "status"}
      onFocus={() => clearTimeout(timer.current)}
      onBlur={() => { timer.current = setTimeout(remove, 3000); }}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={() => { timer.current = setTimeout(remove, 3000); }}
      action={<>
        {alert.undo && <Button color="inherit" size="small" onClick={handleUndo}>{t("Undo")}</Button>}
        <IconButton
          aria-label={t("Close")}
          color="inherit"
          size="small"
          onClick={remove}
        >
          <Close fontSize="inherit" />
        </IconButton>
      </>}
    >
      {t(alert.message || "", alert.params)}
    </Alert>
  </Slide>
}

export default AlertStack;
