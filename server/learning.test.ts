import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { TRYIT_CATALOG } from "./data/tryitCatalog";

const mocks = vi.hoisted(() => ({
  getUserWatchHistory: vi.fn(),
  markVideoWatched: vi.fn(),
  getVideoNote: vi.fn(),
  getVideoNoteCount: vi.fn(),
  upsertVideoNote: vi.fn(),
}));

vi.mock("./db", () => mocks);

const { appRouter } = await import("./routers");

function createContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 100,
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
    mocks.markVideoWatched.mockReset();
    mocks.getVideoNote.mockReset();
    mocks.getVideoNoteCount.mockReset();
    mocks.upsertVideoNote.mockReset();
    mocks.getUserWatchHistory.mockResolvedValue([]);
    mocks.getVideoNote.mockResolvedValue(undefined);
    mocks.getVideoNoteCount.mockResolvedValue(1);
  });

  it("ships a direct URL for every catalog video and exposes subject filters", async () => {
    expect(TRYIT_CATALOG.length).toBeGreaterThan(3900);
    expect(new Set(TRYIT_CATALOG.map((video) => video.id)).size).toBe(TRYIT_CATALOG.length);
    expect(TRYIT_CATALOG.every((video) => video.youtubeUrl.startsWith("https://www.youtube.com/watch?v="))).toBe(true);

    const caller = appRouter.createCaller({ ...createContext(), user: null });
    const filters = await caller.catalog.filters();
    expect(filters.grades.length).toBeGreaterThan(3);
    expect(filters.totalVideos).toBe(TRYIT_CATALOG.length);
  });

  it("filters catalog videos and returns watched state for a signed-in learner", async () => {
    const video = TRYIT_CATALOG.find((item) => item.grade === "高校" && item.subject === "数学")!;
    mocks.getUserWatchHistory.mockResolvedValue([{ videoId: video.id }]);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.catalog.list({ grade: "高校", subject: "数学", page: 1, pageSize: 12 });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((item) => item.grade === "高校" && item.subject === "数学")).toBe(true);
    expect(result.items.some((item) => item.id === video.id && item.isWatched)).toBe(true);
  });

  it("persists a watched record for an authenticated learner", async () => {
    const caller = appRouter.createCaller(createContext());
    const video = TRYIT_CATALOG[0]!;

    await expect(caller.catalog.markWatched({ videoId: video.id })).resolves.toEqual({ success: true });
    expect(mocks.markVideoWatched).toHaveBeenCalledWith(100, video.id);
  });

  it("allows an administrator to register both summary and key points", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const video = TRYIT_CATALOG[0]!;

    await expect(caller.notes.upsert({
      videoId: video.id,
      summary: "単元全体の流れを確認するための要約です。",
      keyPoints: "用語を確認する\n説明できるか確かめる",
    })).resolves.toEqual({ success: true });

    expect(mocks.upsertVideoNote).toHaveBeenCalledWith(expect.objectContaining({
      videoId: video.id,
      updatedByUserId: 100,
    }));
  });

  it("reports the number of prepared preview-and-review notes", async () => {
    const caller = appRouter.createCaller({ ...createContext(), user: null });
    const result = await caller.notes.coverage();

    expect(result).toEqual({ completed: 1, total: TRYIT_CATALOG.length, percentage: 0 });
    expect(mocks.getVideoNoteCount).toHaveBeenCalledTimes(1);
  });
});
