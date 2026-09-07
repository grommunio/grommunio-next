import { describe, expect, it } from "vitest";
import type { Attachment } from "microsoft-graph";
import { inlineCandidates, prepareMailHtml } from "../utils";
import { replaceInlineImageSources, resolveCidSources } from "../utils-compose";

describe("remote content blocking", () => {
  const block = (body: string) => prepareMailHtml(body, { blockRemote: true });

  it("removes remote media sources and posters", () => {
    const result = block(`<video src="https://t.example/v.mp4" poster="https://t.example/p.png"></video>
      <audio><source src="//t.example/a.mp3"></audio><video><track src="https://t.example/t.vtt"></video>`);
    expect(result.html).not.toContain("t.example");
    expect(result.blockedRemote).toBe(4);
  });

  it("drops @import rules even without url()", () => {
    const result = block(`<style>@import "https://t.example/x.css"; p { color: red; }</style><p>x</p>`);
    expect(result.html).not.toContain("t.example");
    expect(result.html).toContain("color: red");
    expect(result.blockedRemote).toBe(1);
  });

  it("neutralises quoted URLs in image-set()", () => {
    const result = block(`<div style='background-image: image-set("https://t.example/a.png" 1x)'>x</div>`);
    expect(result.html).not.toContain("t.example");
    expect(result.blockedRemote).toBe(1);
  });

  it("keeps local content and counts nothing", () => {
    const result = block(`<style>p { color: red; }</style><p style="color: blue">x</p><img src="data:image/png;base64,AAAA">`);
    expect(result.blockedRemote).toBe(0);
    expect(result.html).toContain("data:image/png;base64,AAAA");
  });

  it("leaves remote media alone when not blocking", () => {
    const result = prepareMailHtml(`<video src="https://t.example/v.mp4"></video>`, { blockRemote: false });
    expect(result.html).toContain("https://t.example/v.mp4");
  });
});

describe("inlineCandidates", () => {
  it("prefers attachments flagged inline", () => {
    const list: Attachment[] = [
      { id: "1", isInline: true, contentType: "image/png" },
      { id: "2", isInline: false, contentType: "image/jpeg" },
    ];
    expect(inlineCandidates(list).map(a => a.id)).toEqual(["1"]);
  });

  it("falls back to images when nothing is flagged inline", () => {
    const list: Attachment[] = [
      { id: "1", isInline: false, contentType: "application/pdf" },
      { id: "2", isInline: false, contentType: "IMAGE/PNG" },
    ];
    expect(inlineCandidates(list).map(a => a.id)).toEqual(["2"]);
  });
});

describe("resolveCidSources", () => {
  it("shows cid: images through URLs and restores them on save", () => {
    const html = `<p><img src="cid:image001.png@01D" alt=""><img src="cid:missing"></p>`;
    const urls = new Map([["image001.png@01D", "blob:http://app/1"]]);
    const resolved = resolveCidSources(html, urls);
    expect(resolved.html).toBe(`<p><img src="blob:http://app/1" alt=""><img src="cid:missing"></p>`);
    expect(replaceInlineImageSources(resolved.html, resolved.sources)).toBe(html);
  });

  it("matches encoded and bracketed Content-IDs", () => {
    const resolved = resolveCidSources(`<img src="cid:a%40b">`, new Map([["a@b", "blob:x"]]));
    expect(resolved.html).toBe(`<img src="blob:x">`);
    expect(resolved.sources.get("blob:x")).toBe("cid:a%40b");
  });

  it("returns the body unchanged without URLs", () => {
    expect(resolveCidSources(`<img src="cid:a">`, new Map()).html).toBe(`<img src="cid:a">`);
  });
});
