// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ObjectType } from "typescript";
import { Test } from "./types/test";

const baseUrl = '//' + window.location.host + '/api/v1';

type JSONResponse = {
  data?: ObjectType;
  errors?: Array<{message: string}>
  ok: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: () => Promise<any>;
}

async function handleErrors<T>(response: JSONResponse): Promise<T> {
  if (response.ok) {
    return await response.json() as Promise<T>;
  }
  let resp = '';
  await response.json().then((json) => {
    resp = json.message;
  });
  return Promise.reject(new Error(resp));
}

export async function get<T>(path: string): Promise<T> {
  return fetch(baseUrl + path).then(response => handleErrors(response));
}

export async function getAuthUrl() {
  const data = await get<Test>('/test');
  return data;
}
