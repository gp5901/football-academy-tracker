export class BusinessError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "BusinessError"
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConcurrencyError"
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthenticationError"
  }
}
