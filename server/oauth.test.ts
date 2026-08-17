import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Express, Request, Response } from "express";
import {
  encodeOAuthState,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_LOCAL,
} from "../shared/const";

const mocks = vi.hoisted(() => ({
  upsertUser: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
}));

vi.mock("./db", () => ({ upsertUser: mocks.upsertUser }));
vi.mock("./_core/sdk", () => ({
  sdk: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
    createSessionToken: mocks.createSessionToken,
  },
}));

const { registerOAuthRoutes } = await import("./_core/oauth");

type RouteHandler = (req: Request, res: Response) => Promise<void>;
type ClearedCookie = { name: string; options: Record<string, unknown> };

function createRoute() {
  let handler: RouteHandler | undefined;
  registerOAuthRoutes({
    get(_path, routeHandler) {
      handler = routeHandler as RouteHandler;
      return this;
    },
  } as Express);

  if (!handler) throw new Error("OAuth callback route was not registered");
  return handler;
}

function createResponse() {
  const clearedCookies: ClearedCookie[] = [];
  const setCookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];
  let statusCode = 200;
  let jsonBody: unknown;
  let redirect: { status: number; location: string } | undefined;

  const response = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(body: unknown) {
      jsonBody = body;
      return response;
    },
    clearCookie(name: string, options: Record<string, unknown>) {
      clearedCookies.push({ name, options });
      return response;
    },
    cookie(name: string, value: string, options: Record<string, unknown>) {
      setCookies.push({ name, value, options });
      return response;
    },
    redirect(code: number, location: string) {
      redirect = { status: code, location };
      return response;
    },
  } as unknown as Response;

  return {
    response,
    clearedCookies,
    setCookies,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
    getRedirect: () => redirect,
  };
}

function createRequest(
  state: string,
  cookie: string,
  protocol = "https",
  forwardedProto?: string
) {
  return {
    protocol,
    headers: {
      cookie,
      ...(forwardedProto ? { "x-forwarded-proto": forwardedProto } : {}),
    },
    query: { code: "oauth-code", state },
  } as unknown as Request;
}

describe("OAuth callback state validation", () => {
  beforeEach(() => {
    mocks.upsertUser.mockReset().mockResolvedValue(undefined);
    mocks.exchangeCodeForToken
      .mockReset()
      .mockResolvedValue({ accessToken: "access-token" });
    mocks.getUserInfo.mockReset().mockResolvedValue({
      openId: "oauth-user",
      name: "OAuth User",
      platform: "google",
    });
    mocks.createSessionToken.mockReset().mockResolvedValue("session-token");
  });

  it("continues when the HTTPS nonce matches and clears matching cookie attributes", async () => {
    const nonce = "https-nonce";
    const state = encodeOAuthState({
      redirectUri: "https://tryit.example/api/oauth/callback",
      nonce,
    });
    const route = createRoute();
    const output = createResponse();

    await route(
      createRequest(state, `${OAUTH_STATE_COOKIE}=${nonce}`),
      output.response
    );

    expect(output.getStatus()).toBe(200);
    expect(output.getRedirect()).toEqual({ status: 302, location: "/" });
    expect(output.clearedCookies).toEqual([
      {
        name: OAUTH_STATE_COOKIE,
        options: { path: "/", sameSite: "none", secure: true },
      },
    ]);
    expect(output.setCookies[0]?.options).toMatchObject({
      sameSite: "none",
      secure: true,
      httpOnly: true,
      path: "/",
    });
    expect(mocks.exchangeCodeForToken).toHaveBeenCalledWith(
      "oauth-code",
      state
    );
  });

  it("uses the local HTTP cookie name and lax policy", async () => {
    const nonce = "local-nonce";
    const state = encodeOAuthState({
      redirectUri: "http://localhost:3000/api/oauth/callback",
      nonce,
    });
    const route = createRoute();
    const output = createResponse();

    await route(
      createRequest(state, `${OAUTH_STATE_COOKIE_LOCAL}=${nonce}`, "http"),
      output.response
    );

    expect(output.getRedirect()).toEqual({ status: 302, location: "/" });
    expect(output.clearedCookies).toEqual([
      {
        name: OAUTH_STATE_COOKIE_LOCAL,
        options: { path: "/", sameSite: "lax", secure: false },
      },
    ]);
    expect(output.setCookies[0]?.options).toMatchObject({
      sameSite: "lax",
      secure: false,
      httpOnly: true,
      path: "/",
    });
  });

  it("uses the secure policy when HTTPS is forwarded to the application", async () => {
    const nonce = "forwarded-nonce";
    const state = encodeOAuthState({
      redirectUri: "https://tryit.example/api/oauth/callback",
      nonce,
    });
    const route = createRoute();
    const output = createResponse();

    await route(
      createRequest(state, `${OAUTH_STATE_COOKIE}=${nonce}`, "http", "https"),
      output.response
    );

    expect(output.clearedCookies[0]).toEqual({
      name: OAUTH_STATE_COOKIE,
      options: { path: "/", sameSite: "none", secure: true },
    });
  });

  it.each([
    [
      "nonce mismatch",
      encodeOAuthState({
        redirectUri: "https://tryit.example/callback",
        nonce: "expected",
      }),
      `${OAUTH_STATE_COOKIE}=different`,
    ],
    [
      "nonce missing",
      encodeOAuthState({ redirectUri: "https://tryit.example/callback" }),
      `${OAUTH_STATE_COOKIE}=unused`,
    ],
    ["malformed state", "not-valid-state", `${OAUTH_STATE_COOKIE}=unused`],
  ])(
    "rejects %s before exchanging the OAuth code",
    async (_caseName, state, cookie) => {
      const route = createRoute();
      const output = createResponse();

      await route(createRequest(state, cookie), output.response);

      expect(output.getStatus()).toBe(403);
      expect(output.getJson()).toEqual({ error: "invalid oauth state" });
      expect(output.clearedCookies).toHaveLength(0);
      expect(mocks.exchangeCodeForToken).not.toHaveBeenCalled();
    }
  );
});
