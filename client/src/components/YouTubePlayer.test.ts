import { describe, expect, it } from "vitest";
import { shouldRecordPlayback, shouldUsePlayerFallback } from "./YouTubePlayer";

describe("YouTube playback detection", () => {
  it("records only the first playing transition for an unrecorded video", () => {
    expect(shouldRecordPlayback(true, false, false)).toBe(true);
    expect(shouldRecordPlayback(false, false, false)).toBe(false);
    expect(shouldRecordPlayback(true, true, false)).toBe(false);
    expect(shouldRecordPlayback(true, false, true)).toBe(false);
  });

  it("uses the official embed as a fallback until the player is ready or when loading fails", () => {
    expect(shouldUsePlayerFallback(false, false)).toBe(true);
    expect(shouldUsePlayerFallback(true, false)).toBe(false);
    expect(shouldUsePlayerFallback(true, true)).toBe(true);
  });
});
