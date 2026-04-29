// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { Contact, PhysicalAddress } from "microsoft-graph";

const esc = (v?: string | null) => (v || "").replace(/\r\n?/g, "\n").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, m => "\\" + m);

function adr(address?: PhysicalAddress | null): string {
  if (!address) return "";
  return [";;", esc(address.street), ";", esc(address.city), ";", esc(address.state), ";", esc(address.postalCode), ";", esc(address.countryOrRegion)].join("");
}

export function contactsToVCard(contacts: Contact[]): string {
  return contacts.map(c => {
    const lines = ["BEGIN:VCARD", "VERSION:3.0"];
    lines.push(`FN:${esc(c.displayName)}`);
    lines.push(`N:${esc(c.surname)};${esc(c.givenName)};${esc(c.middleName)};${esc(c.title)};`);
    if (c.nickName) lines.push(`NICKNAME:${esc(c.nickName)}`);
    if (c.companyName || c.department) lines.push(`ORG:${esc(c.companyName)};${esc(c.department)}`);
    if (c.jobTitle) lines.push(`TITLE:${esc(c.jobTitle)}`);
    (c.emailAddresses || []).forEach((e, i) => e.address && lines.push(`EMAIL;TYPE=INTERNET${i === 0 ? ",PREF" : ""}:${e.address}`));
    (c.businessPhones || []).forEach(p => lines.push(`TEL;TYPE=WORK,VOICE:${p}`));
    (c.homePhones || []).forEach(p => lines.push(`TEL;TYPE=HOME,VOICE:${p}`));
    if (c.mobilePhone) lines.push(`TEL;TYPE=CELL:${c.mobilePhone}`);
    if (c.businessAddress && Object.values(c.businessAddress).some(Boolean)) lines.push(`ADR;TYPE=WORK:${adr(c.businessAddress)}`);
    if (c.homeAddress && Object.values(c.homeAddress).some(Boolean)) lines.push(`ADR;TYPE=HOME:${adr(c.homeAddress)}`);
    if (c.birthday) lines.push(`BDAY:${c.birthday.slice(0, 10)}`);
    if (c.businessHomePage) lines.push(`URL:${c.businessHomePage}`);
    if (c.personalNotes) lines.push(`NOTE:${esc(c.personalNotes)}`);
    (c.categories || []).length && lines.push(`CATEGORIES:${(c.categories || []).map(esc).join(",")}`);
    lines.push("END:VCARD");
    return lines.join("\r\n");
  }).join("\r\n") + "\r\n";
}

const CSV_COLUMNS: Array<[string, (c: Contact) => string]> = [
  ["First Name", c => c.givenName || ""],
  ["Middle Name", c => c.middleName || ""],
  ["Last Name", c => c.surname || ""],
  ["Title", c => c.title || ""],
  ["Nickname", c => c.nickName || ""],
  ["E-mail Address", c => c.emailAddresses?.[0]?.address || ""],
  ["E-mail 2 Address", c => c.emailAddresses?.[1]?.address || ""],
  ["E-mail 3 Address", c => c.emailAddresses?.[2]?.address || ""],
  ["Mobile Phone", c => c.mobilePhone || ""],
  ["Business Phone", c => c.businessPhones?.[0] || ""],
  ["Home Phone", c => c.homePhones?.[0] || ""],
  ["Company", c => c.companyName || ""],
  ["Job Title", c => c.jobTitle || ""],
  ["Department", c => c.department || ""],
  ["Business Street", c => c.businessAddress?.street || ""],
  ["Business City", c => c.businessAddress?.city || ""],
  ["Business State", c => c.businessAddress?.state || ""],
  ["Business Postal Code", c => c.businessAddress?.postalCode || ""],
  ["Business Country/Region", c => c.businessAddress?.countryOrRegion || ""],
  ["Home Street", c => c.homeAddress?.street || ""],
  ["Home City", c => c.homeAddress?.city || ""],
  ["Home State", c => c.homeAddress?.state || ""],
  ["Home Postal Code", c => c.homeAddress?.postalCode || ""],
  ["Home Country/Region", c => c.homeAddress?.countryOrRegion || ""],
  ["Birthday", c => c.birthday ? c.birthday.slice(0, 10) : ""],
  ["Web Page", c => c.businessHomePage || ""],
  ["Notes", c => c.personalNotes || ""],
];

const csvCell = (v: string) => /[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function contactsToCsv(contacts: Contact[]): string {
  const header = CSV_COLUMNS.map(([name]) => csvCell(name)).join(",");
  const rows = contacts.map(c => CSV_COLUMNS.map(([, get]) => csvCell(get(c))).join(","));
  return [header, ...rows].join("\r\n") + "\r\n";
}

// ',' or ';', counted outside quotes in the header
function detectDelimiter(text: string): "," | ";" {
  let commas = 0, semis = 0, quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch === ",") commas++;
    else if (!quoted && ch === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

export function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(c => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c !== "")) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Outlook and Google export layouts
export function csvToContacts(text: string): Contact[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) return [];
  const header = rows[0].map(norm);
  const col = (...names: string[]) => {
    for (const name of names) {
      const idx = header.indexOf(norm(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };
  const get = (row: string[], idx: number) => idx >= 0 ? (row[idx] || "").trim() : "";
  const cols = {
    first: col("First Name", "Given Name"), middle: col("Middle Name", "Additional Name"), last: col("Last Name", "Family Name"),
    display: col("Display Name", "Name"), nick: col("Nickname"), email1: col("E-mail Address", "E-mail 1 - Value", "Email"),
    email2: col("E-mail 2 Address", "E-mail 2 - Value"), email3: col("E-mail 3 Address"), mobile: col("Mobile Phone", "Phone 1 - Value"),
    business: col("Business Phone", "Phone 2 - Value"), home: col("Home Phone"), company: col("Company", "Organization 1 - Name"),
    job: col("Job Title", "Organization 1 - Title"), department: col("Department", "Organization 1 - Department"),
    bStreet: col("Business Street"), bCity: col("Business City"), bState: col("Business State"), bZip: col("Business Postal Code"), bCountry: col("Business Country/Region"),
    hStreet: col("Home Street"), hCity: col("Home City"), hState: col("Home State"), hZip: col("Home Postal Code"), hCountry: col("Home Country/Region"),
    birthday: col("Birthday"), web: col("Web Page", "Website 1 - Value"), notes: col("Notes"),
  };
  return rows.slice(1).map(row => {
    const givenName = get(row, cols.first);
    const surname = get(row, cols.last);
    const emails = [get(row, cols.email1), get(row, cols.email2), get(row, cols.email3)].filter(Boolean);
    const displayName = get(row, cols.display) || [givenName, get(row, cols.middle), surname].filter(Boolean).join(" ") || emails[0] || "";
    const contact: Contact = { displayName, givenName, surname, middleName: get(row, cols.middle) || undefined, nickName: get(row, cols.nick) || undefined };
    if (emails.length) contact.emailAddresses = emails.map(address => ({ address, name: displayName }));
    if (get(row, cols.mobile)) contact.mobilePhone = get(row, cols.mobile);
    if (get(row, cols.business)) contact.businessPhones = [get(row, cols.business)];
    if (get(row, cols.home)) contact.homePhones = [get(row, cols.home)];
    if (get(row, cols.company)) contact.companyName = get(row, cols.company);
    if (get(row, cols.job)) contact.jobTitle = get(row, cols.job);
    if (get(row, cols.department)) contact.department = get(row, cols.department);
    const bAddr = { street: get(row, cols.bStreet), city: get(row, cols.bCity), state: get(row, cols.bState), postalCode: get(row, cols.bZip), countryOrRegion: get(row, cols.bCountry) };
    if (Object.values(bAddr).some(Boolean)) contact.businessAddress = bAddr;
    const hAddr = { street: get(row, cols.hStreet), city: get(row, cols.hCity), state: get(row, cols.hState), postalCode: get(row, cols.hZip), countryOrRegion: get(row, cols.hCountry) };
    if (Object.values(hAddr).some(Boolean)) contact.homeAddress = hAddr;
    const bday = get(row, cols.birthday);
    if (/^\d{4}-\d{2}-\d{2}/.test(bday)) contact.birthday = bday.slice(0, 10) + "T00:00:00Z";
    if (get(row, cols.web)) contact.businessHomePage = get(row, cols.web);
    if (get(row, cols.notes)) contact.personalNotes = get(row, cols.notes);
    return contact;
  }).filter(c => c.displayName);
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
