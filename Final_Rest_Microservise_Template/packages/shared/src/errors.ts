export type ValidationIssue = { field: string; message: string };

export class AppError extends Error {
  statusCode: number;
  errors?: ValidationIssue[];

  constructor(message: string, statusCode = 500, errors?: ValidationIssue[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

