import { TRYIT_CATALOG } from '../server/data/tryitCatalog.ts';

const relationPattern = /関係代名詞|関係副詞|no matter|whoever\/whichever\/whatever|whenever\/wherever\/however|非制限用法|whereとwhich/;

const items = TRYIT_CATALOG.filter(
  (video) =>
    video.grade === '高校' &&
    video.subject === '英語' &&
    video.title.startsWith('【高校 英語】') &&
    relationPattern.test(video.title),
);

const missingReviewShape = items.filter(
  (video) => !video.id || !video.title || !video.unit,
);

console.log(
  JSON.stringify(
    {
      count: items.length,
      invalidItemCount: missingReviewShape.length,
      ids: items.map((video) => video.id),
      items: items.map(({ id, title, unit }) => ({ id, title, unit })),
    },
    null,
    2,
  ),
);
