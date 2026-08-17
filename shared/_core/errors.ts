/**
 * Base HTTP error class with status code.
 * Throw this from route handlers to send specific HTTP errors.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** A request did not contain a usable session credential. */
export class InvalidSessionError extends Error {
  constructor() {
    super("Invalid session");
    this.name = "InvalidSessionError";
  }
}

/** A required database operation could not be completed. */
export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is unavailable");
    this.name = "DatabaseUnavailableError";
  }
}

/** The OAuth provider could not complete an authentication operation. */
export class OAuthServiceUnavailableError extends Error {
  constructor() {
    super("OAuth service is unavailable");
    this.name = "OAuthServiceUnavailableError";
  }
}

/** The server is missing a required session-authentication setting. */
export class SessionConfigurationError extends Error {
  constructor() {
    super("Session authentication is not configured");
    this.name = "SessionConfigurationError";
  }
}

// Convenience constructors
export const BadRequestError = (msg: string) => new HttpError(400, msg);
export const UnauthorizedError = (msg: string) => new HttpError(401, msg);
export const ForbiddenError = (msg: string) => new HttpError(403, msg);
export const NotFoundError = (msg: string) => new HttpError(404, msg);
