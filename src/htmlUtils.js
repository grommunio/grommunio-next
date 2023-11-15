import { convertToDarkModeColor } from "./utils";

export function convertHtmlMailToDarkmode(htmlMail) {
  // Set default font color to white
  htmlMail.style.setProperty('color', 'white', 'important');

  // Convert div elements
  let divElements = htmlMail.getElementsByTagName("div");
  for(let i = 0; i < divElements.length; i++) {
    const el = divElements[i];
    el.style.setProperty("color", "white");
    el.style.setProperty("background", "none");
  }

  // Convert p elements
  let pElements = htmlMail.getElementsByTagName("p");
  for(let i = 0; i < pElements.length; i++) {
    const el = pElements[i];
    el.style.setProperty("color", "white");
    el.style.setProperty("background", "none");
  }

  // Convert span elements
  let spanElements = htmlMail.getElementsByTagName("span");
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

    el.style.setProperty("color", colorStyle ? convertToDarkModeColor(colorStyle.slice(6)) : "white");
    el.style.setProperty("background", "none");
  }

  // Convert a elements
  let aElements = htmlMail.getElementsByTagName("a");
  for(let i = 0; i < aElements.length; i++) {
    const el = aElements[i];
    el.style.setProperty("color", "#5cb3ff");
    el.style.setProperty("background", "none");
  }

  // Convert font elements
  let fontElements = htmlMail.getElementsByTagName("font");
  for(let i = 0; i < fontElements.length; i++) {
    const el = fontElements[i];
    const currentColor = el.getAttribute("color");
    el.style.setProperty("color", currentColor ? convertToDarkModeColor(currentColor) : "white", "important");
    el.style.setProperty("background", "none");
  }

  return htmlMail;
}