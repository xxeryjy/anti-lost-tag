function createMeta() {
  return {
    requestId: `req_${Date.now()}`,
    timestamp: new Date().toISOString()
  }
}

export function ok<T>(data: T) {
  return {
    success: true,
    data,
    meta: createMeta()
  }
}

export function fail(statusCode: number, code: string, message: string) {
  throw createError({
    statusCode,
    statusMessage: message,
    data: {
      success: false,
      error: {
        code,
        message
      },
      meta: createMeta()
    }
  })
}
