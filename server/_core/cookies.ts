import type { CookieOptions, Request } from "express";
import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_LOCAL } from "@shared/const";

export function isSecureRequest(req: Pick<Request, "protocol" | "headers">) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const firstForwardedProto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto.split(",")[0];

  return firstForwardedProto?.trim().toLowerCase() === "https";
}

type CookieSecurityOptions = Pick<
  CookieOptions,
  "path" | "sameSite" | "secure"
>;

function getCookieSecurityOptions(req: Request): CookieSecurityOptions {
  const secure = isSecureRequest(req);
  return {
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    ...getCookieSecurityOptions(req),
    httpOnly: true,
  };
}

export function getOAuthStateCookieName(req: Request) {
  return isSecureRequest(req) ? OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE_LOCAL;
}

export function getOAuthStateCookieOptions(
  req: Request
): CookieSecurityOptions {
  return getCookieSecurityOptions(req);
}
