import fs from "node:fs";

const sourcePath = process.env.CATALOG_SOURCE ?? "/home/ubuntu/tryit-catalog/channel-videos.json";
const outputPath = "/home/ubuntu/tryit-learning-companion/catalog-audit.json";
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const subjectPatterns = [
  ["中学数学", /(中学.*数学|junior high school math)/i],
  ["中学英語", /(中学.*英語|junior high school english)/i],
  ["中学理科", /(中学.*理科|junior high school science)/i],
  ["中学社会", /(中学.*(社会|歴史|地理|公民)|junior high school (history|geography|civics))/i],
  ["数学I", /(数学[ⅠⅠi1]|high school mathematics i)/i],
  ["数学A", /(数学a|high school mathematics a)/i],
  ["数学II", /(数学[Ⅱⅱi2]|high school mathematics ii)/i],
  ["数学B", /(数学b|high school mathematics b)/i],
  ["数学III", /(数学[Ⅲⅲi3]|high school mathematics iii)/i],
  ["英文法", /(英文法|high school english grammar)/i],
  ["英語構文", /(英語構文|high school english syntax)/i],
  ["物理基礎", /(物理基礎|basic physics)/i],
  ["物理", /(高校物理|high school physics)/i],
  ["化学基礎", /(化学基礎|basic chemistry)/i],
  ["化学", /(高校化学|high school chemistry)/i],
  ["生物基礎", /(生物基礎|basic biology)/i],
  ["生物", /(高校生物|high school biology)/i],
  ["日本史", /(日本史|japanese history)/i],
  ["世界史", /(世界史|world history)/i],
  ["地理", /(高校地理|high school geography)/i],
  ["古文", /(古文|classical japanese)/i],
  ["漢文", /(漢文|classical chinese)/i],
];

function classifySubject(title) {
  return subjectPatterns.find(([, pattern]) => pattern.test(title))?.[0] ?? null;
}

function classifyGrade(title, subject) {
  if (/中学[１1]年|junior high school (english|math|science|history|geography|civics) 1/i.test(title)) return "中学1年";
  if (/中学[２2]年|junior high school (english|math|science|history|geography|civics) 2/i.test(title)) return "中学2年";
  if (/中学[３3]年|junior high school (english|math|science|history|geography|civics) 3/i.test(title)) return "中学3年";
  if (subject?.startsWith("中学")) return "中学共通";
  if (subject) return "高校";
  return null;
}

const promotePattern = /(定期テスト.*攻略|勉強法|オンライン指導|個別指導|資料請求|保護者|説明会|キャンペーン|講師募集|合格体験記|サービス|アプリ|紹介|告知|お知らせ|ランキング|ダウンロード|授業満足度|トライの|受験対策講座)/i;

const analyzed = source.entries.map((entry) => {
  const subject = classifySubject(entry.title);
  const grade = classifyGrade(entry.title, subject);
  const isPromotional = promotePattern.test(entry.title);
  return { id: entry.id, title: entry.title, subject, grade, isPromotional };
});

const groupCount = (values) => Object.fromEntries([...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1]));
const report = {
  total: analyzed.length,
  matchedLessons: analyzed.filter((entry) => entry.subject && !entry.isPromotional).length,
  unmatched: analyzed.filter((entry) => !entry.subject && !entry.isPromotional),
  promotional: analyzed.filter((entry) => entry.isPromotional),
  subjectCounts: groupCount(analyzed.filter((entry) => entry.subject && !entry.isPromotional).map((entry) => entry.subject)),
  gradeCounts: groupCount(analyzed.filter((entry) => entry.grade && !entry.isPromotional).map((entry) => entry.grade)),
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  total: report.total,
  matchedLessons: report.matchedLessons,
  unmatchedCount: report.unmatched.length,
  promotionalCount: report.promotional.length,
  subjectCounts: report.subjectCounts,
  gradeCounts: report.gradeCounts,
  promotionalSample: report.promotional.slice(0, 20),
  unmatchedSample: report.unmatched.slice(0, 30),
}, null, 2));
