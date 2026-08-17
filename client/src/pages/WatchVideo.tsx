import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, CircleCheck, Clock3, FileText, KeyRound, Loader2, Play, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

export default function WatchVideo() {
  const [, params] = useRoute<{ videoId: string }>("/watch/:videoId");
  const videoId = params?.videoId ?? "";
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const videoQuery = trpc.catalog.get.useQuery({ videoId }, { enabled: Boolean(videoId) });
  const markWatched = trpc.catalog.markWatched.useMutation({
    onSuccess: async () => {
      toast.success("視聴済みに記録しました");
      await Promise.all([utils.catalog.get.invalidate({ videoId }), utils.catalog.list.invalidate(), utils.learning.myProgress.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });
  const saveNote = trpc.notes.upsert.useMutation({
    onSuccess: async () => {
      toast.success("予習復習ノートを保存しました");
      await utils.catalog.get.invalidate({ videoId });
    },
    onError: (error) => toast.error(error.message),
  });
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState("");

  useEffect(() => {
    setSummary(videoQuery.data?.note?.summary ?? "");
    setKeyPoints(videoQuery.data?.note?.keyPoints ?? "");
  }, [videoQuery.data?.note?.keyPoints, videoQuery.data?.note?.summary]);


  if (videoQuery.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f7f5f0]"><Loader2 className="h-7 w-7 animate-spin text-[#b77a25]" /></div>;
  if (!videoQuery.data) return <div className="grid min-h-screen place-items-center bg-[#f7f5f0] px-5 text-center"><div><p className="font-serif-display text-4xl text-[#17372f]">動画が見つかりません。</p><Link href="/"><Button className="mt-5 bg-[#17372f] text-white">一覧に戻る</Button></Link></div></div>;

  const { video, note, isWatched } = videoQuery.data;
  const pointList = note?.keyPoints.split("\n").map((point) => point.trim()).filter(Boolean) ?? [];
  const canEdit = user?.role === "admin";
  const handlePlaybackStarted = () => {
    if (isAuthenticated && !isWatched && !markWatched.isPending) {
      markWatched.mutate({ videoId });
    }
  };

  return <div className="min-h-screen bg-[#f7f5f0] text-[#17372f]"><header className="border-b border-[#17372f]/10 bg-[#fffdf9]/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#3d564b] hover:text-[#17372f]"><ArrowLeft className="h-4 w-4" /> 動画一覧へ</Link><Link href="/my-learning" className="text-sm font-semibold text-[#3d564b] hover:text-[#17372f]">マイページ</Link></div></header><main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-11"><div className="mb-6 flex flex-wrap items-center gap-2"><Badge className="rounded-full bg-[#eaf1e9] text-[#35614e] hover:bg-[#eaf1e9]">{video.subject}</Badge><span className="text-sm text-[#87938c]">{video.unit}</span>{isWatched && <span className="ml-auto flex items-center gap-1 rounded-full bg-[#e6f1e9] px-2.5 py-1 text-xs font-bold text-[#2b7255]"><Check className="h-3.5 w-3.5" /> 視聴済み</span>}</div><h1 className="max-w-4xl font-serif-display text-3xl leading-tight tracking-[-0.025em] text-[#17372f] sm:text-4xl">{video.title}</h1><div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]"><div><div className="overflow-hidden rounded-[24px] border-4 border-white bg-black shadow-[0_20px_50px_rgba(22,48,40,0.17)]"><div className="aspect-video"><YouTubePlayer videoId={video.id} title={video.title} isWatched={isWatched} onPlaybackStarted={handlePlaybackStarted} /></div></div><div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#17372f]/10 bg-[#fffdf9] p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f0e8] text-[#2b7255]"><Play className="ml-0.5 h-4 w-4 fill-current" /></span><div><p className="text-sm font-bold text-[#17372f]">再生を自動で記録</p><p className="mt-0.5 text-xs text-[#78867e]">再生開始を検知して学習履歴に反映します</p></div></div>{isAuthenticated ? <Button disabled={isWatched || markWatched.isPending} onClick={() => markWatched.mutate({ videoId })} className="bg-[#17372f] text-white hover:bg-[#21483d]">{markWatched.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isWatched ? <CircleCheck className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}{isWatched ? "記録済み" : "今すぐ記録"}</Button> : <Button onClick={startLogin} className="bg-[#17372f] text-white hover:bg-[#21483d]">ログインして記録</Button>}</div><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#738178]"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {video.durationLabel}</span><a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#416a58] hover:underline">YouTubeで開く</a><span>出典：映像授業 Try IT 公式チャンネル</span></div></div><aside className="space-y-5"><div className="overflow-hidden rounded-[22px] border border-[#17372f]/10 bg-[#fffdf9] shadow-[0_10px_32px_rgba(37,55,45,0.06)]"><div className="border-b border-[#17372f]/8 bg-[#eaf1e9] px-5 py-4"><div className="flex items-center gap-2 text-[#285b48]"><FileText className="h-4 w-4" /><h2 className="font-bold">予習・復習ノート</h2></div><p className="mt-1 text-xs text-[#668075]">動画を観る前と後に、理解を整えましょう。</p></div><div className="space-y-6 p-5"><div><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-[#f5ead1] text-[#9d6a1c]"><FileText className="h-3.5 w-3.5" /></span><h3 className="text-sm font-bold text-[#17372f]">要約</h3></div>{note ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#53675d]">{note.summary}</p> : <p className="mt-3 text-sm leading-7 text-[#7e8a83]">この動画の要約は、これから登録できます。視聴後に重要な流れを自分の言葉で確認しましょう。</p>}</div><div className="border-t border-[#17372f]/8 pt-5"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-[#f5ead1] text-[#9d6a1c]"><KeyRound className="h-3.5 w-3.5" /></span><h3 className="text-sm font-bold text-[#17372f]">覚えるポイント</h3></div>{pointList.length ? <ul className="mt-3 space-y-2.5">{pointList.map((point, index) => <li key={`${point}-${index}`} className="flex gap-2 text-sm leading-6 text-[#53675d]"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#2c7a58]" />{point}</li>)}</ul> : <p className="mt-3 text-sm leading-7 text-[#7e8a83]">確認したい用語、式、因果関係を、ポイントとして登録できます。</p>}</div></div></div>{canEdit && <div className="rounded-[22px] border border-[#b77a25]/25 bg-[#fff8e9] p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#a66d16]" /><h2 className="text-sm font-bold text-[#765216]">管理者用：ノートを登録</h2></div><div className="mt-4 space-y-3"><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="要約を入力" className="min-h-24 border-[#b77a25]/20 bg-white text-sm focus-visible:ring-[#b77a25]" /><Textarea value={keyPoints} onChange={(event) => setKeyPoints(event.target.value)} placeholder="覚えるポイントを1行ずつ入力" className="min-h-24 border-[#b77a25]/20 bg-white text-sm focus-visible:ring-[#b77a25]" /><Button disabled={!summary.trim() || !keyPoints.trim() || saveNote.isPending} onClick={() => saveNote.mutate({ videoId, summary, keyPoints })} className="w-full bg-[#9b6b21] text-white hover:bg-[#855a18]">{saveNote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}保存する</Button></div></div>}</aside></div></main></div>;
}
