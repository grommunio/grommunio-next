// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { AlertColor } from "@mui/material";

export type AlertType = {
  id: number,
  message: string;
  severity?: AlertColor;
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