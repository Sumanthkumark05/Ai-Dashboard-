/**
 * ApiError – structured error thrown by the api-client for non-2xx responses.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail ?? message;
  }

  /** True when the server returned 401 Unauthorized */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True when the server returned 403 Forbidden */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True when the server returned 404 Not Found */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the server returned 422 Unprocessable Entity (validation) */
  get isValidation(): boolean {
    return this.status === 422;
  }

  /** True when the server returned 429 Too Many Requests */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
