import { describe, expect, it, vi } from "vitest";

const fakeDb = vi.hoisted(() => {
  const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
  const insert = vi.fn(() => ({ values }));
  return { db: { insert }, insert, values, onDuplicateKeyUpdate };
});

vi.hoisted(() => {
  process.env.DATABASE_URL = "mysql://test@example.invalid/test";
});

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => fakeDb.db) }));

const { markVideoWatched } = await import("./db");

describe("watch history writes", () => {
  it("uses the unique user/video key to update the watched timestamp", async () => {
    await markVideoWatched(7, "video-1");
    await markVideoWatched(7, "video-1");

    expect(fakeDb.insert).toHaveBeenCalledTimes(2);
    expect(fakeDb.values).toHaveBeenCalledTimes(2);
    expect(fakeDb.onDuplicateKeyUpdate).toHaveBeenCalledTimes(2);

    const firstValues = fakeDb.values.mock.calls[0]?.[0] as {
      userId: number;
      videoId: string;
      watchedAt: Date;
    };
    const firstUpdate = fakeDb.onDuplicateKeyUpdate.mock.calls[0]?.[0] as {
      set: { watchedAt: Date; updatedAt: Date };
    };
    expect(firstValues).toMatchObject({ userId: 7, videoId: "video-1" });
    expect(firstValues.watchedAt).toBeInstanceOf(Date);
    expect(firstUpdate.set.watchedAt).toBe(firstValues.watchedAt);
    expect(firstUpdate.set.updatedAt).toBe(firstValues.watchedAt);

    const secondValues = fakeDb.values.mock.calls[1]?.[0] as {
      watchedAt: Date;
    };
    const secondUpdate = fakeDb.onDuplicateKeyUpdate.mock.calls[1]?.[0] as {
      set: { watchedAt: Date; updatedAt: Date };
    };
    expect(secondUpdate.set.watchedAt).toBe(secondValues.watchedAt);
    expect(secondUpdate.set.updatedAt).toBe(secondValues.watchedAt);
  });
});
