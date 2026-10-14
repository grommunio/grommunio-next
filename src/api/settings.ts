// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2023-2024 grommunio GmbH

import { AutomaticRepliesSetting, MailboxSettings, WorkingHours } from "microsoft-graph";
import type { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import { ensureClient } from "./utils";
import { get, patch } from "./graph";

export async function getMailboxSettings(authProvider?: AuthenticationProvider): Promise<MailboxSettings> {
  if (authProvider) ensureClient(authProvider);
  return get<MailboxSettings>("/me/mailboxSettings");
}

export async function patchMailboxSettings(settings: MailboxSettings): Promise<MailboxSettings> {
  return patch<MailboxSettings>("/me/mailboxSettings", settings);
}

export async function patchAutomaticReplies(setting: AutomaticRepliesSetting): Promise<MailboxSettings> {
  return patch<MailboxSettings>("/me/mailboxSettings", { automaticRepliesSetting: setting });
}

export async function patchWorkingHours(workingHours: WorkingHours): Promise<MailboxSettings> {
  return patch<MailboxSettings>("/me/mailboxSettings", { workingHours });
}

export type TimeZoneStandard = "Windows" | "Iana";

// Exchange mostly stores Windows names, IANA names contain a slash
export const timeZoneStandardOf = (name?: string | null): TimeZoneStandard => name && name.includes("/") ? "Iana" : "Windows";

export async function getSupportedTimeZones(standard: TimeZoneStandard = "Windows"): Promise<Array<{ alias: string; displayName: string }>> {
  const response = await get<{ value: Array<{ alias: string; displayName: string }> }>(`/me/outlook/supportedTimeZones(TimeZoneStandard=microsoft.graph.timeZoneStandard'${standard}')`);
  return response.value;
}

export async function getSupportedLanguages(): Promise<Array<{ locale: string; displayName: string }>> {
  const response = await get<{ value: Array<{ locale: string; displayName: string }> }>("/me/outlook/supportedLanguages");
  return response.value;
}
