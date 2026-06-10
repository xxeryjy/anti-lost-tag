import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fail, ok } from '~/server/utils/api-response'
import { enforceIpRateLimit, readPositiveRuntimeNumber } from '~/server/utils/request'
import { getSessionUserId } from '~/server/utils/session'

const maxImageSize = 5 * 1024 * 1024
const uploadDirectory = join(process.cwd(), 'storage', 'uploads', 'images')

function detectImageExtension(data: Buffer) {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'jpg'
  }
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  ) {
    return 'png'
  }
  if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp'
  }

  return null
}

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const config = useRuntimeConfig(event)
  enforceIpRateLimit(event, {
    scope: `upload-image:${userId}`,
    maxRequests: readPositiveRuntimeNumber(config.uploadImageRateLimitMax, 20),
    windowMs: readPositiveRuntimeNumber(config.uploadImageRateLimitWindowMs, 60 * 60 * 1000)
  })

  const formData = await readMultipartFormData(event)
  const image = formData?.find((field) => field.name === 'image' && field.filename)

  if (!image || !image.data?.length) {
    fail(400, 'IMAGE_REQUIRED', '请上传图片文件')
  }

  const extension = detectImageExtension(image.data)
  if (!extension) {
    fail(400, 'UNSUPPORTED_IMAGE_TYPE', '仅支持 JPG、PNG 或 WebP 图片')
  }
  const imageSizeLimit = readPositiveRuntimeNumber(config.uploadMaxImageSizeBytes, maxImageSize)
  if (image.data.length > imageSizeLimit) {
    fail(400, 'IMAGE_TOO_LARGE', `图片不能超过 ${Math.floor(imageSizeLimit / 1024 / 1024)}MB`)
  }

  await mkdir(uploadDirectory, { recursive: true })

  const filename = `${Date.now()}-${randomUUID()}.${extension}`
  await writeFile(join(uploadDirectory, filename), image.data)

  return ok({
    url: `/api/uploads/image/${filename}`
  })
})
