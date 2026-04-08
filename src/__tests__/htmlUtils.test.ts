import { describe, expect, it } from "vitest";
import { convertHtmlMailToDarkmode } from "../htmlUtils";

const convert = (html: string) => {
  const doc = document.implementation.createHTMLDocument("");
  doc.documentElement.innerHTML = html;
  convertHtmlMailToDarkmode(doc.documentElement);
  return doc;
};

describe("convertHtmlMailToDarkmode", () => {
  it("removes light table cell backgrounds", () => {
    const doc = convert('<body bgcolor="#ffffff"><table><tr><td bgcolor="#ffffff" style="background-color:#fff"><p>Hello</p></td></tr></table></body>');
    const td = doc.querySelector("td")!;
    expect(td.hasAttribute("bgcolor")).toBe(false);
    expect(td.style.getPropertyValue("background-color")).toBe("transparent");
    expect(doc.body.hasAttribute("bgcolor")).toBe(false);
    expect(doc.querySelector("p")!.style.getPropertyValue("color")).toBe("white");
  });

  it("inverts explicit text colors", () => {
    const doc = convert('<p style="color:#000000">Text</p>');
    expect(doc.querySelector("p")!.style.getPropertyValue("color")).toMatch(/#ffffff|rgb\(255, 255, 255\)/);
  });

  it("keeps labels that bring their own background", () => {
    const doc = convert('<span style="color:#000;background-color:#ff0">Label <b>bold</b></span>');
    expect(doc.querySelector("span")!.style.getPropertyValue("background-color")).not.toBe("transparent");
    expect(doc.querySelector("b")!.style.getPropertyValue("color")).toBe("");
  });
});
