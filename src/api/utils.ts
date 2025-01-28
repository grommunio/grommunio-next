// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Client } from "@microsoft/microsoft-graph-client";
import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import getConfig from "../config";

export let graphClient: Client | undefined = undefined;

export function initGraphClient(authProvider: AuthenticationProvider): Client {
  const config = getConfig();
  graphClient = Client.initWithMiddleware({
    authProvider,
    baseUrl: config.graphBaseUrl,
    defaultVersion: config.graphVersion,
  });
  return graphClient;
}

export function ensureClient(authProvider: AuthenticationProvider): Client {
  return graphClient || initGraphClient(authProvider);
}

export function resetGraphClient() {
  graphClient = undefined;
}
