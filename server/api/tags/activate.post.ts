import { activateTag } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = getMockSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const body = await readBody<{ uid?: string; activationCode?: string }>(event)
  if (!body.uid || !body.activationCode) {
    fail(400, 'BAD_REQUEST', '标签 UID 和激活码不能为空')
  }

  const result = activateTag(body.uid, body.activationCode, userId)
  if (result.kind === 'NOT_FOUND') {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (result.kind === 'ALREADY_OWNED') {
    return ok({
      tag: result.tag,
      alreadyOwned: true
    })
  }
  if (result.kind === 'ALREADY_BOUND') {
    fail(409, 'TAG_ALREADY_BOUND', '标签已被绑定')
  }
  if (result.kind === 'INVALID_CODE') {
    fail(400, 'INVALID_ACTIVATION_CODE', '激活码错误')
  }

  return ok({
    tag: result.tag
  })
})
