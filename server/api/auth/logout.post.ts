import { ok } from '~/server/utils/api-response'
import { clearMockSession } from '~/server/utils/session'

export default defineEventHandler((event) => {
  clearMockSession(event)
  return ok({
    message: '登出成功'
  })
})
