// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2024 grommunio GmbH

import { Contact, ContactFolder, Person } from "microsoft-graph";
import { del, get, getAll, getBlobUrl, getPage, getNextPage, Page, patch, post, put, odataString, quoteSearch } from "./graph";

const CONTACT_SELECT = [
  "id", "displayName", "givenName", "surname", "middleName", "nickName", "initials", "title", "emailAddresses",
  "businessPhones", "homePhones", "mobilePhone", "jobTitle", "companyName", "department", "officeLocation",
  "businessAddress", "homeAddress", "otherAddress", "birthday", "personalNotes", "categories", "parentFolderId",
  "fileAs", "imAddresses", "businessHomePage", "assistantName", "manager", "spouseName", "children", "profession",
  "lastModifiedDateTime",
];

const contactsBase = (folderId?: string) => folderId ? `/me/contactFolders/${folderId}/contacts` : "/me/contacts";

export async function getContacts(folderId?: string): Promise<Contact[]> {
  return getAll<Contact>(contactsBase(folderId), { select: CONTACT_SELECT, orderby: "displayName", top: 500 });
}

export async function getContactsPage(folderId?: string, search?: string, top = 100): Promise<Page<Contact>> {
  if (search) {
    const term = odataString(search);
    return getPage<Contact>(contactsBase(folderId), {
      select: CONTACT_SELECT,
      filter: `startswith(displayName,${term}) or startswith(givenName,${term}) or startswith(surname,${term}) or emailAddresses/any(a:a/address eq ${term})`,
      top,
    });
  }
  return getPage<Contact>(contactsBase(folderId), { select: CONTACT_SELECT, orderby: "displayName", top, count: true });
}

export async function getContactsNextPage(nextLink: string): Promise<Page<Contact>> {
  return getNextPage<Contact>(nextLink);
}

export async function getContactFolders(): Promise<ContactFolder[]> {
  return getAll<ContactFolder>("/me/contactFolders", { expand: "childFolders" });
}

export async function postContactFolder(displayName: string, parentFolderId?: string): Promise<ContactFolder> {
  return post<ContactFolder>(parentFolderId ? `/me/contactFolders/${parentFolderId}/childFolders` : "/me/contactFolders", { displayName });
}

export async function patchContactFolder(id: string, displayName: string): Promise<ContactFolder> {
  return patch<ContactFolder>(`/me/contactFolders/${id}`, { displayName });
}

export async function deleteContactFolder(id: string): Promise<void> {
  return del(`/me/contactFolders/${id}`);
}

export async function postContact(contact: Contact, folderId?: string): Promise<Contact> {
  return post<Contact>(contactsBase(folderId), contact);
}

export async function deleteContact(contactId: string): Promise<void> {
  return del('/me/contacts/' + contactId);
}

export async function getContact(contactId: string): Promise<Contact> {
  return get<Contact>('/me/contacts/' + contactId, { select: CONTACT_SELECT });
}

export async function patchContact(contact: Contact): Promise<Contact> {
  const { id, ...props } = contact;
  // Read-only properties must not be sent back
  delete (props as any).lastModifiedDateTime;
  delete (props as any).parentFolderId;
  delete (props as any)["@odata.etag"];
  delete (props as any).changeKey;
  delete (props as any).createdDateTime;
  return patch<Contact>('/me/contacts/' + id, props);
}

export async function getContactPhoto(contactId: string): Promise<string | null> {
  return getBlobUrl(`/me/contacts/${contactId}/photo/$value`);
}

export async function putContactPhoto(contactId: string, file: File): Promise<void> {
  await put(`/me/contacts/${contactId}/photo/$value`, file, { headers: { "Content-Type": file.type || "image/jpeg" } });
}

export async function searchPeople(search: string, top = 10): Promise<Person[]> {
  const response = await get<{ value: Person[] }>("/me/people", {
    search: quoteSearch(search),
    top,
    select: ["id", "displayName", "givenName", "surname", "scoredEmailAddresses", "personType", "jobTitle", "companyName"],
  });
  return response.value;
}
