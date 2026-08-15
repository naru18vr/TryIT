import fs from "node:fs";

const catalogSource = fs.readFileSync(
  "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts",
  "utf8",
);
const match = catalogSource.match(
  /export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s,
);

if (!match) {
  throw new Error("カタログを読み取れませんでした。");
}

const catalog = JSON.parse(match[1]);
const prefixes = [
  "「分詞」とは",
  "There be 主語＋分詞",
  "主格の補語となる分詞",
  "目的格の補語となる分詞",
  "「分詞構文」とは",
  "受動態の分詞構文",
  "付帯状況を表す分詞構文",
  "分詞構文の否定形・完了形",
  "独立分詞構文",
  "分詞構文の慣用表現",
  "付帯状況のwith",
  "感情を表す他動詞",
];

const items = catalog
  .filter(
    (item) =>
      item.grade === "高校" &&
      item.subject === "英語" &&
      prefixes.some((prefix) => item.unit.startsWith(prefix)),
  )
  .sort((a, b) => prefixes.findIndex((prefix) => a.unit.startsWith(prefix)) - prefixes.findIndex((prefix) => b.unit.startsWith(prefix)) || a.title.localeCompare(b.title, "ja"));

console.log(
  JSON.stringify(
    {
      expectedCount: items.length,
      ids: items.map((item) => item.id),
      items: items.map(({ id, title, unit }) => ({ id, title, unit })),
    },
    null,
    2,
  ),
);
