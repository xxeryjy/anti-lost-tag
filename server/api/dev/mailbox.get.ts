import { fail, ok } from '~/server/utils/api-response'
import { isDevMailboxEnabled, listDevMailboxMessages } from '~/server/services/dev-mailbox'

export default defineEventHandler(async (event) => {
  if (!isDevMailboxEnabled()) {
    fail(404, 'NOT_FOUND', '开发收件箱仅在非生产环境可用')
  }

  const query = getQuery(event)
  const email = typeof query.email === 'string' ? query.email : undefined
  const messages = await listDevMailboxMessages(email)

  return ok({
    messages
  })
})
