// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Client } from "@microsoft/microsoft-graph-client";
import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import getConfig from "../config";

export let graphClient: Client | undefined = undefined;

// SDK only sends the token to Graph hosts and customHosts, by bare hostname, https only
export function customHostsFor(baseUrl: string): Set<string> | undefined {
  try {
    return new Set([new URL(baseUrl).hostname.toLowerCase()]);
  } catch {
    return undefined;
  }
}

export function initGraphClient(authProvider: AuthenticationProvider): Client {
  const config = getConfig();
  graphClient = Client.initWithMiddleware({
    authProvider,
    baseUrl: config.graphBaseUrl,
    defaultVersion: config.graphVersion,
    customHosts: customHostsFor(config.graphBaseUrl),
  });
  return graphClient;
}

export function ensureClient(authProvider: AuthenticationProvider): Client {
  return graphClient || initGraphClient(authProvider);
}

export function resetGraphClient() {
  graphClient = undefined;
}
