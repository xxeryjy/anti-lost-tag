import { createPrivacyMessage, findTagByUid } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const tag = findTagByUid(uid)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (!tag.profile?.privacyMode) {
    fail(403, 'FORBIDDEN', '当前标签未开启隐私留言')
  }

  const body = await readBody<{ finderName?: string | null; finderContact?: string | null; message?: string }>(event)
  if (!body.message) {
    fail(400, 'BAD_REQUEST', '留言内容不能为空')
  }

  const record = createPrivacyMessage(uid, {
    finderName: body.finderName || null,
    finderContact: body.finderContact || null,
    message: body.message
  })

  return ok({
    messageRecord: record
  })
})
