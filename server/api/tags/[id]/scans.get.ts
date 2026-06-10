import { findTagById, getScansByTagId } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { paginateItems, parsePaginationQuery } from '~/server/utils/pagination'
import { getMockSessionUserId } from '~/server/utils/session'
import type { LocationSource, NotificationStatus } from '~/types/smarttag'

const locationSources: LocationSource[] = ['GPS', 'IP']
const notificationStatuses: NotificationStatus[] = ['PENDING', 'SENT', 'FAILED', 'SKIPPED']

export default defineEventHandler((event) => {
  const userId = getMockSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  const tag = findTagById(id)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权查看该标签扫描记录')
  }

  const query = getQuery(event)
  const locationSource = typeof query.locationSource === 'string' && locationSources.includes(query.locationSource as LocationSource)
    ? query.locationSource as LocationSource
    : undefined
  const notificationStatus = typeof query.notificationStatus === 'string' && notificationStatuses.includes(query.notificationStatus as NotificationStatus)
    ? query.notificationStatus as NotificationStatus
    : undefined
  const { page, pageSize } = parsePaginationQuery(query, 5)

  return ok({
    ...paginateItems(getScansByTagId(id, { locationSource, notificationStatus }), page, pageSize)
  })
})
