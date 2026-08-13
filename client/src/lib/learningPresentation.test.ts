import { describe, expect, it } from "vitest";
import {
  ALL_FILTER_VALUE,
  buildCatalogQuery,
  getMyLearningScreenState,
  getVideoCardState,
} from "./learningPresentation";

describe("learning presentation state", () => {
  it("converts the all-filter UI state into an unfiltered catalog query", () => {
    expect(buildCatalogQuery({
      query: "  二次関数  ",
      grade: ALL_FILTER_VALUE,
      subject: ALL_FILTER_VALUE,
      unit: ALL_FILTER_VALUE,
      page: 2,
      pageSize: 12,
    })).toEqual({ query: "二次関数", grade: undefined, subject: undefined, unit: undefined, page: 2, pageSize: 12 });
  });

  it("preserves selected subject and unit for filtered video search", () => {
    expect(buildCatalogQuery({
      query: "",
      grade: "高校",
      subject: "数学",
      unit: "二次関数",
      page: 1,
      pageSize: 12,
    })).toMatchObject({ grade: "高校", subject: "数学", unit: "二次関数" });
  });

  it("shows a watched badge only for watched videos", () => {
    expect(getVideoCardState(true)).toEqual({ isWatched: true, label: "視聴済み" });
    expect(getVideoCardState(false)).toEqual({ isWatched: false, label: "未視聴" });
  });

  it("selects sign-in, empty, and history states for the learning page", () => {
    expect(getMyLearningScreenState(false, 3)).toBe("sign-in");
    expect(getMyLearningScreenState(true, 0)).toBe("empty-history");
    expect(getMyLearningScreenState(true, 1)).toBe("history");
  });
});
