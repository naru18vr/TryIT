import fs from "node:fs";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL が設定されていません。");
}

const catalogPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const outputPath = "/tmp/hs-nouns-articles-note-coverage-audit.json";
const expectedTopicCount = 10;
const expectedVideoCount = 20;

const topicMatchers = [
  ["数えられない名詞（液体・お金・情報）", /^数えられない名詞[①②]/],
  ["代表的な数えられない名詞", /^代表的な数えられない名詞/],
  ["数えられない名詞の数え方", /^数えられない名詞の数え方/],
  ["AのBの表し方", /^所有格と B of A の形/],
  ["複数形の名詞を使った重要表現", /^複数形の名詞を使う表現/],
  ["料金・お金を表す名詞", /^「料金・お金」を表す名詞/],
  ["客を表す名詞", /^「客」を表す名詞/],
  ["仕事を表す名詞", /^「仕事」を表す名詞/],
  ["交通・通信手段を表す名詞", /^交通・通信手段を表す名詞/],
  ["分数表現の作り方", /^分数表現の作り方/],
];

const source = fs.readFileSync(catalogPath, "utf8");
const match = source.match(/export const TRYIT_CATALOG: TryItCatalogItem\[\] = (\[.*?\]);\nexport const TRYIT_GRADES/s);
if (!match) throw new Error("カタログを読み取れませんでした。");

const catalog = JSON.parse(match[1]);
const targetItems = catalog
  .filter((item) => item.grade === "高校" && item.subject === "英語")
  .map((item) => {
    const title = item.title.replace(/^【高校 英語】\s*/, "");
    const topic = topicMatchers.find(([, matcher]) => matcher.test(title));
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
