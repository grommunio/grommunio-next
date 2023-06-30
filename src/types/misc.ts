// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { AlertColor } from "@mui/material";

export type AlertType = {
  id: number,
  message: string;
  severity?: AlertColor;
}