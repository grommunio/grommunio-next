import { describe, expect, it } from "vitest";
import { contactsToCsv, contactsToVCard, csvToContacts, parseCsv, parseCsvDate } from "../vcard";

describe("parseCsv", () => {
  it("handles quotes, embedded separators and line breaks", () => {
    const rows = parseCsv('a,b,c\r\n"x, y","multi\nline","q""uote"\n');
    expect(rows).toEqual([["a", "b", "c"], ["x, y", "multi\nline", 'q"uote']]);
  });
  it("accepts semicolon separated files", () => {
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("uses only the header's delimiter", () => {
    expect(parseCsv("a,b\nHead; EMEA,x")).toEqual([["a", "b"], ["Head; EMEA", "x"]]);
    expect(parseCsv("a;b\n1,5;x")).toEqual([["a", "b"], ["1,5", "x"]]);
  });
});

describe("csvToContacts", () => {
  it("maps Outlook columns", () => {
    const csv = "First Name,Last Name,E-mail Address,Mobile Phone,Company,Business City,Birthday\nAlice,Example,alice@example.com,+49 123,ACME,Vienna,1990-05-04\n";
    const [contact] = csvToContacts(csv);
    expect(contact.displayName).toBe("Alice Example");
    expect(contact.emailAddresses?.[0].address).toBe("alice@example.com");
    expect(contact.mobilePhone).toBe("+49 123");
    expect(contact.companyName).toBe("ACME");
    expect(contact.businessAddress?.city).toBe("Vienna");
    expect(contact.birthday).toBe("1990-05-04T00:00:00Z");
  });
  it("maps Google columns and strips the BOM", () => {
    const csv = "﻿Name,Given Name,Family Name,E-mail 1 - Value\nBob B,Bob,B,bob@example.com\n";
    const [contact] = csvToContacts(csv);
    expect(contact.displayName).toBe("Bob B");
    expect(contact.emailAddresses?.[0].address).toBe("bob@example.com");
  });
  it("ignores rows without a usable name", () => {
    expect(csvToContacts("First Name,Last Name\n,\n")).toHaveLength(0);
  });
});

describe("exports", () => {
  const contact = { displayName: "Alice Example", givenName: "Alice", surname: "Example", emailAddresses: [{ address: "alice@example.com" }], businessPhones: ["+1 555"], personalNotes: "a;b,c" };

  it("writes a vCard with escaped values", () => {
    const vcf = contactsToVCard([contact]);
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("FN:Alice Example");
    expect(vcf).toContain("N:Example;Alice;;;");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET,PREF:alice@example.com");
    expect(vcf).toContain("TEL;TYPE=WORK,VOICE:+1 555");
    expect(vcf).toContain("NOTE:a\\;b\\,c");
    expect(vcf.trim().endsWith("END:VCARD")).toBe(true);
  });

  it("normalises CR line breaks in vCard values", () => {
    const vcf = contactsToVCard([{ displayName: "A", personalNotes: "one\r\ntwo\rthree" }]);
    expect(vcf).toContain("NOTE:one\\ntwo\\nthree\r\n");
    expect(vcf.replace(/\r\n/g, "")).not.toContain("\r");
  });

  it("quotes values containing semicolons in CSV", () => {
    const csv = contactsToCsv([{ displayName: "A", givenName: "A", jobTitle: "Head of Sales; EMEA", emailAddresses: [{ address: "a@x.org" }] }]);
    expect(csv).toContain('"Head of Sales; EMEA"');
    const [back] = csvToContacts(csv);
    expect(back.jobTitle).toBe("Head of Sales; EMEA");
    expect(back.emailAddresses?.[0].address).toBe("a@x.org");
  });

  it("writes CSV that parses back", () => {
    const csv = contactsToCsv([contact]);
    const [back] = csvToContacts(csv);
    expect(back.displayName).toBe("Alice Example");
    expect(back.emailAddresses?.[0].address).toBe("alice@example.com");
    expect(back.personalNotes).toBe("a;b,c");
  });
});

describe("parseCsvDate", () => {
  it("reads ISO, Outlook M/D/YYYY and D.M.YYYY birthdays", () => {
    expect(parseCsvDate("1990-05-04")).toBe("1990-05-04");
    expect(parseCsvDate("3/14/1980")).toBe("1980-03-14");
    expect(parseCsvDate("14.03.1980")).toBe("1980-03-14");
    expect(parseCsvDate("1.2.1975")).toBe("1975-02-01");
  });
  it("ignores Outlook's empty placeholder and invalid dates", () => {
    expect(parseCsvDate("0/0/00")).toBeUndefined();
    expect(parseCsvDate("")).toBeUndefined();
    expect(parseCsvDate("14/3/1980")).toBeUndefined();
    expect(parseCsvDate("31.02.1980")).toBeUndefined();
    expect(parseCsvDate("someday")).toBeUndefined();
  });
  it("imports Outlook birthdays", () => {
    const csv = "First Name,Birthday\nAlice,3/14/1980\nBob,0/0/00\n";
    const [alice, bob] = csvToContacts(csv);
    expect(alice.birthday).toBe("1980-03-14T00:00:00Z");
    expect(bob.birthday).toBeUndefined();
  });
});
