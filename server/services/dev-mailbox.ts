import { randomUUID } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface DevMailboxAction {
  label: string
  url: string
}

export interface DevMailboxMessage {
  id: string
  from: string
  to: string
  subject: string
  text: string
  html?: string
  actions: DevMailboxAction[]
  createdAt: string
}

const mailboxDirectory = join(process.cwd(), 'storage', 'dev-mailbox')
const mailboxFile = join(mailboxDirectory, 'messages.json')

async function ensureMailboxFile() {
  await mkdir(mailboxDirectory, { recursive: true })

  try {
    await access(mailboxFile)
  } catch {
    await writeFile(mailboxFile, '[]', 'utf8')
  }
}

async function readMailboxMessages() {
  await ensureMailboxFile()
  const raw = await readFile(mailboxFile, 'utf8')

  try {
    const parsed = JSON.parse(raw) as DevMailboxMessage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeMailboxMessages(messages: DevMailboxMessage[]) {
  await ensureMailboxFile()
  await writeFile(mailboxFile, JSON.stringify(messages, null, 2), 'utf8')
}

export function isDevMailboxEnabled() {
  return process.env.NODE_ENV !== 'production'
}

export async function appendDevMailboxMessage(
  payload: Omit<DevMailboxMessage, 'id' | 'createdAt'> & { actions?: DevMailboxAction[] }
) {
  const messages = await readMailboxMessages()
  const nextMessage: DevMailboxMessage = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    actions: payload.actions || []
  }

  messages.unshift(nextMessage)
  await writeMailboxMessages(messages.slice(0, 100))

  return nextMessage
}

export async function listDevMailboxMessages(email?: string) {
  const messages = await readMailboxMessages()
  if (!email) {
    return messages
  }

  const normalizedEmail = email.trim().toLowerCase()
  return messages.filter((message) => message.to.trim().toLowerCase() === normalizedEmail)
}
