export function useAuthErrorMessage() {
  const { t } = useI18n()

  const authErrorKeys: Record<string, string> = {
    BAD_REQUEST: 'auth.errorRequired',
    INVALID_CREDENTIALS: 'auth.errorInvalidCredentials',
    EMAIL_NOT_VERIFIED: 'auth.errorEmailNotVerified',
    EMAIL_ALREADY_EXISTS: 'auth.errorEmailAlreadyExists',
    USER_NOT_FOUND: 'auth.errorUserNotFound',
    EMAIL_ALREADY_VERIFIED: 'auth.errorEmailAlreadyVerified',
    INVALID_VERIFICATION_CODE: 'auth.errorInvalidVerificationCode'
  }

  function getAuthErrorMessage(code?: string, fallbackKey = 'auth.errorRequestFailed') {
    return t(code && authErrorKeys[code] ? authErrorKeys[code] : fallbackKey)
  }

  return {
    getAuthErrorMessage
  }
}
