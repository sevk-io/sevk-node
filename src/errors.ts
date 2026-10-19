export class SevkError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly responseBody?: unknown
  public readonly details?: unknown
  public readonly fields: Record<string, string[]>

  constructor(
    message: string,
    statusCode = 0,
    code = "UNKNOWN_ERROR",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {},
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = "SevkError"
    this.statusCode = statusCode
    this.code = code
    this.responseBody = responseBody
    this.details = details
    this.fields = fields
  }
}

export class BadRequestError extends SevkError {
  constructor(
    message: string,
    statusCode = 400,
    code = "BAD_REQUEST",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "BadRequestError"
  }
}

export class UnauthorizedError extends SevkError {
  constructor(
    message: string,
    statusCode = 401,
    code = "UNAUTHORIZED",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends SevkError {
  constructor(
    message: string,
    statusCode = 403,
    code = "FORBIDDEN",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends SevkError {
  constructor(
    message: string,
    statusCode = 404,
    code = "NOT_FOUND",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends SevkError {
  constructor(
    message: string,
    statusCode = 409,
    code = "CONFLICT",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "ConflictError"
  }
}

export class RateLimitError extends SevkError {
  public readonly retryAfter?: number

  constructor(
    message: string,
    statusCode = 429,
    code = "TOO_MANY_REQUESTS",
    responseBody?: unknown,
    retryAfter?: number,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
}

export class ValidationError extends SevkError {
  constructor(
    message: string,
    statusCode = 0,
    code = "VALIDATION_ERROR",
    responseBody?: unknown,
    fields: Record<string, string[]> = {},
    details?: unknown
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "ValidationError"
  }
}

export class InternalServerError extends SevkError {
  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    responseBody?: unknown,
    details?: unknown,
    fields: Record<string, string[]> = {}
  ) {
    super(message, statusCode, code, responseBody, details, fields)
    this.name = "InternalServerError"
  }
}

const MAX_RETRY_AFTER_SECONDS = 2_147_483_647

function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) {
    return undefined
  }
  const seconds = Number(normalized)
  return Number.isSafeInteger(seconds) && seconds <= MAX_RETRY_AFTER_SECONDS
    ? seconds
    : undefined
}

function readHeader(
  headers: Headers | Record<string, string>,
  name: string
): string | null {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name)
  }
  const record = headers as Record<string, string>
  return record[name] ?? record[name.toLowerCase()] ?? null
}

export function fromResponse(
  status: number,
  headers: Headers | Record<string, string>,
  body: unknown
): SevkError {
  let statusCode = status

  let payload: Record<string, unknown> = {}
  if (body !== null && typeof body === "object") {
    const obj = body as Record<string, unknown>
    if (
      obj.error !== null &&
      typeof obj.error === "object" &&
      !Array.isArray(obj.error)
    ) {
      payload = obj.error as Record<string, unknown>
    } else {
      payload = obj
    }
  }

  const code =
    typeof payload.code === "string" && payload.code
      ? payload.code
      : "UNKNOWN_ERROR"
  const textMessage =
    typeof body === "string" && body.trim() ? body.trim() : undefined
  const message =
    typeof payload.message === "string" && payload.message
      ? payload.message
      : textMessage || `HTTP ${statusCode}`
  const details = payload.details

  const fields: Record<string, string[]> = {}
  const fieldsRaw = payload.fields
  if (
    fieldsRaw !== null &&
    typeof fieldsRaw === "object" &&
    !Array.isArray(fieldsRaw)
  ) {
    for (const [key, value] of Object.entries(
      fieldsRaw as Record<string, unknown>
    )) {
      fields[String(key)] = Array.isArray(value)
        ? value.map((v) => String(v))
        : [String(value)]
    }
  }

  if (
    statusCode === 422 ||
    (statusCode === 400 && (
      code === "VALIDATION_ERROR" || Object.keys(fields).length > 0
    ))
  ) {
    return new ValidationError(
      message,
      statusCode || 400,
      code || "VALIDATION_ERROR",
      body,
      fields,
      details
    )
  }

  switch (statusCode) {
    case 400:
      return new BadRequestError(
        message,
        statusCode,
        code || "BAD_REQUEST",
        body,
        details,
        fields
      )
    case 401:
      return new UnauthorizedError(
        message,
        statusCode,
        code || "UNAUTHORIZED",
        body,
        details,
        fields
      )
    case 403:
      return new ForbiddenError(
        message,
        statusCode,
        code || "FORBIDDEN",
        body,
        details,
        fields
      )
    case 404:
      return new NotFoundError(
        message,
        statusCode,
        code || "NOT_FOUND",
        body,
        details,
        fields
      )
    case 409:
      return new ConflictError(
        message,
        statusCode,
        code || "CONFLICT",
        body,
        details,
        fields
      )
    case 429:
      return new RateLimitError(
        message,
        statusCode,
        code || "TOO_MANY_REQUESTS",
        body,
        parseRetryAfter(readHeader(headers, "Retry-After")),
        details,
        fields
      )
  }

  if (statusCode >= 500) {
    return new InternalServerError(
      message,
      statusCode,
      code || "INTERNAL_SERVER_ERROR",
      body,
      details,
      fields
    )
  }

  return new SevkError(message, statusCode, code, body, details, fields)
}
