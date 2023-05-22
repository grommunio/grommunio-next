// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { createAsyncThunk } from "@reduxjs/toolkit";
import { Person, User } from "microsoft-graph";
import { getPeople } from "../api/user";
import { AppContext } from "../azure/AppContext";
import { FETCH_PEOPLE_DATA, SET_ME } from "./types";


export const fetchPeopleData = createAsyncThunk<
  Person[],
  AppContext
>(
  FETCH_PEOPLE_DATA,
  async (app: AppContext) => {
    if (app.user) {
      try {
        const people = await getPeople(app.authProvider!);
        return people;
      } catch (err) {
        const error = err as Error;
        app.displayError!(error.message);
      }
    }
    return [];
  }
);

export function setMeData(me: User) {
  return {
    type: SET_ME,
    data: me,
  }
}