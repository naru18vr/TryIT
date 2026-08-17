import { and, count, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videoNotes, watchHistory } from "../drizzle/schema";
import { DatabaseUnavailableError } from "../shared/_core/errors";
import { ENV } from "./_core/env";

type Database = ReturnType<typeof drizzle>;

let _db: Database | null = null;

function describeDatabaseError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database error";
}

/**
 * Lazily create the database client so the process can start for local tools.
 * Database-backed operations still fail explicitly when configuration or the
 * database itself is unavailable.
 */
export async function getDb(): Promise<Database> {
  if (_db) return _db;

  if (!ENV.databaseUrl) {
    throw new DatabaseUnavailableError();
  }

  try {
    _db = drizzle(ENV.databaseUrl);
    return _db;
  } catch (error) {
    console.error(
      "[Database] Failed to initialize database:",
      describeDatabaseError(error)
    );
    throw new DatabaseUnavailableError();
  }
}

async function withDatabase<T>(
  operation: string,
  query: (db: Database) => Promise<T>
): Promise<T> {
  try {
    return await query(await getDb());
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      console.error(`[Database] ${operation}: database unavailable`);
      throw error;
    }

    console.error(
      `[Database] ${operation} failed:`,
      describeDatabaseError(error)
    );
    throw new DatabaseUnavailableError();
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  await withDatabase("upsert user", async db => {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  });
}

export async function getUserByOpenId(openId: string) {
  return withDatabase("get user", async db => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  });
}

export async function getVideoNote(videoId: string) {
  return withDatabase("get video note", async db => {
    const result = await db
      .select()
      .from(videoNotes)
      .where(eq(videoNotes.videoId, videoId))
      .limit(1);
    return result[0];
  });
}

export async function upsertVideoNote(input: {
  videoId: string;
  summary: string;
  keyPoints: string;
  updatedByUserId: number;
}) {
  await withDatabase("upsert video note", async db => {
    await db
      .insert(videoNotes)
      .values(input)
      .onDuplicateKeyUpdate({
        set: {
          summary: input.summary,
          keyPoints: input.keyPoints,
          updatedByUserId: input.updatedByUserId,
          updatedAt: new Date(),
        },
      });
  });
}

export async function getVideoNoteCount(videoIds: readonly string[]) {
  const uniqueVideoIds = Array.from(new Set(videoIds));

  return withDatabase("count video notes", async db => {
    if (uniqueVideoIds.length === 0) return 0;

    const result = await db
      .select({ count: count() })
      .from(videoNotes)
      .where(inArray(videoNotes.videoId, uniqueVideoIds));
    return Number(result[0]?.count ?? 0);
  });
}

export async function getUserWatchHistory(userId: number) {
  return withDatabase("get watch history", db =>
    db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.watchedAt))
  );
}

export async function hasUserWatchedVideo(userId: number, videoId: string) {
  return withDatabase("check watched video", async db => {
    const result = await db
      .select({ id: watchHistory.id })
      .from(watchHistory)
      .where(
        and(eq(watchHistory.userId, userId), eq(watchHistory.videoId, videoId))
      )
      .limit(1);
    return result.length > 0;
  });
}

export async function getUserWatchedVideoIds(
  userId: number,
  videoIds: readonly string[]
) {
  const uniqueVideoIds = Array.from(new Set(videoIds));
  if (uniqueVideoIds.length === 0) return [];

  return withDatabase("get watched video ids", async db => {
    const result = await db
      .select({ videoId: watchHistory.videoId })
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, userId),
          inArray(watchHistory.videoId, uniqueVideoIds)
        )
      );
    return result.map(entry => entry.videoId);
  });
}

export async function markVideoWatched(userId: number, videoId: string) {
  await withDatabase("mark video watched", async db => {
    const watchedAt = new Date();
    await db
      .insert(watchHistory)
      .values({ userId, videoId, watchedAt })
      .onDuplicateKeyUpdate({
        set: { watchedAt, updatedAt: watchedAt },
      });
  });
}
