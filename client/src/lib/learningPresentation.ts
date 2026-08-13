export const ALL_FILTER_VALUE = "__all__";

export function buildCatalogQuery(input: {
  query: string;
  subject: string;
  unit: string;
  page: number;
  pageSize: number;
}) {
  return {
    query: input.query.trim() || undefined,
    subject: input.subject === ALL_FILTER_VALUE ? undefined : input.subject,
    unit: input.unit === ALL_FILTER_VALUE ? undefined : input.unit,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export function getVideoCardState(isWatched: boolean) {
  return isWatched
    ? { isWatched: true, label: "視聴済み" }
    : { isWatched: false, label: "未視聴" };
}

export function getMyLearningScreenState(isAuthenticated: boolean, watchedCount: number) {
  if (!isAuthenticated) return "sign-in" as const;
  return watchedCount > 0 ? "history" as const : "empty-history" as const;
}
