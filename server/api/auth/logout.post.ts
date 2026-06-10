import { ok } from '~/server/utils/api-response'
import { clearAuthSession } from '~/server/utils/session'

export default defineEventHandler((event) => {
  clearAuthSession(event)
  return ok({
    message: '登出成功'
  })
})
