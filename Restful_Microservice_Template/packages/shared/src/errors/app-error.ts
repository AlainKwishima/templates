export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace(this, new.target);
  }
}

export class ValidationAppError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationAppError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(401, message, "AUTHENTICATION_ERROR", details);
  }
}

export class AuthorizationAppError extends AppError {
  constructor(message = "You are not allowed to perform this action", details?: unknown) {
    super(403, message, "AUTHORIZATION_ERROR", details);
  }
}

export class NotFoundAppError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(404, message, "NOT_FOUND", details);
  }
}

export class ConflictAppError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(409, message, "CONFLICT", details);
  }
}

export class DatabaseAppError extends AppError {
  constructor(message = "Database error", details?: unknown) {
    super(500, message, "DATABASE_ERROR", details, true);
  }
}

export class EmailDeliveryError extends AppError {
  constructor(message = "Email delivery failed", details?: unknown) {
    super(503, message, "EMAIL_DELIVERY_ERROR", details, true);
  }
}

export class ServiceCommunicationError extends AppError {
  constructor(message = "Upstream service error", details?: unknown) {
    super(503, message, "SERVICE_COMMUNICATION_ERROR", details, true);
  }
}
