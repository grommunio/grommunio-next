// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { AlertColor } from "@mui/material";
import { Contact } from "microsoft-graph";

export type AlertUndo = {
  // Ids change when a message is moved
  ids: string[];
  destinationId?: string | null;
};

export type AlertType = {
  id: number,
  // Translation key or plain text
  message: string;
  params?: Record<string, string | number>;
  severity?: AlertColor;
  undo?: AlertUndo;
  duration?: number;
}

export type ContextMenuCoords = {
  top: number,
  left: number,
}

export interface Map {
  [key: string]: string | undefined
}

export interface IntMap {
  [key: string]: number | undefined
}

export type GabSelections = {
  toRecipients: Array<Contact>;
  ccRecipients: Array<Contact>;
  bccRecipients: Array<Contact>;
}