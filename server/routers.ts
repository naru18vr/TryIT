import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRYIT_CATALOG, TRYIT_GRADES, TRYIT_SUBJECTS_BY_GRADE, TRYIT_UNITS_BY_GRADE_AND_SUBJECT } from "./data/tryitCatalog";

const catalogListInput = z.object({
  query: z.string().trim().max(120).optional(),
  grade: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(80).optional(),
  unit: z.string().trim().max(80).optional(),
  page: z.number().int().min(1).max(2000).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
});

const catalogFiltersInput = z.object({
  grade: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(80).optional(),
}).optional();

function getCatalogItem(videoId: string) {
  return TRYIT_CATALOG.find((item) => item.id === videoId);
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  catalog: router({
    filters: publicProcedure.input(catalogFiltersInput).query(({ input }) => {
      const grade = input?.grade;
      const subject = input?.subject;
      return {
        grades: TRYIT_GRADES,
        subjects: grade ? (TRYIT_SUBJECTS_BY_GRADE[grade] ?? []) : [],
        units: grade && subject ? (TRYIT_UNITS_BY_GRADE_AND_SUBJECT[`${grade}::${subject}`] ?? []) : [],
        totalVideos: TRYIT_CATALOG.length,
      };
    }),
    list: publicProcedure.input(catalogListInput).query(async ({ ctx, input }) => {
      const normalizedQuery = input.query?.toLocaleLowerCase("ja-JP") ?? "";
      const watchedIds = ctx.user
        ? new Set((await db.getUserWatchHistory(ctx.user.id)).map((entry) => entry.videoId))
        : new Set<string>();
      const matching = TRYIT_CATALOG.filter((item) => {
        const matchesGrade = !input.grade || input.grade === "すべて" || item.grade === input.grade;
        const matchesSubject = !input.subject || input.subject === "すべて" || item.subject === input.subject;
        const matchesUnit = !input.unit || input.unit === "すべて" || item.unit === input.unit;
        const haystack = `${item.title} ${item.grade} ${item.subject} ${item.unit}`.toLocaleLowerCase("ja-JP");
        return matchesGrade && matchesSubject && matchesUnit && (!normalizedQuery || haystack.includes(normalizedQuery));
      });
      const start = (input.page - 1) * input.pageSize;
      return {
        total: matching.length,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.max(1, Math.ceil(matching.length / input.pageSize)),
        items: matching.slice(start, start + input.pageSize).map((item) => ({
          ...item,
          isWatched: watchedIds.has(item.id),
        })),
      };
    }),
    get: publicProcedure.input(z.object({ videoId: z.string().min(1).max(32) })).query(async ({ ctx, input }) => {
      const video = getCatalogItem(input.videoId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "動画が見つかりません。" });
      const [note, history] = await Promise.all([
        db.getVideoNote(input.videoId),
        ctx.user ? db.getUserWatchHistory(ctx.user.id) : Promise.resolve([]),
      ]);
      return {
        video,
        note: note ? { summary: note.summary, keyPoints: note.keyPoints, updatedAt: note.updatedAt } : null,
        isWatched: history.some((entry) => entry.videoId === input.videoId),
      };
    }),
    markWatched: protectedProcedure.input(z.object({ videoId: z.string().min(1).max(32) })).mutation(async ({ ctx, input }) => {
      if (!getCatalogItem(input.videoId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "動画が見つかりません。" });
      }
      await db.markVideoWatched(ctx.user.id, input.videoId);
      return { success: true } as const;
    }),
  }),
  notes: router({
    coverage: publicProcedure.query(async () => {
      const completed = await db.getVideoNoteCount();
      const total = TRYIT_CATALOG.length;
      return {
        completed,
        total,
        percentage: total ? Math.round((completed / total) * 1000) / 10 : 0,
      };
    }),
    upsert: adminProcedure.input(z.object({
      videoId: z.string().min(1).max(32),
      summary: z.string().trim().min(1).max(6000),
      keyPoints: z.string().trim().min(1).max(6000),
    })).mutation(async ({ ctx, input }) => {
      if (!getCatalogItem(input.videoId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "動画が見つかりません。" });
      }
      await db.upsertVideoNote({ ...input, updatedByUserId: ctx.user.id });
      return { success: true } as const;
    }),
  }),
  learning: router({
    myProgress: protectedProcedure.query(async ({ ctx }) => {
      const history = await db.getUserWatchHistory(ctx.user.id);
      const catalogById = new Map(TRYIT_CATALOG.map((item) => [item.id, item]));
      const watched = history.filter((entry) => catalogById.has(entry.videoId));
      const watchedCount = watched.length;
      const totalVideos = TRYIT_CATALOG.length;
      return {
        watchedCount,
        totalVideos,
        progressPercentage: totalVideos ? Math.round((watchedCount / totalVideos) * 1000) / 10 : 0,
        history: watched.map((entry) => ({
          ...catalogById.get(entry.videoId)!,
          watchedAt: entry.watchedAt,
        })),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
