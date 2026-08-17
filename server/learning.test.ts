import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { TRYIT_CATALOG } from "./data/tryitCatalog";

const mocks = vi.hoisted(() => ({
  getUserWatchHistory: vi.fn(),
  getUserWatchedVideoIds: vi.fn(),
  hasUserWatchedVideo: vi.fn(),
  markVideoWatched: vi.fn(),
  getVideoNote: vi.fn(),
  getVideoNoteCount: vi.fn(),
  upsertVideoNote: vi.fn(),
}));

vi.mock("./db", () => mocks);

const { appRouter } = await import("./routers");

function createContext(
  role: "user" | "admin" = "user",
  userId = 100
): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "learning-test-user",
      name: "Learning Test",
      email: "learning@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Try IT learning APIs", () => {
  beforeEach(() => {
    mocks.getUserWatchHistory.mockReset();
    mocks.getUserWatchedVideoIds.mockReset();
    mocks.hasUserWatchedVideo.mockReset();
    mocks.markVideoWatched.mockReset();
    mocks.getVideoNote.mockReset();
    mocks.getVideoNoteCount.mockReset();
    mocks.upsertVideoNote.mockReset();
    mocks.getUserWatchHistory.mockResolvedValue([]);
    mocks.getUserWatchedVideoIds.mockResolvedValue([]);
    mocks.hasUserWatchedVideo.mockResolvedValue(false);
    mocks.getVideoNote.mockResolvedValue(undefined);
    mocks.getVideoNoteCount.mockResolvedValue(1);
  });

  it("ships a direct URL for every catalog video and exposes subject filters", async () => {
    expect(TRYIT_CATALOG.length).toBeGreaterThan(3900);
    expect(new Set(TRYIT_CATALOG.map(video => video.id)).size).toBe(
      TRYIT_CATALOG.length
    );
    expect(
      TRYIT_CATALOG.every(video =>
        video.youtubeUrl.startsWith("https://www.youtube.com/watch?v=")
      )
    ).toBe(true);

    const caller = appRouter.createCaller({ ...createContext(), user: null });
    const filters = await caller.catalog.filters();
    expect(filters.grades.length).toBeGreaterThan(3);
    expect(filters.totalVideos).toBe(TRYIT_CATALOG.length);
  });

  it("filters catalog videos and returns watched state for a signed-in learner", async () => {
    const video = TRYIT_CATALOG.find(
      item => item.grade === "高校" && item.subject === "数学"
    )!;
    mocks.getUserWatchedVideoIds.mockResolvedValue([video.id]);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.catalog.list({
      grade: "高校",
      subject: "数学",
      page: 1,
      pageSize: 12,
    });

    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every(
        item => item.grade === "高校" && item.subject === "数学"
      )
    ).toBe(true);
    expect(
      result.items.some(item => item.id === video.id && item.isWatched)
    ).toBe(true);
    expect(mocks.getUserWatchedVideoIds).toHaveBeenCalledWith(
      100,
      expect.any(Array)
    );
    expect(mocks.getUserWatchedVideoIds.mock.calls[0]?.[1]).toEqual(
      result.items.map(item => item.id)
    );
    expect(mocks.getUserWatchHistory).not.toHaveBeenCalled();
  });

  it("looks up one watched video without loading the user's full history", async () => {
    const video = TRYIT_CATALOG[0]!;
    mocks.getVideoNote.mockResolvedValue({
      summary: "summary",
      keyPoints: "key points",
      updatedAt: new Date(),
    });
    mocks.hasUserWatchedVideo.mockResolvedValue(true);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.catalog.get({ videoId: video.id });

    expect(result.isWatched).toBe(true);
    expect(mocks.hasUserWatchedVideo).toHaveBeenCalledWith(100, video.id);
    expect(mocks.getUserWatchHistory).not.toHaveBeenCalled();
  });

  it("does not share watched state between users", async () => {
    const video = TRYIT_CATALOG[0]!;
    mocks.getUserWatchedVideoIds.mockImplementation(async (userId: number) =>
      userId === 100 ? [video.id] : []
    );

    const watchedResult = await appRouter
      .createCaller(createContext("user", 100))
      .catalog.list({ page: 1, pageSize: 1 });
    const otherUserResult = await appRouter
      .createCaller(createContext("user", 200))
      .catalog.list({ page: 1, pageSize: 1 });

    expect(watchedResult.items[0]?.isWatched).toBe(true);
    expect(otherUserResult.items[0]?.isWatched).toBe(false);
    expect(mocks.getUserWatchedVideoIds).toHaveBeenNthCalledWith(1, 100, [
      video.id,
    ]);
    expect(mocks.getUserWatchedVideoIds).toHaveBeenNthCalledWith(2, 200, [
      video.id,
    ]);
    expect(mocks.getUserWatchHistory).not.toHaveBeenCalled();
  });

  it("persists a watched record for an authenticated learner", async () => {
    const caller = appRouter.createCaller(createContext());
    const video = TRYIT_CATALOG[0]!;

    await expect(
      caller.catalog.markWatched({ videoId: video.id })
    ).resolves.toEqual({ success: true });
    await expect(
      caller.catalog.markWatched({ videoId: video.id })
    ).resolves.toEqual({ success: true });
    expect(mocks.markVideoWatched).toHaveBeenCalledTimes(2);
    expect(mocks.markVideoWatched).toHaveBeenNthCalledWith(1, 100, video.id);
  });

  it("rejects anonymous watched updates", async () => {
    const caller = appRouter.createCaller({ ...createContext(), user: null });

    await expect(
      caller.catalog.markWatched({ videoId: TRYIT_CATALOG[0]!.id })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocks.markVideoWatched).not.toHaveBeenCalled();
  });

  it("rejects note writes by normal users", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(
      caller.notes.upsert({
        videoId: TRYIT_CATALOG[0]!.id,
        summary: "summary",
        keyPoints: "key points",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.upsertVideoNote).not.toHaveBeenCalled();
  });

  it("allows an administrator to register both summary and key points", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const video = TRYIT_CATALOG[0]!;

    await expect(
      caller.notes.upsert({
        videoId: video.id,
        summary: "単元全体の流れを確認するための要約です。",
        keyPoints: "用語を確認する\n説明できるか確かめる",
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.upsertVideoNote).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: video.id,
        updatedByUserId: 100,
      })
    );
  });

  it("reports the number of prepared preview-and-review notes", async () => {
    const caller = appRouter.createCaller({ ...createContext(), user: null });
    const result = await caller.notes.coverage();

    expect(result).toEqual({
      completed: 1,
      total: TRYIT_CATALOG.length,
      percentage: 0,
    });
    expect(mocks.getVideoNoteCount).toHaveBeenCalledWith(
      TRYIT_CATALOG.map(video => video.id)
    );
  });

  it("calculates coverage from catalog videos and ignores orphan notes", async () => {
    mocks.getVideoNoteCount.mockImplementation(
      async (videoIds: string[]) => videoIds.length
    );
    const caller = appRouter.createCaller({ ...createContext(), user: null });

    const result = await caller.notes.coverage();

    expect(result).toEqual({
      completed: TRYIT_CATALOG.length,
      total: TRYIT_CATALOG.length,
      percentage: 100,
    });
    expect(mocks.getVideoNoteCount).toHaveBeenCalledWith(
      TRYIT_CATALOG.map(video => video.id)
    );
  });

  it("keeps learning progress on the full history query", async () => {
    const firstVideo = TRYIT_CATALOG[0]!;
    mocks.getUserWatchHistory.mockResolvedValue([
      { videoId: firstVideo.id, watchedAt: new Date("2026-01-01T00:00:00Z") },
      { videoId: "orphan-video", watchedAt: new Date("2026-01-02T00:00:00Z") },
    ]);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.learning.myProgress();

    expect(result.watchedCount).toBe(1);
    expect(result.history).toHaveLength(1);
    expect(result.history[0]?.id).toBe(firstVideo.id);
    expect(mocks.getUserWatchHistory).toHaveBeenCalledWith(100);
  });

  it("does not turn a database outage into empty protected progress", async () => {
    const { DatabaseUnavailableError } = await import("../shared/_core/errors");
    mocks.getUserWatchHistory.mockRejectedValue(new DatabaseUnavailableError());
    const caller = appRouter.createCaller(createContext());

    await expect(caller.learning.myProgress()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      cause: expect.any(DatabaseUnavailableError),
    });
  });
});
