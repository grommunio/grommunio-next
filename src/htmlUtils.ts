// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2023-2024 grommunio GmbH

import { convertToDarkModeColor } from "./utils";

// Keep mail bodies readable in dark mode
export function convertHtmlMailToDarkmode(htmlMail: HTMLElement): HTMLElement {
  htmlMail.style.setProperty('color', 'white', 'important');

  // Convert div elements
  const divElements = htmlMail.getElementsByTagName("div");
  for(let i = 0; i < divElements.length; i++) {
    const el = divElements[i];
    el.style.setProperty("color", "white");
    el.style.setProperty("background", "none");
  }

  // Convert p elements
  const pElements = htmlMail.getElementsByTagName("p");
  for(let i = 0; i < pElements.length; i++) {
    const el = pElements[i];
    el.style.setProperty("color", "white");
    el.style.setProperty("background", "none");
  }

  // Convert span elements
  const spanElements = htmlMail.getElementsByTagName("span");
  for(let i = 0; i < spanElements.length; i++) {
    const el = spanElements[i];
    const currentStyle = el.getAttribute("style") || "";
    
    const styleTags = currentStyle.split(";").map(tag => tag.replace(/\s/g,''));

    const colorStyle = styleTags.find(tag => tag.startsWith("color:"));
    const backgroundStyle = styleTags.find(tag => tag.startsWith("background-color:"));

    // If the colored font has a background, the darkmode font affect readablity
    if(colorStyle && backgroundStyle) {
      continue;
    }

    el.style.setProperty("color", colorStyle ? safeInvert(colorStyle.slice(6)) : "white");
    el.style.setProperty("background", "none");
  }

  // Convert a elements
  const aElements = htmlMail.getElementsByTagName("a");
  for(let i = 0; i < aElements.length; i++) {
    const el = aElements[i];
    el.style.setProperty("color", "#5cb3ff");
    el.style.setProperty("background", "none");
  }

  // Convert font elements
  const fontElements = htmlMail.getElementsByTagName("font");
  for(let i = 0; i < fontElements.length; i++) {
    const el = fontElements[i];
    const currentColor = el.getAttribute("color");
    el.style.setProperty("color", currentColor ? safeInvert(currentColor) : "white", "important");
    el.style.setProperty("background", "none");
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
