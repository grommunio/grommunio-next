// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

// Read from config.json at startup so one static build fits every deployment
export type InteractionType = "redirect" | "popup";

export type AppConfig = {
  appId: string;
  authority: string;
  redirectUri: string;
  scopes: string[];
  // with trailing slash
  graphBaseUrl: string;
  graphVersion: string;
  interactionType: InteractionType;
};

export const DEFAULT_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "MailboxSettings.ReadWrite",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.ReadWrite",
  "Contacts.ReadWrite",
  "Tasks.ReadWrite",
  "People.Read",
];

const defaults: AppConfig = {
  appId: "",
  authority: "https://login.microsoftonline.com/common",
  redirectUri: window.location.origin,
  scopes: DEFAULT_SCOPES,
  graphBaseUrl: "https://graph.microsoft.com/",
  graphVersion: "v1.0",
  interactionType: "redirect",
};

let config: AppConfig = defaults;
let loaded = false;

// Fall back to defaults so a broken deployment shows an error, not a blank page
export async function loadConfig(): Promise<AppConfig> {
  if (loaded) return config;
  try {
    const response = await fetch(`${process.env.PUBLIC_URL || ""}/config.json`, { cache: "no-store" });
    if (response.ok) {
      const json = await response.json();
      config = { ...defaults, ...json };
    } else {
      console.warn(`config.json could not be loaded (${response.status}), using defaults`);
    }
  } catch (err) {
    console.warn("config.json could not be loaded, using defaults", err);
  }
  loaded = true;
  return config;
}

export default function getConfig(): AppConfig {
  return config;
}
