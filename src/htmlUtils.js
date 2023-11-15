import { invertColor } from "./utils";

export function convertHtmlMailToDarkmode(htmlMail) {
  // Set default font color to white
  htmlMail.style.setProperty('color', 'white', 'important');

  // Convert div elements
  let divElements = htmlMail.getElementsByTagName("div");
  for(let i = 0; i < divElements.length; i++) {
    const el = divElements[i];
    const currentStyle = el.getAttribute("style");
    console.log(currentStyle);
    el.style.setProperty("color", "white");  // TODO: Find way to convert non-black colors to dark-mode equivalent
    el.style.setProperty("background", "none");
  }

  // Convert p elements
  let pElements = htmlMail.getElementsByTagName("p");
  for(let i = 0; i < pElements.length; i++) {
    const el = pElements[i];
    el.style.setProperty("color", "white"); // TODO: Find way to convert non-black colors to dark-mode equivalent
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
    el.style.setProperty("color", currentColor ? invertColor(currentColor) : "white", "important");
    el.style.setProperty("background", "none");
  }

  return htmlMail;
}