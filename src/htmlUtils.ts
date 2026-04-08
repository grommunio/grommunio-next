// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2023-2024 grommunio GmbH

import { convertToDarkModeColor } from "./utils";

const SKIP_TAGS = new Set(["IMG", "SVG", "VIDEO", "PICTURE", "CANVAS", "STYLE", "HEAD", "TITLE", "BR", "HR"]);

// Recolors a mail body for dark mode. Elements with their own text and
// background color keep it, along with their content.
export function convertHtmlMailToDarkmode(htmlMail: HTMLElement): HTMLElement {
  htmlMail.style.setProperty("color", "white", "important");
  htmlMail.style.setProperty("background-color", "transparent", "important");

  const elements = htmlMail.querySelectorAll<HTMLElement>("*");
  const keep: HTMLElement[] = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.namespaceURI !== "http://www.w3.org/1999/xhtml" || SKIP_TAGS.has(el.tagName) || !el.style) continue;
    if (keep.some(k => k.contains(el))) continue;

    const color = el.style.getPropertyValue("color") || el.getAttribute("color") || "";
    const background = el.style.getPropertyValue("background-color") || el.getAttribute("bgcolor") || "";
    // Colored label on its own background is fine as is
    if (color && background && el.tagName !== "BODY" && el.tagName !== "TABLE" && el.tagName !== "TD" && el.tagName !== "TH") {
      keep.push(el);
      continue;
    }

    // Drop light backgrounds, keep background images
    el.removeAttribute("bgcolor");
    el.style.setProperty("background-color", "transparent", "important");

    if (el.tagName === "A") {
      el.style.setProperty("color", "#5cb3ff", "important");
    } else if (color) {
      el.style.setProperty("color", safeInvert(color), "important");
    } else {
      el.style.setProperty("color", "white");
    }
  }

  return htmlMail;
}

// Named colors and bad values must not break rendering
function safeInvert(color: string): string {
  try {
    return convertToDarkModeColor(color.trim());
  } catch {
    return "white";
  }
}
