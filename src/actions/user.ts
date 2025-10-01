// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { User } from "microsoft-graph";
import { SET_ME } from "./types";

export function setMeData(me: User | null) {
  return {
    type: SET_ME,
    data: me,
  }
}
