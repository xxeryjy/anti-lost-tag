import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const HASH_PREFIX = 'scrypt'
const KEY_LENGTH = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  return `${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [prefix, salt, storedHash] = passwordHash.split('$')
  if (prefix !== HASH_PREFIX || !salt || !storedHash) {
    return false
  }

  const storedBuffer = Buffer.from(storedHash, 'hex')
  const derivedKey = (await scrypt(password, salt, storedBuffer.length)) as Buffer
  return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey)
}
