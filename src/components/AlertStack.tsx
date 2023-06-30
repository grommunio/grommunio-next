// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Alert, IconButton, Slide, Stack } from "@mui/material";
import { AlertType } from "../types/misc";
import { useTypeDispatch, useTypeSelector } from "../store";
import { spliceAlertStack } from "../actions/alerts";
import { Close } from "@mui/icons-material";
import { useEffect, useState } from "react";

const AlertStack = () => {
  const stack = useTypeSelector(state => state.alerts.stack);
  return <Stack
    style={{
      zIndex: 1400,
      maxWidth: 400,
      position: 'fixed',
      bottom: 8,
      left: 100,
    }}
    spacing={1}
  >
    {stack.map((alert: AlertType, key: number) =>
      <AutohideAlert
        alert={alert}
        key={key}
      />
    )}
  </Stack>;
}

const AutohideAlert = ({alert}: any) => {
  const dispatch = useTypeDispatch();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setTimeout(remove, 5000);
  }, []);

  const remove = () => {
    setVisible(false);
    setTimeout(() => dispatch(spliceAlertStack(alert.id)), 200);
  }
  
  return <Slide
    direction="right"
    in={visible}
    unmountOnExit
  >
    <Alert
      variant="filled"
      severity={alert.severity}
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={remove}
        >
          <Close fontSize="inherit" />
        </IconButton>
      }
    >
      {alert.message || ""}
    </Alert>
  </Slide>
}

export default AlertStack;