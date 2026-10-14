import { afterEach, describe, expect, it, vi } from "vitest";
import { Client } from "@microsoft/microsoft-graph-client";

type Handler = (url: string, init: RequestInit) => unknown;
let handler: Handler = () => ({});
const calls: { url: string; init: RequestInit }[] = [];

const testClient = Client.initWithMiddleware({
  baseUrl: "https://graph.example.com/",
  middleware: {
    execute: async (context: any) => {
      const url = typeof context.request === "string" ? context.request : context.request.url;
      calls.push({ url, init: context.options });
      context.response = new Response(JSON.stringify(handler(url, context.options)), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    },
  } as any,
});

vi.mock("../utils", () => ({ get graphClient() { return testClient; } }));

const { request, getAll, batch, retryDelay } = await import("../graph");

const fullUrl = (req: unknown) => (req as { buildFullUrl(): string }).buildFullUrl();

afterEach(() => {
  calls.length = 0;
  vi.useRealTimers();
});

describe("request", () => {
  it("encodes $filter, $orderby and $select values once", () => {
    const url = fullUrl(request("/me/contacts", {
      filter: "startswith(displayName,'AT&T') or emailAddresses/any(a:a/address eq 'john+news@x.com#1')",
      orderby: "displayName desc",
      select: ["id", "displayName"],
    }));
    const query = new URL(url).searchParams;
    expect(query.get("$filter")).toBe("startswith(displayName,'AT&T') or emailAddresses/any(a:a/address eq 'john+news@x.com#1')");
    expect(query.get("$orderby")).toBe("displayName desc");
    expect(query.get("$select")).toBe("id,displayName");
    expect(url).not.toContain("#");
  });

  it("does not double encode $search", () => {
    const query = new URL(fullUrl(request("/me/messages", { search: "\"100% & more\"" }))).searchParams;
    expect(query.get("$search")).toBe("\"100% & more\"");
  });

  it("keeps nested $expand options intact", () => {
    const query = new URL(fullUrl(request("/me/mailFolders", { expand: "childFolders($select=id,displayName)" }))).searchParams;
    expect(query.get("$expand")).toBe("childFolders($select=id,displayName)");
  });
});

describe("getAll", () => {
  it("sends the request headers on every page", async () => {
    handler = url => url.includes("page2")
      ? { value: [{ id: 2 }] }
      : { value: [{ id: 1 }], "@odata.nextLink": "https://graph.example.com/v1.0/me/events?page2" };
    const items = await getAll("/me/events", { headers: { Prefer: "outlook.timezone=\"Europe/Vienna\"" } });
    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(calls).toHaveLength(2);
    calls.forEach(c => expect(new Headers(c.init.headers).get("Prefer")).toBe("outlook.timezone=\"Europe/Vienna\""));
  });
});

describe("batch", () => {
  it("retries throttled sub-requests once after Retry-After", async () => {
    vi.useFakeTimers();
    let round = 0;
    handler = (_url, init) => {
      const { requests } = JSON.parse(String(init.body));
      round++;
      return {
        responses: requests.map((r: any) => round === 1 && r.id === "b"
          ? { id: r.id, status: 429, headers: { "Retry-After": "2" } }
          : { id: r.id, status: 200, body: { ok: r.id } }),
      };
    };
    const promise = batch([
      { id: "a", method: "GET", url: "/me/a" },
      { id: "b", method: "GET", url: "/me/b", dependsOn: ["a"] },
    ]);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;
    expect(result.map(r => r.status)).toEqual([200, 200]);
    expect(calls).toHaveLength(2);
    const retried = JSON.parse(String(calls[1].init.body)).requests;
    expect(retried).toHaveLength(1);
    expect(retried[0].id).toBe("b");
    expect(retried[0].dependsOn).toBeUndefined();
  });

  it("reports a still throttled item after one retry", async () => {
    vi.useFakeTimers();
    handler = (_url, init) => ({
      responses: JSON.parse(String(init.body)).requests.map((r: any) => ({ id: r.id, status: 503 })),
    });
    const promise = batch([{ id: "x", method: "GET", url: "/me/x" }]);
    await vi.advanceTimersByTimeAsync(1000);
    expect((await promise)[0].status).toBe(503);
    expect(calls).toHaveLength(2);
  });
});

describe("retryDelay", () => {
  it("uses the largest Retry-After, case-insensitive, capped", () => {
    expect(retryDelay([{ id: "a", status: 429, headers: { "retry-after": "3" } }, { id: "b", status: 429, headers: { "Retry-After": "5" } }])).toBe(5);
    expect(retryDelay([{ id: "a", status: 503 }])).toBe(1);
    expect(retryDelay([{ id: "a", status: 429, headers: { "Retry-After": "120" } }])).toBe(10);
    expect(retryDelay([{ id: "a", status: 429, headers: { "Retry-After": "0" } }])).toBe(0);
  });
});
