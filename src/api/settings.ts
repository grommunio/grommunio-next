import { MailboxSettings } from "microsoft-graph";
import { graphClient } from "./utils";

export async function getMailboxSettings() {
  return await graphClient!.api(`/me/mailboxSettings/`)
    .get();
}

export async function patchMailboxSettings(settings: MailboxSettings): Promise<MailboxSettings> {
  
  return await graphClient!
    .api("/me/mailboxSettings")
    .patch(settings);
}