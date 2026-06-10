import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fail } from '~/server/utils/api-response'

const uploadDirectory = join(process.cwd(), 'storage', 'uploads', 'images')
const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename') || ''
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    fail(400, 'BAD_REQUEST', '图片文件名不合法')
  }

  const filePath = join(uploadDirectory, filename)
  const extension = extname(filename).toLowerCase()
  const contentType = contentTypes[extension]
  if (!contentType) {
    fail(404, 'IMAGE_NOT_FOUND', '图片不存在')
  }

  try {
    await access(filePath)
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      fail(404, 'IMAGE_NOT_FOUND', '图片不存在')
    }
  } catch {
    fail(404, 'IMAGE_NOT_FOUND', '图片不存在')
  }

  setHeader(event, 'content-type', contentType)
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  return sendStream(event, createReadStream(filePath))
})
