// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { EventType, PublicClientApplication } from "@azure/msal-browser";
import type { AuthenticationResult, EventMessage } from "@azure/msal-browser";
import type { AppConfig } from "../config";

let instance: PublicClientApplication | undefined;

// Call once before rendering
export async function createMsalInstance(config: AppConfig): Promise<PublicClientApplication> {
  const app = new PublicClientApplication({
    auth: {
      clientId: config.appId,
      authority: config.authority,
      redirectUri: config.redirectUri,
      postLogoutRedirectUri: config.redirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      // localStorage keeps the session across tabs and browser restarts
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
  });

  // msal-browser 3 requires explicit initialisation before any other call
  await app.initialize();

  const accounts = app.getAllAccounts();
  if (accounts.length > 0) {
    app.setActiveAccount(accounts[0]);
  }

  app.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult;
      app.setActiveAccount(result.account);
    }
  });

  instance = app;
  return app;
}

export function getMsalInstance(): PublicClientApplication {
  if (!instance) {
    throw new Error("MSAL has not been initialised");
  }
  return instance;
}
