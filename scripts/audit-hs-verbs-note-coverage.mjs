import fs from "node:fs";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL が設定されていません。");
}

const catalogPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const outputPath = "/tmp/hs-verbs-note-coverage-audit.json";
const expectedTopicCount = 17;
const expectedVideoCount = 34;

const topicMatchers = [
  ["自動詞と他動詞", /^自動詞と他動詞[①②]/],
  ["他動詞と間違えやすい自動詞", /^他動詞と間違えやすい自動詞/],
  ["自動詞と間違えやすい他動詞", /^自動詞と間違えやすい他動詞/],
  ["lieとlay / riseとraise", /^lieとlay \/ riseとraise/],
  ["pay / sell / read / last", /^pay \/ sell \/ read \/ last/],
  ["stand / miss / have", /^stand \/ miss \/ have/],
  ["tell / say / speak / talk", /^tell \/ say \/ speak \/ talk/],
  ["borrow / lend / rent / use", /^borrow \/ lend \/ rent \/ use/],
  ["forgive / permit / allow", /^forgive \/ permit \/ allow/],
  ["doubt / suspect", /^doubt \/ suspect/],
  ["suit / match / go with / fit", /^suit \/ match \/ go with \/ fit/],
  ["使役動詞 make / have / let", /^使役動詞 make \/ have \/ let/],
  ["知覚動詞 see / hear など", /^知覚動詞 see \/ hear など/],
  ["rob A of B / remind A of B", /^rob A of B \/ remind A of B/],
  ["prevent / distinguish など", /^prevent \/ distinguish など/],
  ["regard A as B など", /^regard A as B など/],
  ["blame A for B など", /^blame A for B など/],
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
