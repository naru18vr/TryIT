import { TRYIT_CATALOG } from '../server/data/tryitCatalog.ts';

const query = process.env.QUERY ?? '';
const id = process.env.ID ?? '';
const terms = query
  .split('|')
  .map((term) => term.trim())
  .filter(Boolean);

const items = TRYIT_CATALOG.filter(
  (video) =>
    video.grade === '高校' &&
    video.subject === '英語' &&
    video.title.startsWith('【高校 英語】') &&
    (id ? video.id === id : terms.some((term) => video.title.includes(term))),
);

console.log(
  JSON.stringify(
    items.map(({ id, title, unit, durationLabel }) => ({ id, title, unit, durationLabel })),
    null,
    2,
  ),
);
