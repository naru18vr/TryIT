import { describe, expect, it } from "vitest";
import type { Request } from "express";
import {
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
  getSessionCookieOptions,
  isSecureRequest,
} from "./_core/cookies";
import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_LOCAL } from "../shared/const";

function request(
  protocol: string,
  headers: Record<string, string | string[]> = {}
) {
  return { protocol, headers } as Request;
}

describe("cookie security policy", () => {
  it.each([
    ["localhost", "http"],
    ["127.0.0.1", "http"],
  ])("uses lax, insecure cookies for local HTTP (%s)", (_host, protocol) => {
    const req = request(protocol);

    expect(isSecureRequest(req)).toBe(false);
    expect(getSessionCookieOptions(req)).toMatchObject({
      sameSite: "lax",
      secure: false,
      httpOnly: true,
      path: "/",
    });
    expect(getOAuthStateCookieName(req)).toBe(OAUTH_STATE_COOKIE_LOCAL);
    expect(getOAuthStateCookieOptions(req)).toEqual({
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  });

  it("uses the host-only secure cookie policy for HTTPS", () => {
    const req = request("https");

    expect(isSecureRequest(req)).toBe(true);
    expect(getSessionCookieOptions(req)).toMatchObject({
      sameSite: "none",
      secure: true,
      httpOnly: true,
      path: "/",
    });
    expect(getOAuthStateCookieName(req)).toBe(OAUTH_STATE_COOKIE);
    expect(getOAuthStateCookieOptions(req)).toEqual({
      sameSite: "none",
      secure: true,
      path: "/",
    });
  });

  it("recognizes HTTPS behind a reverse proxy using the first forwarded protocol", () => {
    expect(
      isSecureRequest(request("http", { "x-forwarded-proto": "https" }))
    ).toBe(true);
    expect(
      isSecureRequest(request("http", { "x-forwarded-proto": "https, http" }))
    ).toBe(true);
    expect(
      isSecureRequest(request("http", { "x-forwarded-proto": "http, https" }))
    ).toBe(false);
  });

  it("returns matching attributes for session cookie creation and clearing", () => {
    const req = request("http");

    expect(getSessionCookieOptions(req)).toEqual(getSessionCookieOptions(req));
    expect(getOAuthStateCookieOptions(req)).toEqual(
      getOAuthStateCookieOptions(req)
    );
  });
});
