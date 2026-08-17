import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

vi.hoisted(() => {
  process.env.JWT_SECRET = "session-test-secret";
  process.env.VITE_APP_ID = "tryit-test-app";
});

const { sdk } = await import("./_core/sdk");

describe("session verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a session issued for the current app", async () => {
    const token = await sdk.signSession({
      openId: "user-1",
      appId: "tryit-test-app",
    });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "user-1",
      appId: "tryit-test-app",
      name: "",
    });
  });

  it("rejects a valid token issued for another app", async () => {
    const token = await sdk.signSession({
      openId: "user-1",
      appId: "other-app",
    });

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("rejects expired sessions", async () => {
    const token = await sdk.signSession(
      { openId: "user-1", appId: "tryit-test-app" },
      { expiresInMs: -1 }
    );

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("pins verification to HS256", async () => {
    const key = new TextEncoder().encode("session-test-secret");
    const token = await new SignJWT({
      openId: "user-1",
      appId: "tryit-test-app",
    })
      .setProtectedHeader({ alg: "HS512", typ: "JWT" })
      .setExpirationTime("1h")
      .sign(key);

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });
});
