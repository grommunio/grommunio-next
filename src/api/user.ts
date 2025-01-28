// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import { Person, User } from "microsoft-graph";
import { ensureClient, graphClient } from "./utils";

export async function getUser(authProvider: AuthenticationProvider): Promise<User> {
  ensureClient(authProvider);

  // Return the /me API endpoint result as a User object
  const user: User = await graphClient!.api('/me')
    // Only retrieve the specific fields needed
    .select('displayName,mail,mailboxSettings,userPrincipalName')
    .get();

  return user;
}

export async function getPeople(): Promise<Array<Person>> {
  // Return the /me/people API endpoint result as an array of Person objects
  const people: Array<Person> = await graphClient!.api('/me/people')
    .get();

  return people;
}
