// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import DOMPurify from "dompurify";
import type { Attachment, EventMessage, FileAttachment, Message, Recipient } from "microsoft-graph";
import i18n from "../../i18n";
import { convertHtmlMailToDarkmode } from "../../htmlUtils";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(i18n.language, { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatListDate(iso?: string | null, now: Date = new Date()): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY);
  if (days <= 0) return formatTime(date);
  if (days < 7) return new Intl.DateTimeFormat(i18n.language, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(date);
  if (date.getFullYear() === now.getFullYear()) return new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short" }).format(date);
  return new Intl.DateTimeFormat(i18n.language, { dateStyle: "short" }).format(date);
}

export function formatFullDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(i18n.language, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Today")
// t("Yesterday")
// t("This week")
// t("Last week")
// t("Two weeks ago")
// t("Three weeks ago")
// t("Last month")
// t("Older")
// t("Pinned")
// t("Unknown sender")
export type DateGroup =
  | "Today" | "Yesterday" | "This week" | "Last week" | "Two weeks ago" | "Three weeks ago" | "Last month" | "Older" | "Pinned";

// Same buckets as Outlook
export function dateGroup(iso?: string | null, now: Date = new Date()): DateGroup {
  if (!iso) return "Older";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Older";
  const today = startOfDay(now);
  const days = Math.floor((today.getTime() - startOfDay(date).getTime()) / DAY);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  // Weeks start on Monday
  const weekday = (today.getDay() + 6) % 7;
  const startOfWeek = new Date(today.getTime() - weekday * DAY);
  const diffFromWeekStart = Math.floor((startOfWeek.getTime() - startOfDay(date).getTime()) / DAY);
  if (diffFromWeekStart <= 0) return "This week";
  if (diffFromWeekStart <= 7) return "Last week";
  if (diffFromWeekStart <= 14) return "Two weeks ago";
  if (diffFromWeekStart <= 21) return "Three weeks ago";
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  if (date >= lastMonth) return "Last month";
  return "Older";
}

export function recipientName(recipient?: Recipient | null): string {
  return recipient?.emailAddress?.name || recipient?.emailAddress?.address || "";
}

export function recipientAddress(recipient?: Recipient | null): string {
  return recipient?.emailAddress?.address || "";
}

export function senderName(message: Message): string {
  return recipientName(message.from) || recipientName(message.sender) || i18n.t("Unknown sender");
}

export function senderAddress(message: Message): string {
  return recipientAddress(message.from) || recipientAddress(message.sender);
}

export function recipientsSummary(message: Message): string {
  const names = (message.toRecipients || []).map(recipientName).filter(Boolean);
  return names.join(", ");
}

export function isMeetingMessage(message: Message): boolean {
  const type = (message as EventMessage).meetingMessageType;
  return Boolean(type && type !== "none");
}

export function previewText(message: Message, length = 160): string {
  const text = (message.bodyPreview || "").replace(/\s+/g, " ").trim();
  return text.length > length ? text.slice(0, length - 1) + "…" : text;
}

export function isValidEmail(address: string): boolean {
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(address.trim());
}

export function toRecipient(input: string): Recipient {
  const match = input.trim().match(/^"?([^"<]*)"?\s*<([^>]+)>$/);
  if (match) return { emailAddress: { name: match[1].trim() || match[2].trim(), address: match[2].trim() } };
  return { emailAddress: { address: input.trim(), name: "" } };
}

export function formatRecipient(recipient: Recipient): string {
  const name = recipient.emailAddress?.name;
  const address = recipient.emailAddress?.address || "";
  return name && name !== address ? `${name} <${address}>` : address;
}

export type PreparedBody = {
  html: string;
  missingInline: number;
};

const BASE_STYLE = `
  html, body { margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.45; word-wrap: break-word; overflow-wrap: anywhere; padding: 4px 2px 12px 2px; }
  img { max-width: 100%; height: auto; }
  blockquote { border-left: 2px solid #ccc; margin: 0.5em 0; padding-left: 0.8em; }
  pre { white-space: pre-wrap; }
  table { max-width: 100%; }
  a { color: #1d4b99; }
`;

const DARK_STYLE = `
  body { color: #e7e9ec; background: transparent; }
  a { color: #7fb2ff; }
  blockquote { border-left-color: #555; }
`;

let hooksInstalled = false;
function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  // New tab, no opener access
  DOMPurify.addHook("afterSanitizeAttributes", node => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
    if ((node.tagName === "IMG" || node.tagName === "IFRAME") && node.hasAttribute("src")) {
      const src = node.getAttribute("src") || "";
      if (/^\s*javascript:/i.test(src)) node.removeAttribute("src");
    }
  });
}

// cid: images become data URLs once the attachment content is loaded
export function prepareMailHtml(content: string, options: { contentType?: string | null; dark?: boolean; inlineAttachments?: Attachment[]; keepColors?: boolean }): PreparedBody {
  installHooks();
  const isHtml = (options.contentType || "html").toLowerCase() === "html";
  let raw = isHtml ? content : `<pre>${escapeHtml(content)}</pre>`;
  let missingInline = 0;

  if (/cid:/i.test(raw)) {
    const byCid = new Map<string, FileAttachment>();
    (options.inlineAttachments || []).forEach(a => {
      const file = a as FileAttachment;
      if (file.contentId && file.contentBytes) byCid.set(file.contentId.replace(/[<>]/g, ""), file);
    });
    raw = raw.replace(/(src\s*=\s*["'])cid:([^"']+)(["'])/gi, (_m, pre, cid, post) => {
      const file = byCid.get(decodeURIComponent(cid).replace(/[<>]/g, ""));
      if (!file) {
        missingInline++;
        return `${pre}${post}`;
      }
      return `${pre}data:${file.contentType || "image/png"};base64,${file.contentBytes}${post}`;
    });
  }

  const clean = DOMPurify.sanitize(raw, {
    WHOLE_DOCUMENT: true,
    FORBID_TAGS: ["script", "object", "embed", "link", "meta", "base", "form", "input", "button", "textarea", "select"],
    FORBID_ATTR: ["onerror", "onload", "srcset"],
    ADD_ATTR: ["target"],
  });

  let doc = document.implementation.createHTMLDocument("");
  doc.documentElement.innerHTML = clean;
  if (options.dark && !options.keepColors) {
    doc = convertHtmlMailToDarkmode(doc.documentElement).ownerDocument as Document;
  }
  const style = doc.createElement("style");
  style.textContent = BASE_STYLE + (options.dark ? DARK_STYLE : "");
  doc.head.appendChild(style);
  return { html: "<!DOCTYPE html>" + doc.documentElement.outerHTML, missingInline };
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function buildPrintDocument(message: Message, bodyHtml: string): string {
  const rows = [
    [i18n.t("From"), formatRecipient(message.from || {})],
    [i18n.t("To"), (message.toRecipients || []).map(formatRecipient).join(", ")],
    [i18n.t("Cc"), (message.ccRecipients || []).map(formatRecipient).join(", ")],
    [i18n.t("Date"), formatFullDate(message.receivedDateTime || message.sentDateTime)],
  ].filter(([, v]) => v);
  const header = `<h2 style="font-family:sans-serif">${escapeHtml(message.subject || "")}</h2>
    <table style="font-family:sans-serif;font-size:13px;border-collapse:collapse;margin-bottom:16px">
    ${rows.map(([k, v]) => `<tr><td style="color:#666;padding:2px 12px 2px 0">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("")}
    </table><hr style="border:none;border-top:1px solid #ccc;margin-bottom:16px">`;
  return bodyHtml.replace(/<body([^>]*)>/i, `<body$1>${header}`);
}

export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => document.body.removeChild(frame), 1000);
  };
}

export function downloadAttachment(attachment: FileAttachment) {
  if (!attachment.contentBytes) return;
  const bytes = atob(attachment.contentBytes);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const blob = new Blob([buffer], { type: attachment.contentType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = attachment.name || "attachment";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
