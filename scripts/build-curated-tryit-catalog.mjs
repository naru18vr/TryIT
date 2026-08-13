import fs from "node:fs";
import path from "node:path";

const sourcePath = "/home/ubuntu/tryit-catalog/channel-videos-ja.json";
const outputPath = "/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts";
const channel = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const subjectRules = [
  ["数学", /(中[１２３1-3].*数学|中学.*数学|高校.*数学|数学[ⅠⅡⅢAB]|数学[123]|高等数学|数学)/i],
  ["英語", /(中[１２３1-3].*英語|中学.*英語|高校.*英語|英文法|英語構文|英語)/i],
  ["理科", /(中[１２３1-3].*理科|中学.*理科|中学.*(物理|化学|生物|地学))/i],
  ["社会", /(中[１２３1-3].*(社会|歴史|地理|公民)|中学.*(社会|歴史|地理|公民))/i],
  ["物理基礎", /(物理基礎|物理.*基礎)/i],
  ["物理", /(高校.*物理|物理)/i],
  ["化学基礎", /(化学基礎|化学.*基礎)/i],
  ["化学", /(高校.*化学|化学)/i],
  ["生物基礎", /(生物基礎|生物.*基礎)/i],
  ["生物", /(高校.*生物|生物)/i],
  ["日本史", /(日本史)/i],
  ["世界史", /(世界史)/i],
  ["地理", /(高校.*地理|地理)/i],
  ["現代文", /(現代文)/i],
  ["古文", /(古文|古典文法)/i],
  ["漢文", /(漢文)/i],
];

const excludedPatterns = [
  /オンライン指導を詳しく解説/i,
  /定期テスト.*攻略法/i,
  /勉強法を.*伝授/i,
  /個別指導/i,
  /保護者/i,
  /資料請求/i,
  /講師募集/i,
  /サービスの紹介/i,
  /アプリ.*紹介/i,
  /キャンペーン/i,
  /お知らせ/i,
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

function normalizeTitle(title) {
  return title.replace(/　/g, " ").replace(/\s+/g, " ").trim();
}

function classifyGrade(title) {
  const normalized = normalizeTitle(title);
  if (/中[１1]\s*(年|数学|英語|理科|社会)|中学[１1]/i.test(normalized)) return "中学1年";
  if (/中[２2]\s*(年|数学|英語|理科|社会)|中学[２2]/i.test(normalized)) return "中学2年";
  if (/中[３3]\s*(年|数学|英語|理科|社会)|中学[３3]/i.test(normalized)) return "中学3年";
  if (/中学|中学生/i.test(normalized)) return "中学共通";
  if (/高校|高等|数学[ⅠⅡⅢAB]|物理|化学|生物|日本史|世界史|地理|古文|漢文|現代文/i.test(normalized)) return "高校";
  return null;
}

function classifySubject(title) {
  return subjectRules.find(([, pattern]) => pattern.test(title))?.[0] ?? null;
}

function unitFor(title, subject) {
  const normalized = normalizeTitle(title)
    .replace(/^【[^】]+】/, "")
    .replace(/^\[[^\]]+\]/, "")
    .replace(/^(中学|高校)\s*[１２３1-3]?\s*(年)?\s*/, "")
    .trim();
  const withoutSubject = normalized
    .replace(new RegExp(`^(?:${subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\s*`, "i"), "")
    .trim();
  const beforeLessonNumber = withoutSubject.split(/[０-９0-9]+/)[0].trim();
  const unit = (beforeLessonNumber || withoutSubject)
    .replace(/[：:（(].*$/, "")
    .replace(/(基礎|前編|後編)$/u, "")
    .trim();
  return unit && unit.length <= 36 ? unit : "その他";
}

function thumbnailFor(entry) {
  return entry.thumbnails?.at(-1)?.url ?? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
}

function secondsToLabel(seconds) {
  const minutes = Math.floor((seconds ?? 0) / 60);
  const remainder = (seconds ?? 0) % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, "0")}` : "—";
}

const excluded = [];
const unmatched = [];
const items = [];

for (const entry of channel.entries) {
  if (!entry?.id || !entry?.url || !entry?.title) continue;
  const title = normalizeTitle(entry.title);
  if (excludedPatterns.some((pattern) => pattern.test(title))) {
    excluded.push({ id: entry.id, title });
    continue;
  }
  const subject = classifySubject(title);
  const grade = classifyGrade(title);
  if (!subject || !grade) {
    unmatched.push({ id: entry.id, title });
    continue;
  }
  items.push({
    id: entry.id,
    youtubeUrl: entry.url,
    title,
    grade,
    subject,
    unit: unitFor(title, subject),
    thumbnailUrl: thumbnailFor(entry),
    durationSeconds: entry.duration ?? 0,
    durationLabel: secondsToLabel(entry.duration),
  });
}

const grades = ["中学1年", "中学2年", "中学3年", "中学共通", "高校"].filter((grade) => items.some((item) => item.grade === grade));
const subjectsByGrade = Object.fromEntries(grades.map((grade) => [grade, [...new Set(items.filter((item) => item.grade === grade).map((item) => item.subject))].sort((a, b) => a.localeCompare(b, "ja"))]));
const unitsByGradeAndSubject = Object.fromEntries(grades.flatMap((grade) => subjectsByGrade[grade].map((subject) => [`${grade}::${subject}`, [...new Set(items.filter((item) => item.grade === grade && item.subject === subject).map((item) => item.unit))].sort((a, b) => a.localeCompare(b, "ja"))])));
const report = { source: "Try IT official channel", sourceUpdatedAt: new Date().toISOString(), sourceTotal: channel.entries.length, included: items.length, excluded, unmatched };
fs.writeFileSync("/home/ubuntu/tryit-learning-companion/catalog-curation-report.json", JSON.stringify(report, null, 2));

const content = `// Generated from the Japanese-title snapshot of the official Try IT YouTube channel. Do not edit manually.\n\nexport type TryItCatalogItem = {\n  id: string;\n  youtubeUrl: string;\n  title: string;\n  grade: string;\n  subject: string;\n  unit: string;\n  thumbnailUrl: string;\n  durationSeconds: number;\n  durationLabel: string;\n};\n\nexport const TRYIT_CATALOG_UPDATED_AT = ${JSON.stringify(new Date().toISOString())};\nexport const TRYIT_CATALOG_SOURCE = 'https://www.youtube.com/channel/UCcj-cHmS0uD91MLjtdiN89Q';\nexport const TRYIT_CATALOG: TryItCatalogItem[] = ${JSON.stringify(items)};\nexport const TRYIT_GRADES = ${JSON.stringify(grades)};\nexport const TRYIT_SUBJECTS_BY_GRADE: Record<string, string[]> = ${JSON.stringify(subjectsByGrade)};\nexport const TRYIT_UNITS_BY_GRADE_AND_SUBJECT: Record<string, string[]> = ${JSON.stringify(unitsByGradeAndSubject)};\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);
console.log(JSON.stringify({ included: items.length, excluded: excluded.length, unmatched: unmatched.length, grades, subjectsByGrade, excludedSample: excluded.slice(0, 10), unmatchedSample: unmatched.slice(0, 10) }, null, 2));
