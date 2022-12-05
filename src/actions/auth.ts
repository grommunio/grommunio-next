// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { AnyAction } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { getAuthUrl } from "../api";
import { AUTH_LOGIN, AUTH_URL } from "./types";

export function authLogin(username: string, password: string) {
  return {
    type: AUTH_LOGIN,
    authenticated: username && password,
  }
}

export function authGetUrl() {
  return async (dispatch: ThunkDispatch<unknown, void, AnyAction>) => {
    try {
      const authData = await getAuthUrl();
      dispatch({ type: AUTH_URL, data: authData });
    } catch (err) {
      return Promise.reject(err);
    }
  };
}