import { AuthCodeMSALBrowserAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { MailFolder } from "microsoft-graph";
import { ensureClient, graphClient } from "./utils";
import { PageCollection } from "@microsoft/microsoft-graph-client";

export async function getMailFolders(authProvider: AuthCodeMSALBrowserAuthenticationProvider): Promise<MailFolder[]> {
  ensureClient(authProvider);
  
  const response: PageCollection = await graphClient!
    .api('/me/mailFolders')
    .get();

  return response.value;
}

export async function postMailFolder(authProvider: AuthCodeMSALBrowserAuthenticationProvider,
  folder: MailFolder): Promise<MailFolder> {
  ensureClient(authProvider);

  const response = await graphClient!
    .api("/me/mailFolders")
    .post(folder);

  return response;
}

