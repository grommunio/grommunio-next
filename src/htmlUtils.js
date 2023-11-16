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


export function buildEmailPrintView(mailContent, mail) {
  const { subject, from, toRecipients, ccRecipients } = mail;
  const mailDoc = document.createElement("html");
  mailDoc.innerHTML = mailContent;
  const doc = document.implementation.createHTMLDocument("");
  
  // Add head of mail content
  doc.childNodes[1].childNodes[0].innerHTML = mailDoc.childNodes[0].innerHTML;
  
  // Add mail subject
  const title = document.createElement("h3");
  title.innerHTML = subject || "";
  doc.childNodes[1].childNodes[1].appendChild(title);

  // Add mail addresses
  const f = document.createElement("p");
  f.innerHTML = "From: " + `${from?.emailAddress?.name || ''} &lt;${from?.emailAddress?.address || ''}&gt;`; 
  doc.childNodes[1].childNodes[1].appendChild(f);
  const to = document.createElement("p");
  to.innerHTML = "To: " + toRecipients?.map(recip => recip.emailAddress?.address).join(", "); 
  doc.childNodes[1].childNodes[1].appendChild(to);
  const cc = document.createElement("p");
  cc.innerHTML = "Cc: " + ccRecipients?.map(recip => recip.emailAddress?.address).join(", "); 
  doc.childNodes[1].childNodes[1].appendChild(cc);

  // Add space below mail header
  doc.childNodes[1].childNodes[1].appendChild(document.createElement("br"));

  // Add email content
  doc.childNodes[1].childNodes[1].appendChild(mailDoc.childNodes[1]);

  // Open print window
  const mywindow = window.open('', 'PRINT');
  if(mywindow) {
    mywindow.document.write(doc.childNodes[1].outerHTML);
    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/
    mywindow.print();
    mywindow.close();
  }

  console.log(doc);

  return true;
}
