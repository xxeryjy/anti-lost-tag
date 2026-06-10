import { appendScan, findTagByUid } from '~/server/services/mock-data'
import { sendScanNotificationEmail } from '~/server/services/mail'
import { createPublicScan, getTagByUid, updateScanNotificationStatus } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { enforceIpRateLimit, getRequestIp, readPositiveRuntimeNumber } from '~/server/utils/request'
import type { LocationSource } from '~/types/smarttag'

const locationSources: LocationSource[] = ['GPS', 'IP']

function readNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const config = useRuntimeConfig(event)
  enforceIpRateLimit(event, {
    scope: `public-scan:${uid}`,
    maxRequests: readPositiveRuntimeNumber(config.publicScanRateLimitMax, 60),
    windowMs: readPositiveRuntimeNumber(config.publicScanRateLimitWindowMs, 60 * 1000)
  })

  const dataSource = getApiDataSource(event)
  const tag = dataSource === 'database'
    ? await getTagByUid(uid)
    : findTagByUid(uid)

  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  const body = await readBody<Record<string, unknown>>(event)
  const locationSource = typeof body.locationSource === 'string' && locationSources.includes(body.locationSource as LocationSource)
    ? body.locationSource as LocationSource
    : 'IP'
  const payload = {
    locationSource,
    latitude: readNullableNumber(body.latitude),
    longitude: readNullableNumber(body.longitude),
    city: readNullableString(body.city),
    region: readNullableString(body.region),
    country: readNullableString(body.country),
    mapUrl: readNullableString(body.mapUrl),
    ipAddress: getRequestIp(event),
    userAgent: getHeader(event, 'user-agent') || 'Browser'
  }

  let scan = dataSource === 'database'
    ? await createPublicScan(uid, payload)
    : appendScan(uid, payload)

  if (!scan) {
    fail(500, 'SCAN_CREATE_FAILED', '扫描记录保存失败，请稍后重试')
  }

  if (dataSource === 'database' && scan.notificationStatus === 'PENDING' && tag.profile?.notificationEmail) {
    const mailResult = await sendScanNotificationEmail(event, {
      to: tag.profile.notificationEmail,
      tagUid: tag.uid,
      displayName: tag.profile.displayName,
      scannedAt: scan.scannedAt,
      locationText: [scan.city, scan.region, scan.country].filter(Boolean).join(', ') || scan.locationSource,
      mapUrl: scan.mapUrl
    })
    if (mailResult.sent) {
      scan = await updateScanNotificationStatus(scan.id, 'SENT')
    } else if (!mailResult.mockMode) {
      scan = await updateScanNotificationStatus(scan.id, 'FAILED')
    }
  }

  return ok({
    scan
  })
})
