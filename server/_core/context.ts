import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { InvalidSessionError } from "../../shared/_core/errors";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Missing/invalid credentials are expected for public procedures. Keep
    // infrastructure failures visible so protected requests do not become
    // anonymous requests during a database or OAuth outage.
    if (!(error instanceof InvalidSessionError)) throw error;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
