import { describe, expect, it, vi } from "vitest";
import { DatabaseUnavailableError } from "../shared/_core/errors";

vi.hoisted(() => {
  process.env.DATABASE_URL = "";
});

const db = await import("./db");

describe("database availability failures", () => {
  it.each([
    ["watch history", () => db.getUserWatchHistory(1)],
    ["single watched lookup", () => db.hasUserWatchedVideo(1, "video-1")],
    ["watched id lookup", () => db.getUserWatchedVideoIds(1, ["video-1"])],
    ["video note", () => db.getVideoNote("video-1")],
    ["note coverage", () => db.getVideoNoteCount(["video-1"])],
    ["user lookup", () => db.getUserByOpenId("user-1")],
    ["watched update", () => db.markVideoWatched(1, "video-1")],
  ])(
    "surfaces %s as an explicit unavailable error",
    async (_operation, call) => {
      await expect(call()).rejects.toBeInstanceOf(DatabaseUnavailableError);
    }
  );
});
