import { beforeEach, describe, expect, it, vi } from "vitest";
import { reloadOnce, withChunkRetry } from "../../lazy";

describe("chunk load recovery", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("reloads once when a chunk cannot be loaded", async () => {
    const reload = vi.fn();
    const load = withChunkRetry(() => Promise.reject(new TypeError("Failed to fetch dynamically imported module")), window.sessionStorage, reload);
    const pending = load();
    await new Promise(r => setTimeout(r, 0));
    expect(reload).toHaveBeenCalledTimes(1);
    // A second failure after the reload is reported instead of looping
    await expect(withChunkRetry(() => Promise.reject(new Error("again")), window.sessionStorage, reload)()).rejects.toThrow("again");
    expect(reload).toHaveBeenCalledTimes(1);
    void pending;
  });

  it("allows another reload after a successful load", async () => {
    const reload = vi.fn();
    expect(reloadOnce(window.sessionStorage, reload)).toBe(true);
    await withChunkRetry(() => Promise.resolve({ default: 1 }), window.sessionStorage, reload)();
    expect(reloadOnce(window.sessionStorage, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
