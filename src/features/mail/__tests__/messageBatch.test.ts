import { beforeEach, describe, expect, it, vi } from "vitest";
import * as graph from "../../../api/graph";
import { messageBatch, moveMessages } from "../../../api/messages";

vi.mock("../../../api/graph", async importOriginal => ({
  ...await importOriginal<typeof import("../../../api/graph")>(),
  batch: vi.fn(),
}));

const batch = vi.mocked(graph.batch);
const requests = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), method: "DELETE" as const, url: `/me/messages/m${i}` }));

beforeEach(() => vi.resetAllMocks());

describe("messageBatch", () => {
  it("keeps results of earlier chunks when a later chunk fails", async () => {
    batch
      .mockImplementationOnce(async chunk => chunk.map(r => ({ id: r.id, status: 204 })))
      .mockRejectedValueOnce(new graph.ApiError("offline", 0));
    const responses = await messageBatch(requests(25));
    expect(responses).toHaveLength(25);
    expect(responses.slice(0, 20).every(r => r.status === 204)).toBe(true);
    expect(responses.slice(20).every(r => r.status === 0)).toBe(true);
  });

  it("retries throttled requests after Retry-After", async () => {
    batch
      .mockImplementationOnce(async chunk => chunk.map(r => r.id === "1" ?
        { id: r.id, status: 429, headers: { "Retry-After": "0" } } : { id: r.id, status: 204 }))
      .mockImplementationOnce(async chunk => chunk.map(r => ({ id: r.id, status: 204 })));
    const responses = await messageBatch(requests(3));
    expect(batch).toHaveBeenCalledTimes(2);
    expect(batch.mock.calls[1][0].map(r => r.id)).toEqual(["1"]);
    expect(responses.map(r => r.status)).toEqual([204, 204, 204]);
  });

  it("returns responses in request order for message moves", async () => {
    batch.mockImplementationOnce(async chunk => [...chunk].reverse().map(r => ({ id: r.id, status: 201, body: { id: "new" + r.id } })));
    const responses = await moveMessages(["a", "b"], "archive");
    expect(responses.map(r => r.body?.id)).toEqual(["new0", "new1"]);
  });
});
