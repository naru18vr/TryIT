import fs from 'node:fs';
import path from 'node:path';

const sourcePath = '/home/ubuntu/tryit-catalog/channel-videos.json';
const outputPath = '/home/ubuntu/tryit-learning-companion/server/data/tryitCatalog.ts';

const channel = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function subjectFor(title) {
  const value = title.toLowerCase();
  const rules = [
    ['高校数学', /(高校数学|high school mathematics|数学[ⅰⅠi1]|数学[ⅱⅡi2]|数学a|数学b|数学[ⅲⅢi3])/i],
    ['中学数学', /(中学.*数学|junior high school math)/i],
    ['高校英語', /(高校.*英語|英文法|英語構文|high school english)/i],
    ['中学英語', /(中学.*英語|junior high school english)/i],
    ['物理', /(高校物理|high school physics)/i],
    ['物理基礎', /(物理基礎|basic physics)/i],
    ['化学', /(高校化学|high school chemistry)/i],
    ['化学基礎', /(化学基礎|basic chemistry)/i],
    ['生物', /(高校生物|high school biology)/i],
    ['生物基礎', /(生物基礎|basic biology)/i],
    ['世界史', /(世界史|world history)/i],
    ['日本史', /(日本史|japanese history)/i],
    ['地理', /(高校地理|high school geography)/i],
    ['古文', /(古文|classical japanese)/i],
    ['漢文', /(漢文|classical chinese)/i],
    ['中学社会', /(中学.*(社会|歴史|地理|公民)|junior high school (history|geography|civics))/i],
    ['中学理科', /(中学.*理科|junior high school science)/i],
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] ?? '学習ガイド';
}

function unitFor(title, subject) {
  const japanese = title.replace(/^[【\[].*?[】\]]\s*/, '').trim();
  const englishMatch = title.match(/^\[[^\]]+\]\s*([^\d:：（(]+?)(?:\s*\d|:|（|\()/);
  const candidate = englishMatch?.[1]?.trim() ?? japanese;
  const unit = candidate
    .replace(/^(中学|高校)([0-9１-３]|一|二|三)?年?\s*/, '')
    .replace(new RegExp(`^${subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '')
    .replace(/[0-9０-９]+.*$/, '')
    .replace(/[：:（(].*$/, '')
    .trim();
  return unit && unit.length <= 34 ? unit : 'その他';
}

function thumbnailFor(entry) {
  return entry.thumbnails?.at(-1)?.url ?? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
}

function secondsToLabel(seconds) {
  const minutes = Math.floor((seconds ?? 0) / 60);
  const remainder = (seconds ?? 0) % 60;
  return minutes ? `${minutes}:${String(remainder).padStart(2, '0')}` : '—';
}

const items = channel.entries
  .filter((entry) => entry?.id && entry?.url && entry?.title)
  .map((entry) => {
    const subject = subjectFor(entry.title);
    return {
      id: entry.id,
      youtubeUrl: entry.url,
      title: entry.title,
      subject,
      unit: unitFor(entry.title, subject),
      thumbnailUrl: thumbnailFor(entry),
      durationSeconds: entry.duration ?? 0,
      durationLabel: secondsToLabel(entry.duration),
    };
  });

const subjects = [...new Set(items.map((item) => item.subject))].sort((a, b) => a.localeCompare(b, 'ja'));
const unitsBySubject = Object.fromEntries(
  subjects.map((subject) => [
    subject,
    [...new Set(items.filter((item) => item.subject === subject).map((item) => item.unit))].sort((a, b) => a.localeCompare(b, 'ja')),
  ]),
);

const content = `// Generated from the official Try IT YouTube channel snapshot. Do not edit manually.\n\nexport type TryItCatalogItem = {\n  id: string;\n  youtubeUrl: string;\n  title: string;\n  subject: string;\n  unit: string;\n  thumbnailUrl: string;\n  durationSeconds: number;\n  durationLabel: string;\n};\n\nexport const TRYIT_CATALOG_UPDATED_AT = ${JSON.stringify(new Date().toISOString())};\nexport const TRYIT_CATALOG_SOURCE = 'https://www.youtube.com/channel/UCcj-cHmS0uD91MLjtdiN89Q';\nexport const TRYIT_CATALOG: TryItCatalogItem[] = ${JSON.stringify(items)};\nexport const TRYIT_SUBJECTS = ${JSON.stringify(subjects)};\nexport const TRYIT_UNITS_BY_SUBJECT: Record<string, string[]> = ${JSON.stringify(unitsBySubject)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);
console.log(`Generated ${items.length} catalog items.`);
