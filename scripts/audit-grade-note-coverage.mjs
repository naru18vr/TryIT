import fs from "node:fs";
import mysql from "mysql2/promise";

const grade = process.env.GRADE ?? "中学2年";
const catalogPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const outputPath = `/tmp/${grade.replaceAll("年", "").replaceAll(" ", "-")}-note-coverage-audit.json`;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL が設定されていません。");
}

const catalogSource = fs.readFileSync(catalogPath, "utf8");
const match = catalogSource.match(
  /export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s,
);
if (!match) throw new Error("カタログを読み取れませんでした。");

const catalog = JSON.parse(match[1]);
const items = catalog.filter((item) => item.grade === grade);
const ids = items.map((item) => item.id);
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(
    `SELECT videoId, summary, keyPoints FROM videoNotes WHERE videoId IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  const notesByVideoId = new Map(rows.map((note) => [note.videoId, note]));
  const missing = [];
  const incomplete = [];

  for (const item of items) {
    const note = notesByVideoId.get(item.id);
    if (!note) {
      missing.push(item);
      continue;
    }
    if (!note.summary?.trim() || !note.keyPoints?.includes("復習では")) {
      incomplete.push(item);
    }
  }

  const report = {
    grade,
    catalogCount: items.length,
    registeredCount: items.length - missing.length,
    verifiedCount: items.length - missing.length - incomplete.length,
    missing,
    incomplete,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, outputPath }, null, 2));
} finally {
  await connection.end();
}

process.exit(0);
