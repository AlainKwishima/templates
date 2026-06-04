export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: { field: string; message: string }[];
  public readonly isOperational = true;

  constructor(
    message: string,
    statusCode: number,
    errors?: { field: string; message: string }[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
