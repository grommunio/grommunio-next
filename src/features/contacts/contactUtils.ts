// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Contact, EmailAddress, PhysicalAddress } from "microsoft-graph";

// Birthdays are UTC midnight, format the UTC date so no zone shifts it
export function formatBirthday(birthday: string | null | undefined, locale?: string): string {
  if (!birthday) return "";
  const date = new Date(birthday.slice(0, 10) + "T00:00:00Z");
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(date);
}

export const birthdayDate = (birthday?: string | null): string | null => birthday && /^\d{4}-\d{2}-\d{2}/.test(birthday) ? birthday.slice(0, 10) : null;

export const birthdayValue = (date: string | null): string | null => date ? date + "T00:00:00Z" : null;

const SCALARS = [
  "givenName", "middleName", "surname", "displayName", "nickName", "title", "companyName", "jobTitle", "department",
  "officeLocation", "manager", "assistantName", "businessHomePage", "mobilePhone", "personalNotes", "spouseName", "profession", "birthday",
] as const;
const COLLECTIONS = ["emailAddresses", "businessPhones", "homePhones", "categories"] as const;
const ADDRESSES = ["businessAddress", "homeAddress"] as const;
const ADDRESS_KEYS: Array<keyof PhysicalAddress> = ["street", "city", "state", "postalCode", "countryOrRegion"];

export type ContactDraft = Contact & { businessPhones: string[]; homePhones: string[]; emailAddresses: EmailAddress[] };

const cleanAddress = (a?: PhysicalAddress | null): PhysicalAddress | null => {
  if (!a) return null;
  const out: PhysicalAddress = {};
  ADDRESS_KEYS.forEach(k => { out[k] = (a[k] || "").trim(); });
  return ADDRESS_KEYS.some(k => out[k]) ? out : null;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Create leaves blanks out. Update sends only changes, cleared values as null or [].
export function buildContactPayload(draft: ContactDraft, original?: Contact): Contact {
  const values: Record<string, unknown> = {};
  SCALARS.forEach(k => {
    const v = draft[k];
    values[k] = typeof v === "string" ? (v.trim() ? (k === "personalNotes" ? v : v.trim()) : null) : v ?? null;
  });
  values.displayName = values.displayName || [draft.givenName, draft.surname].map(s => s?.trim()).filter(Boolean).join(" ")
    || draft.emailAddresses[0]?.address?.trim() || null;
  values.emailAddresses = draft.emailAddresses.filter(e => e.address?.trim())
    .map(e => ({ address: e.address!.trim(), name: e.name || (values.displayName as string) || "" }));
  values.businessPhones = draft.businessPhones.map(p => p.trim()).filter(Boolean);
  values.homePhones = draft.homePhones.map(p => p.trim()).filter(Boolean);
  values.categories = draft.categories || [];
  ADDRESSES.forEach(k => { values[k] = cleanAddress(draft[k]); });

  const payload: Record<string, unknown> = {};
  const keys = [...SCALARS, ...COLLECTIONS, ...ADDRESSES];
  if (!original) {
    keys.forEach(k => {
      const v = values[k];
      if (v !== null && !(Array.isArray(v) && v.length === 0)) payload[k] = v;
    });
    return payload as Contact;
  }
  keys.forEach(k => {
    const before = (COLLECTIONS as readonly string[]).includes(k) ? (original[k as keyof Contact] || []) :
      (ADDRESSES as readonly string[]).includes(k) ? cleanAddress(original[k as keyof Contact] as PhysicalAddress) :
        original[k as keyof Contact] || null;
    if (k === "birthday" ? birthdayDate(before as string) !== birthdayDate(values[k] as string) : !same(before, values[k])) payload[k] = values[k];
  });
  return payload as Contact;
}

// Siblings by name, children right after their parent
export function orderFolders<F extends { id?: string; displayName?: string | null; parentFolderId?: string | null }>(folders: F[]): Array<{ folder: F; depth: number }> {
  const ids = new Set(folders.map(f => f.id));
  const children = new Map<string | undefined, F[]>();
  folders.forEach(f => {
    const parent = f.parentFolderId && ids.has(f.parentFolderId) ? f.parentFolderId : undefined;
    children.set(parent, [...(children.get(parent) || []), f]);
  });
  const out: Array<{ folder: F; depth: number }> = [];
  const visit = (parent: string | undefined, depth: number) => {
    [...(children.get(parent) || [])].sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "")).forEach(f => {
      out.push({ folder: f, depth });
      if (f.id) visit(f.id, depth + 1);
    });
  };
  visit(undefined, 0);
  return out;
}

export function folderWithDescendants<F extends { id?: string; parentFolderId?: string | null }>(folders: F[], id: string): Set<string> {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    folders.forEach(f => { if (f.id && f.parentFolderId && out.has(f.parentFolderId) && !out.has(f.id)) { out.add(f.id); grew = true; } });
  }
  return out;
}

export async function runLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await task(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
