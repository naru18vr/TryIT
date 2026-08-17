import fs from "node:fs";

const grade = process.env.GRADE ?? "中学2年";
const maxItems = Number(process.env.LIMIT ?? 10);
const requestedUnit = process.env.UNIT;
const titleContains = process.env.TITLE_CONTAINS;
const catalogSource = fs.readFileSync("/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts", "utf8");
const match = catalogSource.match(/export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s);
if (!match) throw new Error("カタログを読み取れませんでした。");

const catalog = JSON.parse(match[1]);
const candidates = catalog.filter((item) =>
  item.grade === grade && (!titleContains || item.title.includes(titleContains)),
);
const byUnit = new Map();
for (const item of candidates) {
  const items = byUnit.get(item.unit) ?? [];
  items.push(item);
  byUnit.set(item.unit, items);
}

if (process.env.LIST_UNITS === "1") {
  const unitSummary = [...byUnit.entries()]
    .map(([unit, items]) => ({ unit, count: items.length }))
    .sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit, "ja"));
  console.log(JSON.stringify({ grade, units: unitSummary }, null, 2));
  process.exit(0);
}

const selectedUnit = requestedUnit && byUnit.has(requestedUnit)
  ? requestedUnit
  : [...byUnit.entries()]
  .filter(([, items]) => items.length >= 3)
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ja"))[0]?.[0];
const items = (selectedUnit ? byUnit.get(selectedUnit) : candidates).slice(0, maxItems);
const batch = {
  grade,
  titleContains: titleContains ?? null,
  selectedUnit: selectedUnit ?? "混合単元",
  count: items.length,
  items: items.map(({ id, title, subject, unit, youtubeUrl, durationLabel }) => ({ id, title, subject, unit, youtubeUrl, durationLabel })),
};

const output = `/home/ubuntu/tryit-learning-companion/note-batch-${grade.replaceAll("年", "")}.json`;
fs.writeFileSync(output, JSON.stringify(batch, null, 2));
console.log(JSON.stringify(batch, null, 2));
