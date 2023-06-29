import { now } from "moment";
import { AlertType } from "../types/misc";
import { PUSH_ALERT_STACK, SPLICE_ALERT_STACK } from "./types";

export function pushAlertStack(alert: AlertType) {
  return {
    type: PUSH_ALERT_STACK,
    alert: {
      ...alert,
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