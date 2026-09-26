// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import type { ItemBody } from "microsoft-graph";

// HTML bodies from Outlook get converted, never shown as markup
export function taskNotesText(body?: ItemBody | null): string {
  const content = body?.content || "";
  if (body?.contentType !== "html") return content;
  const doc = new DOMParser().parseFromString(content, "text/html");
  doc.querySelectorAll("script, style, head, title").forEach(e => e.remove());
  doc.querySelectorAll("br").forEach(e => e.replaceWith("\n"));
  doc.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, tr").forEach(e => e.append("\n"));
  return (doc.body?.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
