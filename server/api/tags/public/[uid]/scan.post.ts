import { appendScan, findTagByUid } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  if (!findTagByUid(uid)) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  const body = await readBody<Record<string, unknown>>(event)
  const scan = appendScan(uid, body as Parameters<typeof appendScan>[1])
  return ok({
    scan
  })
})
