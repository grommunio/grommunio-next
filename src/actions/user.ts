// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { User } from "microsoft-graph";
import { getPeople } from "../api/user";
import { FETCH_PEOPLE_DATA, SET_ME } from "./types";
import { defaultFetchHandler } from "./defaults";


export function fetchPeopleData() {
  return defaultFetchHandler(getPeople, FETCH_PEOPLE_DATA)
}

export function setMeData(me: User | null) {
  return {
    type: SET_ME,
    data: me,
  }
}