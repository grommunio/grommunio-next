import { MailboxSettings } from "microsoft-graph";
import { graphClient, ensureClient } from "./utils";
import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";

export async function getMailboxSettings(authProvider: AuthCodeMSALBrowserAuthenticationProvider) {
  ensureClient(authProvider);
  return await graphClient!.api(`/me/mailboxSettings/`)
    .get();
}

export async function patchMailboxSettings(settings: MailboxSettings): Promise<MailboxSettings> {
  
  return await graphClient!.api("/me/mailboxSettings")
    .patch(settings);
}