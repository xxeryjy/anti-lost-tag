const SESSION_COOKIE_NAME = 'smarttag_session'

export function setMockSession(event: H3Event, userId: number) {
  setCookie(event, SESSION_COOKIE_NAME, String(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  })
}

export function clearMockSession(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
}

export function getMockSessionUserId(event: H3Event) {
  const value = getCookie(event, SESSION_COOKIE_NAME)
  return value ? Number(value) : null
}
