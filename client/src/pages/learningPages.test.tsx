import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: {
    user: { id: 1, name: "テスト太郎", role: "user" as "user" | "admin" } as { id: number; name: string; role: "user" | "admin" } | null,
    loading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  },
  filters: { grades: ["中学3年", "高校"], subjects: ["数学", "英語", "世界史"], units: ["二次関数", "昭和時代"], totalVideos: 2 },
  catalog: {
    total: 1,
    page: 1,
    pageSize: 12,
    totalPages: 1,
    items: [{ id: "video-1", youtubeUrl: "https://www.youtube.com/watch?v=video-1", title: "二次関数の基礎", grade: "高校", subject: "数学", unit: "二次関数", thumbnailUrl: "https://i.ytimg.com/vi/video-1/hqdefault.jpg", durationSeconds: 600, durationLabel: "10:00", isWatched: true }],
  },
  video: {
    video: { id: "video-1", youtubeUrl: "https://www.youtube.com/watch?v=video-1", title: "二次関数の基礎", grade: "高校", subject: "数学", unit: "二次関数", thumbnailUrl: "https://i.ytimg.com/vi/video-1/hqdefault.jpg", durationSeconds: 600, durationLabel: "10:00" },
    note: null,
    isWatched: false,
  },
  progress: { watchedCount: 3, totalVideos: 10, progressPercentage: 30, history: [] as Array<unknown> },
  progressError: false,
  refetchProgress: vi.fn(),
  catalogInput: null as { grade?: string; subject?: string } | null,
  markWatched: vi.fn(),
  startLogin: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => state.auth }));
vi.mock("@/const", () => ({ startLogin: state.startLogin }));
vi.mock("@/components/YouTubePlayer", () => ({ YouTubePlayer: ({ onPlaybackStarted }: { onPlaybackStarted: () => void }) => <button onClick={onPlaybackStarted}>再生テスト</button> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ catalog: { get: { invalidate: vi.fn() }, list: { invalidate: vi.fn() } }, learning: { myProgress: { invalidate: vi.fn() } } }),
    catalog: {
      filters: { useQuery: () => ({ data: state.filters }) },
      list: { useQuery: (input: { grade?: string; subject?: string }) => { state.catalogInput = input; return { data: state.catalog, isLoading: false }; } },
      get: { useQuery: () => ({ data: state.video, isLoading: false }) },
      markWatched: { useMutation: () => ({ mutate: state.markWatched, isPending: false }) },
    },
    notes: { coverage: { useQuery: () => ({ data: { completed: 1, total: 2, percentage: 50 } }) }, upsert: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    learning: { myProgress: { useQuery: () => ({ data: state.progress, isLoading: false, isError: state.progressError, refetch: state.refetchProgress }) } },
  },
}));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>, useRoute: () => [true, { videoId: "video-1" }] }));

import Home from "./Home";
import MyLearning from "./MyLearning";
import WatchVideo from "./WatchVideo";

afterEach(cleanup);

describe("learning page rendering", () => {
  beforeEach(() => {
    state.auth = { user: { id: 1, name: "テスト太郎", role: "user" }, loading: false, isAuthenticated: true, logout: vi.fn() };
    state.catalog.items[0]!.isWatched = true;
    state.progress = { watchedCount: 3, totalVideos: 10, progressPercentage: 30, history: [] };
    state.progressError = false;
    state.refetchProgress.mockReset();
    state.catalogInput = null;
    state.markWatched.mockReset();
    state.startLogin.mockReset();
  });

  it("renders a watched badge and applies a selected grade-and-subject shortcut to the catalog query", () => {
    render(<Home />);
    expect(screen.getByText("視聴済み")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "高校・数学" }));
    expect(state.catalogInput).toMatchObject({ grade: "高校", subject: "数学" });
  });

  it("renders watched count and percentage on the authenticated learning page", () => {
    render(<MyLearning />);
    expect(screen.getByText("30%")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("全 10 本中")).toBeTruthy();
  });

  it("renders the sign-in prompt when the learning page has no authenticated user", () => {
    state.auth = { user: null, loading: false, isAuthenticated: false, logout: vi.fn() };
    render(<MyLearning />);
    expect(screen.getByText("ログインする")).toBeTruthy();
    fireEvent.click(screen.getByText("ログインする"));
    expect(state.startLogin).toHaveBeenCalledTimes(1);
  });

  it("renders a retry state rather than an endless loading indicator when progress retrieval fails", () => {
    state.progressError = true;
    render(<MyLearning />);
    expect(screen.getByText("進捗を読み込めませんでした。")).toBeTruthy();
    fireEvent.click(screen.getByText("再読み込みする"));
    expect(state.refetchProgress).toHaveBeenCalledTimes(1);
  });

  it("records a video when the official player reports playback", () => {
    render(<WatchVideo />);
    fireEvent.click(screen.getByText("再生テスト"));
    expect(state.markWatched).toHaveBeenCalledWith({ videoId: "video-1" });
  });
});
