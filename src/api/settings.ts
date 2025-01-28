import { MailboxSettings } from "microsoft-graph";
import { graphClient, ensureClient } from "./utils";
import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";

export async function getMailboxSettings(authProvider: AuthenticationProvider) {
  ensureClient(authProvider);
  return await graphClient!.api(`/me/mailboxSettings/`)
    .get();
}

export async function patchMailboxSettings(settings: MailboxSettings): Promise<MailboxSettings> {
  
  return await graphClient!.api("/me/mailboxSettings")
    .patch(settings);
}