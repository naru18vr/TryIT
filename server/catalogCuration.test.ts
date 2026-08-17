import { describe, expect, it } from "vitest";
import { TRYIT_CATALOG } from "./data/tryitCatalog";

const nonLessonSignals = [
  /オンライン指導を詳しく解説/i,
  /定期テスト.*(攻略|対策|点数|成績)/i,
  /(点数|成績).*(上がる|アップ)/i,
  /初見問題対策/i,
  /勉強法/i,
  /暗記法/i,
  /記憶法/i,
  /プロ講師.*(伝授|解説)/i,
  /ヤマを張る/i,
  /^動画でわかる映像授業Try IT$/i,
];

describe("curated Try IT catalog", () => {
  it("contains only classified lessons and no known announcement, test-strategy, or service-introduction titles", () => {
    expect(TRYIT_CATALOG).toHaveLength(3906);
    expect(TRYIT_CATALOG.every((item) => item.grade && item.subject && item.unit)).toBe(true);
    expect(TRYIT_CATALOG.filter((item) => nonLessonSignals.some((signal) => signal.test(item.title)))).toEqual([]);
  });

  it("excludes the reviewed non-lesson video identifiers", () => {
    const ids = new Set(TRYIT_CATALOG.map((item) => item.id));
    ["M5r68vRcQf8", "haJBy_hhrms", "U2vTunCmXZU", "tman3v_8ygA", "Xmf87IrUlzM", "v8pm0u3ITSc", "tsHewt5zsR4"].forEach((id) => expect(ids.has(id)).toBe(false));
  });
});
