export class AppError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code = "UNKNOWN_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred. Please try again.";
}

export function isUserRejectedError(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : String(error);
  return msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("user denied");
}
