import fs from "node:fs";

const grade = process.env.GRADE ?? "中学2年";
const baseUrl = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const catalogPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const outputPath = `/tmp/${grade.replaceAll("年", "").replaceAll(" ", "-")}-watch-route-audit.json`;

const catalogSource = fs.readFileSync(catalogPath, "utf8");
const match = catalogSource.match(
  /export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s,
);
if (!match) throw new Error("カタログを読み取れませんでした。");

const items = JSON.parse(match[1]).filter((item) => item.grade === grade);
const failures = [];
const concurrency = 12;
let cursor = 0;

async function inspect(item) {
  const input = encodeURIComponent(JSON.stringify({ json: { videoId: item.id } }));
  const response = await fetch(`${baseUrl}/api/trpc/catalog.get?input=${input}`);
  if (!response.ok) {
    failures.push({ ...item, reason: `HTTP ${response.status}` });
    return;
  }

  const payload = await response.json();
  const note = payload?.result?.data?.json?.note;
  if (!note?.summary?.trim() || !note?.keyPoints?.includes("復習では")) {
    failures.push({ ...item, reason: "note summary/keyPoints unavailable" });
  }
}

async function worker() {
  while (cursor < items.length) {
    const item = items[cursor++];
    try {
      await inspect(item);
    } catch (error) {
      failures.push({ ...item, reason: error instanceof Error ? error.message : String(error) });
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
const report = {
  grade,
  route: "catalog.get",
  catalogCount: items.length,
  renderableNoteCount: items.length - failures.length,
  failures,
};
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, outputPath }, null, 2));
