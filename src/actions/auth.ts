// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { AUTH_LOGIN } from "./types";

export function authLogin(username: string, password: string) {
  return {
    type: AUTH_LOGIN,
    authenticated: username && password,
  }
}
