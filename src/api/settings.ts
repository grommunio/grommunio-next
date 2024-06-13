import { MailboxSettings } from "microsoft-graph";
import { getGraphClient } from "./utils";

export async function getMailboxSettings() {
  return await getGraphClient()?.api(`/me/mailboxSettings/`)
    .get();
}

export async function patchMailboxSettings(settings: MailboxSettings): Promise<MailboxSettings> {
  
  return await getGraphClient()?.api("/me/mailboxSettings")
    .patch(settings);
}