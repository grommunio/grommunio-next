// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import { Person, User } from "microsoft-graph";
import { ensureClient } from "./utils";
import { get, getAll, getBlobUrl } from "./graph";

export async function getUser(authProvider: AuthenticationProvider): Promise<User> {
  ensureClient(authProvider);
  return get<User>('/me', {
    select: ['id', 'displayName', 'givenName', 'surname', 'mail', 'userPrincipalName', 'jobTitle', 'mailboxSettings'],
  });
}

export async function getMyPhoto(): Promise<string | null> {
  return getBlobUrl("/me/photo/$value");
}

export async function getPeople(): Promise<Array<Person>> {
  return getAll<Person>('/me/people', { top: 100 });
}
