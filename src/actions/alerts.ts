// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { now } from "moment";
import { PUSH_ALERT_STACK, SPLICE_ALERT_STACK } from "./types";

export function pushAlertStack(alert?: any) {
  return {
    type: PUSH_ALERT_STACK,
    alert: {
      ...(alert || {}),
      message: alert?.message || "Success",
      id: now(),
    },
  }
}

export function spliceAlertStack(id: number) {
  return {
    type: SPLICE_ALERT_STACK,
    id,
  }
}