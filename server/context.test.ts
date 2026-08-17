import { describe, expect, it, vi } from "vitest";
import {
  DatabaseUnavailableError,
  InvalidSessionError,
  OAuthServiceUnavailableError,
} from "../shared/_core/errors";

const authenticateRequest = vi.hoisted(() => vi.fn());
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));

const { createContext } = await import("./_core/context");

const request = { headers: {} } as never;
const response = {} as never;

describe("authentication context error classification", () => {
  it("keeps invalid credentials anonymous for public procedures", async () => {
    authenticateRequest.mockRejectedValueOnce(new InvalidSessionError());

    const context = await createContext({ req: request, res: response });

    expect(context.user).toBeNull();
  });

  it.each([DatabaseUnavailableError, OAuthServiceUnavailableError])(
    "does not convert %s into anonymous access",
    async ErrorType => {
      authenticateRequest.mockRejectedValueOnce(new ErrorType());

      await expect(
        createContext({ req: request, res: response })
      ).rejects.toBeInstanceOf(ErrorType);
    }
  );
});
