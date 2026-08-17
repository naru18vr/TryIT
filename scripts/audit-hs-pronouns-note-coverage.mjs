import fs from "node:fs";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL が設定されていません。");
}

const catalogPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const outputPath = "/tmp/hs-pronouns-note-coverage-audit.json";
const expectedTopicCount = 15;
const expectedVideoCount = 31;

const targets = [
  ["「代名詞」とは？", ["f3z7JUortUU", "SCMkMV0okMs"]],
  ["訳に注意したい代名詞", ["tQQZ3BzoEj8", "SUlIcz11smI"]],
  ["「It is 時間」の慣用表現", ["i-5uIUmktRE", "tWw7YDdqf0M", "D905qSVfzlY"]],
  ["仮主語のit", ["ExqJVS83Xo4", "mrxtBukclIY"]],
  ["仮主語itの慣用表現", ["vpnMdbZ-J-U", "q3zgLUEOTjg"]],
  ["It seems that / It happens thatなどの構文", ["O311W4K7YTU", "4t39UE4QDlc"]],
  ["仮目的語のit", ["DTCjdsRrd4g", "ohfrTWYATQ0"]],
  ["that／thoseの使い方", ["Ixs_MhvJJys", "UTt7-ufFeh4"]],
  ["one／onesの使い方", ["_s-1FeYgtLA", "5-LCxASn4TA"]],
  ["another／other／othersの使い方", ["uMXrCcdFM4s", "ExqE6iq_kFU"]],
  ["both／either／neither／noneの使い方", ["lxRzeKGK0co", "CAmKejGiNmk"]],
  ["each／everyの使い方", ["ZlHtlC7fgBM", "2beXL_8lE8U"]],
  ["some／anyの使い方", ["g3gOCuosLmA", "m0E2LNR1kWY"]],
  ["something／nothingの慣用表現", ["rRX504pNoiQ", "U9MHRF1QGsI"]],
  ["再帰代名詞の使い方", ["CjczG6iU1rs", "8PTdDdTw84U"]],
];

const source = fs.readFileSync(catalogPath, "utf8");
const match = source.match(/export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s);
if (!match) throw new Error("カタログを読み取れませんでした。");

const catalog = JSON.parse(match[1]);
const catalogById = new Map(catalog.map((item) => [item.id, item]));
const allTargetIds = targets.flatMap(([, ids]) => ids);
const catalogMissing = allTargetIds.filter((id) => !catalogById.has(id));
const nonHighSchoolEnglish = allTargetIds.filter((id) => {
  const item = catalogById.get(id);
  return item && (item.grade !== "高校" || item.subject !== "英語");
});

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(
    `SELECT videoId, summary, keyPoints FROM videoNotes WHERE videoId IN (${allTargetIds.map(() => "?").join(",")})`,
    allTargetIds,
  );
  const notesByVideoId = new Map(rows.map((note) => [note.videoId, note]));
  const missing = [];
  const incomplete = [];

  for (const [topic, ids] of targets) {
    for (const id of ids) {
      const item = catalogById.get(id);
      const note = notesByVideoId.get(id);
      if (!note) {
        missing.push({ topic, id, title: item?.title ?? null });
        continue;
      }
      if (!note.summary?.trim() || !note.keyPoints?.includes("復習では")) {
        incomplete.push({ topic, id, title: item?.title ?? null });
      }
    }
  }

  const topicSummary = targets.map(([topic, ids]) => ({
    topic,
    catalogCount: ids.filter((id) => catalogById.has(id)).length,
    registeredCount: ids.filter((id) => notesByVideoId.has(id)).length,
    verifiedCount: ids.filter((id) => {
      const note = notesByVideoId.get(id);
      return note?.summary?.trim() && note?.keyPoints?.includes("復習では");
    }).length,
  }));

  const report = {
    expectedTopicCount,
    expectedVideoCount,
    topicCount: topicSummary.length,
    catalogCount: allTargetIds.length - catalogMissing.length,
    registeredCount: allTargetIds.length - missing.length,
    verifiedCount: allTargetIds.length - missing.length - incomplete.length,
    catalogMissing,
    nonHighSchoolEnglish,
    topicSummary,
    missing,
    incomplete,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, outputPath }, null, 2));
} finally {
  await connection.end();
}
