import { beforeEach, describe, expect, it, vi } from "vitest";
import * as graph from "../../../api/graph";
import { addEventFileAttachment, getCalendarView, getSharedCalendarView, MAX_ATTACHMENT_SIZE, patchEvent, postEvent } from "../../../api/calendar";

vi.mock("../../../api/graph", async () => {
  const actual = await vi.importActual<typeof import("../../../api/graph")>("../../../api/graph");
  return { ...actual, get: vi.fn(), getAll: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() };
});

const post = vi.mocked(graph.post);
const patch = vi.mocked(graph.patch);
const getAll = vi.mocked(graph.getAll);
const prefer = { headers: { Prefer: 'outlook.timezone="Europe/Vienna"' } };

describe("calendar api time zone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests POST and PATCH responses in the given zone", async () => {
    await postEvent({ subject: "x" }, "cal", "Europe/Vienna");
    expect(post).toHaveBeenCalledWith("/me/calendars/cal/events", { subject: "x" }, prefer);
    await patchEvent({ id: "e1", subject: "y" }, "Europe/Vienna");
    expect(patch).toHaveBeenCalledWith("/me/events/e1", { subject: "y" }, prefer);
  });

  it("passes the Prefer header to getAll for every calendarView page", async () => {
    getAll.mockResolvedValue([]);
    await getCalendarView("cal", "a", "b", "Europe/Vienna");
    await getSharedCalendarView("bob@example.com", "a", "b", "Europe/Vienna");
    getAll.mock.calls.forEach(call => expect(call[1]).toMatchObject(prefer));
  });

  it("rejects files above the Graph limit before uploading", async () => {
    const big = { name: "huge.iso", size: MAX_ATTACHMENT_SIZE + 1, type: "" } as File;
    await expect(addEventFileAttachment("e1", big)).rejects.toThrow("The file is too large");
    expect(post).not.toHaveBeenCalled();
  });
});
