// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { InteractionRequiredAuthError, PublicClientApplication } from "@azure/msal-browser";
import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import type { AppConfig } from "../config";

// Own provider instead of the Graph SDK one, so the IdP can be swapped later
export class MsalAuthenticationProvider implements AuthenticationProvider {
  constructor(private msal: PublicClientApplication, private config: AppConfig) {}

  async getAccessToken(): Promise<string> {
    const account = this.msal.getActiveAccount() || this.msal.getAllAccounts()[0];
    if (!account) {
      throw new Error("No signed-in account");
    }
    const request = { scopes: this.config.scopes, account };
    try {
      const result = await this.msal.acquireTokenSilent(request);
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        if (this.config.interactionType === "popup") {
          const result = await this.msal.acquireTokenPopup(request);
          return result.accessToken;
        }
        await this.msal.acquireTokenRedirect(request);
        // acquireTokenRedirect navigates away, this never resolves
        return new Promise(() => undefined);
      }
      throw err;
    }
  }
}
