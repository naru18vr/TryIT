import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { ALL_FILTER_VALUE, buildCatalogQuery, getVideoCardState } from "@/lib/learningPresentation";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  GraduationCap,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

function formatTotal(total?: number) {
  return total ? total.toLocaleString("ja-JP") : "…";
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState(ALL_FILTER_VALUE);
  const [subject, setSubject] = useState(ALL_FILTER_VALUE);
  const [unit, setUnit] = useState(ALL_FILTER_VALUE);
  const [page, setPage] = useState(1);

  const filtersQuery = trpc.catalog.filters.useQuery({
    grade: grade === ALL_FILTER_VALUE ? undefined : grade,
    subject: subject === ALL_FILTER_VALUE ? undefined : subject,
  });
  const noteCoverageQuery = trpc.notes.coverage.useQuery();
  const activeSubjects = useMemo(() => filtersQuery.data?.subjects ?? [], [filtersQuery.data?.subjects]);
  const activeUnits = useMemo(() => filtersQuery.data?.units ?? [], [filtersQuery.data?.units]);
  const catalogQuery = trpc.catalog.list.useQuery(buildCatalogQuery({ query, grade, subject, unit, page, pageSize: 12 }));

  const resetPage = () => setPage(1);
  const setGradeFilter = (value: string) => {
    setGrade(value);
    setSubject(ALL_FILTER_VALUE);
    setUnit(ALL_FILTER_VALUE);
    resetPage();
  };
  const setSubjectFilter = (value: string) => {
    setSubject(value);
    setUnit(ALL_FILTER_VALUE);
    resetPage();
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#17372f]">
      <header className="sticky top-0 z-40 border-b border-[#17372f]/10 bg-[#f7f5f0]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Try IT Study Companion ホーム">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#17372f] text-[#f4c95d] shadow-[0_8px_20px_rgba(23,55,47,0.18)] transition-transform duration-200 group-hover:-rotate-3">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="font-serif-display text-[22px] tracking-tight">Try IT</span>
              <span className="mt-1 block text-[10px] font-bold tracking-[0.18em] text-[#69766b]">STUDY COMPANION</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-[#50645a] md:flex">
            <a href="#catalog" className="transition-colors hover:text-[#17372f]">動画を探す</a>
            <a href="#how-it-works" className="transition-colors hover:text-[#17372f]">学び方</a>
          </nav>
          <div className="flex items-center gap-2">
            {!loading && isAuthenticated ? (
              <Link href="/my-learning">
                <Button variant="outline" className="h-10 border-[#17372f]/15 bg-white/60 px-3 text-[#17372f] hover:bg-white sm:px-4">
                  <CircleUserRound className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{user?.name ?? "マイページ"}</span>
                  <span className="sm:hidden">学習</span>
                </Button>
              </Link>
            ) : (
              <Button onClick={startLogin} className="h-10 bg-[#17372f] px-4 text-white hover:bg-[#21483d]">
                ログイン
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-18 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="absolute -right-28 top-10 h-96 w-96 rounded-full bg-[#e1d5b5]/45 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#17372f]/10 bg-white/60 px-3 py-1.5 text-xs font-bold tracking-wide text-[#496057]">
                <Sparkles className="h-3.5 w-3.5 text-[#b68020]" />
                映像授業を、自分の学びに変える
              </div>
              <h1 className="max-w-3xl font-serif-display text-[44px] leading-[1.12] tracking-[-0.04em] text-[#17372f] sm:text-6xl lg:text-7xl">
                今日の理解が、<br />
                <span className="text-[#b77a25]">明日の自信</span>になる。
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-8 text-[#53665d] sm:text-base">
                Try ITの正規授業動画を、学年・教科・単元・キーワードで検索。視聴履歴と自分だけの進捗を残しながら、予習と復習を静かに積み重ねられる学習スペースです。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} className="h-12 rounded-xl bg-[#17372f] px-5 text-white hover:bg-[#21483d]">
                  動画を探す <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link href="/my-learning">
                  <Button variant="outline" className="h-12 rounded-xl border-[#17372f]/15 bg-white/50 px-5 text-[#17372f] hover:bg-white">
                    学習記録を見る
                  </Button>
                </Link>
              </div>
              <div className="mt-11 flex flex-wrap items-center gap-7 border-t border-[#17372f]/10 pt-6">
                <div>
                  <p className="font-serif-display text-3xl text-[#17372f]">{formatTotal(filtersQuery.data?.totalVideos)}</p>
                  <p className="mt-1 text-xs font-medium text-[#6d7d74]">公開動画を収録</p>
                </div>
                <div className="h-9 w-px bg-[#17372f]/10" />
                <div>
                  <p className="font-serif-display text-3xl text-[#17372f]">3</p>
                  <p className="mt-1 text-xs font-medium text-[#6d7d74]">学年・教科・単元で整理</p>
                </div>
                <div className="h-9 w-px bg-[#17372f]/10" />
                <div>
                  <p className="font-serif-display text-3xl text-[#17372f]">{noteCoverageQuery.data?.completed ?? "…"}</p>
                  <p className="mt-1 text-xs font-medium text-[#6d7d74]">予習・復習ノートを確認済み</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -left-5 -top-5 h-24 w-24 rounded-full border border-[#c7a568]/45" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#18352e] p-2 shadow-[0_30px_75px_rgba(24,53,46,0.24)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#1e493d] p-7 sm:p-9">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(244,201,93,0.25),transparent_30%),linear-gradient(135deg,transparent_50%,rgba(255,255,255,0.05))]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-[#f4d48a]">FOCUS SESSION</span>
                      <BookOpenCheck className="h-5 w-5 text-[#f4d48a]" />
                    </div>
                    <div>
                      <p className="font-serif-display text-4xl leading-tight text-white sm:text-5xl">学びを<br />整える時間。</p>
                      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                        <div className="h-full w-[62%] rounded-full bg-[#f4c95d]" />
                      </div>
                      <div className="mt-3 flex justify-between text-[11px] text-white/60"><span>今日の進捗</span><span>62%</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl border border-[#17372f]/10 bg-[#fffdf9] px-4 py-3 shadow-[0_12px_30px_rgba(38,56,48,0.12)]">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9f0e8] text-[#2d745a]"><Check className="h-4 w-4" /></div>
                <div><p className="text-xs font-bold text-[#17372f]">視聴履歴を保存</p><p className="mt-0.5 text-[10px] text-[#748278]">あなたのペースで</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="catalog" className="scroll-mt-20 border-y border-[#17372f]/10 bg-[#fffdf9] px-5 py-14 lg:px-8 lg:py-18">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-[#b77a25]">VIDEO LIBRARY</p>
                <h2 className="mt-2 font-serif-display text-4xl tracking-[-0.03em] text-[#17372f]">学びたい動画を、すぐに。</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#66766d]">まず学年、次に教科、最後に単元を選んで探せます。視聴済みの動画はチェックで識別されます。</p>
            </div>

            <div className="mt-9 rounded-[22px] border border-[#17372f]/10 bg-[#f8f6f1] p-4 shadow-[0_12px_35px_rgba(41,57,49,0.05)] sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr_0.65fr_0.65fr]">
                <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819088]" /><Input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="キーワードで探す（例：二次関数、鎌倉幕府）" className="h-12 rounded-xl border-[#17372f]/10 bg-white pl-11 text-[#17372f] placeholder:text-[#98a29b] focus-visible:ring-[#b77a25]" /></div>
                <label className="sr-only" htmlFor="grade-filter">学年を選ぶ</label><select id="grade-filter" value={grade} onChange={(event) => setGradeFilter(event.target.value)} className="h-12 rounded-xl border border-[#17372f]/10 bg-white px-3 text-sm text-[#17372f] outline-none transition focus:border-[#b77a25] focus:ring-2 focus:ring-[#b77a25]/20"><option value={ALL_FILTER_VALUE}>すべての学年</option>{filtersQuery.data?.grades.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <label className="sr-only" htmlFor="subject-filter">教科を選ぶ</label><select id="subject-filter" value={subject} onChange={(event) => setSubjectFilter(event.target.value)} disabled={grade === ALL_FILTER_VALUE} className="h-12 rounded-xl border border-[#17372f]/10 bg-white px-3 text-sm text-[#17372f] outline-none transition focus:border-[#b77a25] focus:ring-2 focus:ring-[#b77a25]/20 disabled:cursor-not-allowed disabled:bg-[#edf0ea] disabled:text-[#829087]"><option value={ALL_FILTER_VALUE}>すべての教科</option>{activeSubjects.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <label className="sr-only" htmlFor="unit-filter">単元を選ぶ</label><select id="unit-filter" value={unit} onChange={(event) => { setUnit(event.target.value); resetPage(); }} disabled={grade === ALL_FILTER_VALUE || subject === ALL_FILTER_VALUE} className="h-12 rounded-xl border border-[#17372f]/10 bg-white px-3 text-sm text-[#17372f] outline-none transition focus:border-[#b77a25] focus:ring-2 focus:ring-[#b77a25]/20 disabled:cursor-not-allowed disabled:bg-[#edf0ea] disabled:text-[#829087]"><option value={ALL_FILTER_VALUE}>すべての単元</option>{activeUnits.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-[#77847c]">よく探す授業</span>
                {[{ grade: "中学3年", subject: "数学" }, { grade: "中学3年", subject: "英語" }, { grade: "高校", subject: "数学" }, { grade: "高校", subject: "化学基礎" }, { grade: "高校", subject: "世界史" }].map((item) => <button key={`${item.grade}-${item.subject}`} onClick={() => { setGrade(item.grade); setSubject(item.subject); setUnit(ALL_FILTER_VALUE); resetPage(); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${grade === item.grade && subject === item.subject ? "bg-[#17372f] text-white" : "bg-white text-[#52645b] hover:bg-[#e8eee7]"}`}>{item.grade}・{item.subject}</button>)}
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between"><p className="text-sm text-[#65756b]"><strong className="font-semibold text-[#17372f]">{catalogQuery.data?.total?.toLocaleString("ja-JP") ?? "…"}</strong> 本の動画</p><p className="text-xs text-[#829087]">{catalogQuery.data ? `${catalogQuery.data.page} / ${catalogQuery.data.totalPages} ページ` : ""}</p></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalogQuery.isLoading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-[18px] border border-[#17372f]/8 bg-white"><div className="aspect-video animate-pulse bg-[#edf0ea]" /><div className="space-y-3 p-4"><div className="h-3 w-1/3 animate-pulse rounded bg-[#edf0ea]" /><div className="h-5 w-full animate-pulse rounded bg-[#edf0ea]" /></div></div>) : catalogQuery.data?.items.map((video, index) => (
                <Link href={`/watch/${video.id}`} key={video.id} className="group relative overflow-hidden rounded-[18px] border border-[#17372f]/9 bg-white shadow-[0_8px_25px_rgba(33,50,41,0.045)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(33,50,41,0.12)]">
                  <div className="relative aspect-video overflow-hidden bg-[#e8ebe6]"><img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-[#102b23]/55 via-transparent to-transparent" /><div className="absolute bottom-3 left-3 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/92 text-[#17372f] shadow-sm"><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></span><span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">{video.durationLabel}</span></div>{getVideoCardState(video.isWatched).isWatched && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#e6f1e9] px-2 py-1 text-[10px] font-bold text-[#2b7255]"><Check className="h-3 w-3" /> {getVideoCardState(video.isWatched).label}</span>}</div>
                  <div className="p-4"><div className="flex items-center gap-2"><Badge variant="secondary" className="rounded-full bg-[#edf2eb] px-2 py-0.5 text-[10px] font-bold text-[#3e6654]">{video.grade}</Badge><span className="text-[11px] font-semibold text-[#537063]">{video.subject}</span><span className="truncate text-[11px] text-[#8a968f]">{video.unit}</span></div><h3 className="mt-2 line-clamp-2 min-h-11 text-[14px] font-bold leading-5 text-[#213f35]">{video.title}</h3><div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#688076]"><span>動画を見る</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eff3ee] transition-transform group-hover:translate-x-0.5"><ArrowRight className="h-3.5 w-3.5" /></span></div></div>
                  <span className="absolute right-4 top-[calc(56.25%+14px)] text-[10px] text-[#a7b0a9]">#{((catalogQuery.data.page - 1) * catalogQuery.data.pageSize) + index + 1}</span>
                </Link>
              ))}
            </div>
            {!catalogQuery.isLoading && catalogQuery.data?.items.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-[#17372f]/20 bg-[#f8f6f1] p-10 text-center"><p className="font-serif-display text-2xl text-[#17372f]">見つかりませんでした。</p><p className="mt-2 text-sm text-[#708077]">検索語や絞り込み条件を変えて、もう一度お試しください。</p></div>}
            {(catalogQuery.data?.totalPages ?? 1) > 1 && <div className="mt-8 flex items-center justify-center gap-3"><Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-full border-[#17372f]/15 bg-white"><ChevronLeft className="h-4 w-4" /></Button><span className="min-w-18 text-center text-sm font-medium text-[#52635a]">{page} / {catalogQuery.data?.totalPages}</span><Button variant="outline" size="icon" disabled={page >= (catalogQuery.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} className="rounded-full border-[#17372f]/15 bg-white"><ChevronRight className="h-4 w-4" /></Button></div>}
          </div>
        </section>

        <section id="how-it-works" className="px-5 py-16 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="text-xs font-bold tracking-[0.2em] text-[#b77a25]">LEARNING FLOW</p><h2 className="mt-3 font-serif-display text-4xl leading-tight tracking-[-0.03em] text-[#17372f]">観て、残して、<br />次へ進む。</h2><p className="mt-5 max-w-sm text-sm leading-7 text-[#67776e]">動画を入口に、理解の整理と自分の歩みをひとつの場所に集めます。</p></div><div className="grid gap-4 sm:grid-cols-3">{[["01", "探す", "科目・単元・キーワードから、今の自分に必要な動画を選びます。", Search], ["02", "観て、整理する", "要約と覚えるポイントを見ながら、理解を定着させます。", Play], ["03", "振り返る", "視聴済みの記録と割合を、マイページで確かめられます。", Clock3]].map(([number, title, description, Icon]) => { const ItemIcon = Icon as typeof Search; return <div key={String(number)} className="rounded-[20px] border border-[#17372f]/10 bg-[#fffdf9] p-6 shadow-[0_8px_26px_rgba(32,48,40,0.04)]"><div className="flex items-start justify-between"><span className="font-serif-display text-2xl text-[#c28d35]">{String(number)}</span><ItemIcon className="h-5 w-5 text-[#2d6853]" /></div><h3 className="mt-8 text-base font-bold text-[#17372f]">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-[#6e7c74]">{String(description)}</p></div>})}</div></div></section>
      </main>
      <footer className="border-t border-[#17372f]/10 px-5 py-7 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-[#738178] sm:flex-row"><span>Try IT Study Companion — independent learning support</span><a className="hover:text-[#17372f]" href="https://www.youtube.com/channel/UCcj-cHmS0uD91MLjtdiN89Q" target="_blank" rel="noreferrer">映像授業 Try IT 公式チャンネル</a></div></footer>
    </div>
  );
}
