import fs from "node:fs";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL が設定されていません。");
}

const catalogPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const outputPath = "/tmp/hs-conjunction-note-coverage-audit.json";
const expectedTopicCount = 19;
const expectedVideoCount = 38;

const topicMatchers = [
  ["等位接続詞 and/or/but", /^等位接続詞 and\/or\/but/],
  ["命令文＋and/or", /^命令文＋and\/or/],
  ["等位接続詞の重要表現", /^等位接続詞の重要表現/],
  ["both A and Bなどでの動詞のかたち", /^eitherのあとの動詞の形/],
  ["whenとwhileの違い", /^when と while の違い/],
  ["before/after/since/until", /^before\/after\/since\/until/],
  ["timeを用いた表現", /^(timeを用いた表現|by the time などの表現)/],
  ["because/since", /^because \/ since/],
  ["though/whether", /^though \/ whether/],
  ["even if/even though", /^even if \/ even though/],
  ["if/unless/once", /^if \/ unless \/ once/],
  ["so that/in order that/in case", /^so that\/in order that\/in case/],
  ["so … that/such … that", /^so … that \/ such … that/],
  ["接続詞asの使い方", /^接続詞asの使い方/],
  ["as long as/as far as", /^as long as \/ as far as/],
  ["名詞節を導くthat", /^名詞節を導くthat/],
  ["同格のthat", /^同格のthat/],
  ["前置詞＋that", /^前置詞＋that/],
  ["名詞節を導くif/whether", /^名詞節を導く if\/whether/],
];

const source = fs.readFileSync(catalogPath, "utf8");
const match = source.match(/export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s);
if (!match) throw new Error("カタログを読み取れませんでした。");

const catalog = JSON.parse(match[1]);
const targetItems = catalog
  .filter((item) => item.grade === "高校" && item.subject === "英語")
  .map((item) => {
    const topic = topicMatchers.find(([, matcher]) => matcher.test(item.unit));
    return topic ? { ...item, topic: topic[0] } : null;
  })
  .filter(Boolean);

const byTopic = new Map(topicMatchers.map(([topic]) => [topic, []]));
for (const item of targetItems) byTopic.get(item.topic).push(item);

const catalogIds = targetItems.map((item) => item.id);
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(
    `SELECT videoId, summary, keyPoints FROM videoNotes WHERE videoId IN (${catalogIds.map(() => "?").join(",")})`,
    catalogIds,
  );
  const notesByVideoId = new Map(rows.map((note) => [note.videoId, note]));
  const missing = [];
  const incomplete = [];

  for (const item of targetItems) {
    const note = notesByVideoId.get(item.id);
    if (!note) {
      missing.push(item);
      continue;
    }
    if (!note.summary?.trim() || !note.keyPoints?.includes("復習では")) {
      incomplete.push(item);
    }
  }

  const topicSummary = [...byTopic.entries()].map(([topic, items]) => ({
    topic,
    catalogCount: items.length,
    registeredCount: items.filter((item) => notesByVideoId.has(item.id)).length,
    verifiedCount: items.filter((item) => {
      const note = notesByVideoId.get(item.id);
      return note?.summary?.trim() && note?.keyPoints?.includes("復習では");
    }).length,
  }));

  const report = {
    expectedTopicCount,
    expectedVideoCount,
    topicCount: topicSummary.length,
    catalogCount: targetItems.length,
    registeredCount: targetItems.length - missing.length,
    verifiedCount: targetItems.length - missing.length - incomplete.length,
    topicSummary,
    missing,
    incomplete,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, outputPath }, null, 2));
} finally {
  await connection.end();
}
