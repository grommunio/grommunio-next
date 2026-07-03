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
  "Calendars.Read.Shared",
  "Contacts.ReadWrite",
  "Tasks.ReadWrite",
  "People.Read",
];

// Base path so sub-path deployments get the auth response.
// Root deployments keep the bare origin existing registrations use.
const defaultRedirectUri = (): string =>
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== "/"
    ? new URL(import.meta.env.BASE_URL, window.location.origin).href
    : window.location.origin;

const defaults: AppConfig = {
  appId: "",
  authority: "https://login.microsoftonline.com/common",
  redirectUri: defaultRedirectUri(),
  scopes: DEFAULT_SCOPES,
  graphBaseUrl: "https://graph.microsoft.com/",
  graphVersion: "v1.0",
  interactionType: "redirect",
};

let config: AppConfig = defaults;
let loaded = false;

export function validateConfig(value: AppConfig): AppConfig {
  const problems: string[] = [];
  const isUrl = (s: unknown) => { try { return typeof s === "string" && Boolean(new URL(s)); } catch { return false; } };
  if (typeof value.appId !== "string") problems.push("appId must be a string");
  for (const key of ["authority", "redirectUri", "graphBaseUrl"] as const) {
    if (!isUrl(value[key])) problems.push(`${key} must be an absolute URL`);
  }
  if (!Array.isArray(value.scopes) || value.scopes.some(s => typeof s !== "string")) problems.push("scopes must be an array of strings");
  if (typeof value.graphVersion !== "string") problems.push("graphVersion must be a string");
  if (value.interactionType !== "redirect" && value.interactionType !== "popup") problems.push('interactionType must be "redirect" or "popup"');
  if (problems.length) throw new Error(`Invalid config.json: ${problems.join("; ")}`);
  return value;
}

// Fall back to defaults so a broken deployment shows an error, not a blank page
export async function loadConfig(): Promise<AppConfig> {
  if (loaded) return config;
  let json: Partial<AppConfig> | undefined;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: "no-store" });
    if (response.ok) {
      json = await response.json();
    } else {
      console.warn(`config.json could not be loaded (${response.status}), using defaults`);
    }
  } catch (err) {
    console.warn("config.json could not be loaded, using defaults", err);
  }
  // Invalid values are reported by the bootstrap error page
  config = validateConfig({ ...defaults, ...(json || {}) });
  loaded = true;
  return config;
}

export default function getConfig(): AppConfig {
  return config;
}
