// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { Person, User } from "microsoft-graph";
import { ensureClient, getGraphClient } from "./utils";

export async function getUser(authProvider: AuthCodeMSALBrowserAuthenticationProvider): Promise<User> {
  ensureClient(authProvider);

  // Return the /me API endpoint result as a User object
  const user: User = await getGraphClient()?.api('/me')
    // Only retrieve the specific fields needed
    .select('displayName,mail,mailboxSettings,userPrincipalName')
    .get();

  return user;
}

export async function getPeople(): Promise<Array<Person>> {
  // Return the /me/people API endpoint result as an array of Person objects
  const people: Array<Person> = await getGraphClient()?.api('/me/people')
    .get();

  return people;
}
