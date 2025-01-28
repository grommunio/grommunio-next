// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { EventType, PublicClientApplication } from "@azure/msal-browser";
import type { AuthenticationResult, EventMessage } from "@azure/msal-browser";
import type { AppConfig } from "../config";

let instance: PublicClientApplication | undefined;

// Call once before rendering
export function createMsalInstance(config: AppConfig): PublicClientApplication {
  instance = new PublicClientApplication({
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

  const accounts = instance.getAllAccounts();
  if (accounts.length > 0) {
    instance.setActiveAccount(accounts[0]);
  }

  instance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult;
      instance?.setActiveAccount(result.account);
    }
  });

  return instance;
}

export function getMsalInstance(): PublicClientApplication {
  if (!instance) {
    throw new Error("MSAL has not been initialised");
  }
  return instance;
}
