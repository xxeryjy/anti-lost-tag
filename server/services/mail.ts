import type { H3Event } from 'h3'
import nodemailer from 'nodemailer'
import { appendDevMailboxMessage } from '~/server/services/dev-mailbox'
import type { PreferredLocale } from '~/types/smarttag'

export interface MailSendResult {
  sent: boolean
  mockMode: boolean
  provider: string
  error?: string
}

interface MailAction {
  label: string
  url: string
}

interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
  actions?: MailAction[]
}

function normalizePreferredLocale(locale?: string | null): PreferredLocale {
  return locale === 'en' || locale === 'ja' ? locale : 'zh-CN'
}

function buildLocalizedScanMail(locale?: string | null) {
  const resolvedLocale = normalizePreferredLocale(locale)

  if (resolvedLocale === 'en') {
    return {
      subjectPrefix: 'SmartTag scan alert',
      scannedCopy: 'was just scanned.',
      timeLabel: 'Time',
      locationLabel: 'Location',
      mapLabel: 'Map',
      publicPageLabel: 'Public page'
    }
  }

  if (resolvedLocale === 'ja') {
    return {
      subjectPrefix: 'SmartTag スキャン通知',
      scannedCopy: 'がスキャンされました。',
      timeLabel: '時刻',
      locationLabel: '位置',
      mapLabel: '地図',
      publicPageLabel: '公開ページ'
    }
  }

  return {
    subjectPrefix: 'SmartTag 扫码提醒',
    scannedCopy: '刚刚被扫描了。',
    timeLabel: '时间',
    locationLabel: '位置',
    mapLabel: '地图',
    publicPageLabel: '公开页面'
  }
}

function getMailProvider(event: H3Event) {
  const config = useRuntimeConfig(event)
  return String(config.mailProvider || 'none').toLowerCase()
}

export function isMailDeliveryEnabled(event: H3Event) {
  const config = useRuntimeConfig(event)
  return String(config.authEnableEmailVendor) === 'true' && getMailProvider(event) !== 'none'
}

function getMailFrom(event: H3Event) {
  const config = useRuntimeConfig(event)
  return String(config.mailFrom || 'SmartTag <no-reply@example.com>')
}

function readSmtpPort(value: unknown) {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 ? port : 465
}

function readSmtpSecure(value: unknown, port: number) {
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === 'true') {
      return true
    }
    if (normalizedValue === 'false') {
      return false
    }
  }

  return port === 465
}

async function sendByResend(event: H3Event, message: MailMessage): Promise<MailSendResult> {
  const config = useRuntimeConfig(event)
  const apiKey = String(config.mailApiKey || '')
  if (!apiKey) {
    return {
      sent: false,
      mockMode: false,
      provider: 'resend',
      error: 'MAIL_API_KEY 未配置'
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: getMailFrom(event),
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html
    })
  })

  if (!response.ok) {
    return {
      sent: false,
      mockMode: false,
      provider: 'resend',
      error: await response.text()
    }
  }

  return {
    sent: true,
    mockMode: false,
    provider: 'resend'
  }
}

async function sendBySmtp(event: H3Event, message: MailMessage): Promise<MailSendResult> {
  const config = useRuntimeConfig(event)
  const host = String(config.mailSmtpHost || '').trim()
  const user = String(config.mailSmtpUser || '').trim()
  const pass = String(config.mailSmtpPass || '')
  const port = readSmtpPort(config.mailSmtpPort)
  const secure = readSmtpSecure(config.mailSmtpSecure, port)

  if (!host || !user || !pass) {
    return {
      sent: false,
      mockMode: false,
      provider: 'smtp',
      error: 'SMTP 配置不完整'
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    })

    await transporter.sendMail({
      from: getMailFrom(event),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    })

    return {
      sent: true,
      mockMode: false,
      provider: 'smtp'
    }
  } catch (error) {
    return {
      sent: false,
      mockMode: false,
      provider: 'smtp',
      error: error instanceof Error ? error.message : 'SMTP 发送失败'
    }
  }
}

async function sendByLocalMailbox(event: H3Event, message: MailMessage): Promise<MailSendResult> {
  await appendDevMailboxMessage({
    from: getMailFrom(event),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    actions: message.actions
  })

  return {
    sent: true,
    mockMode: false,
    provider: 'local'
  }
}

export async function sendMail(event: H3Event, message: MailMessage): Promise<MailSendResult> {
  const provider = getMailProvider(event)
  if (!isMailDeliveryEnabled(event)) {
    return {
      sent: false,
      mockMode: true,
      provider
    }
  }

  if (provider === 'console') {
    console.info('[SmartTag mail]', {
      to: message.to,
      subject: message.subject,
      text: message.text,
      actions: message.actions
    })
    return {
      sent: true,
      mockMode: false,
      provider
    }
  }

  if (provider === 'local') {
    return sendByLocalMailbox(event, message)
  }

  if (provider === 'resend') {
    return sendByResend(event, message)
  }

  if (provider === 'smtp') {
    return sendBySmtp(event, message)
  }

  return {
    sent: false,
    mockMode: false,
    provider,
    error: `暂不支持的邮件供应商: ${provider}`
  }
}

export async function sendAuthCodeEmail(
  event: H3Event,
  payload: {
    to: string
    code: string
    purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET'
    expiresMinutes: number
    actionUrl?: string
  }
) {
  const subject = payload.purpose === 'EMAIL_VERIFY'
    ? 'SmartTag 邮箱验证'
    : 'SmartTag 重置密码'
  const actionText = payload.purpose === 'EMAIL_VERIFY'
    ? '完成邮箱验证'
    : '重置密码'
  const actionLine = payload.actionUrl
    ? `操作链接: ${payload.actionUrl}`
    : ''
  const text = [
    `你的 SmartTag 验证码是: ${payload.code}`,
    '',
    `请在 ${payload.expiresMinutes} 分钟内使用它来${actionText}。`,
    actionLine,
    '如果这不是你本人操作，可以忽略这封邮件。'
  ].filter(Boolean).join('\n')

  const actionHtml = payload.actionUrl
    ? `<p><a href="${payload.actionUrl}">${actionText}</a></p>`
    : ''

  return sendMail(event, {
    to: payload.to,
    subject,
    text,
    html: [
      `<p>你的 SmartTag 验证码是: <strong>${payload.code}</strong></p>`,
      `<p>请在 ${payload.expiresMinutes} 分钟内使用它来${actionText}。</p>`,
      actionHtml,
      '<p>如果这不是你本人操作，可以忽略这封邮件。</p>'
    ].join(''),
    actions: payload.actionUrl
      ? [
          {
            label: actionText,
            url: payload.actionUrl
          }
        ]
      : undefined
  })
}

export async function sendScanNotificationEmail(
  event: H3Event,
  payload: {
    to: string
    tagUid: string
    displayName: string
    scannedAt: string
    locationText: string
    mapUrl: string | null
  }
) {
  const publicUrl = `${String(useRuntimeConfig(event).public.appUrl).replace(/\/$/, '')}/t/${payload.tagUid}`
  const mapText = payload.mapUrl ? `\n地图链接: ${payload.mapUrl}` : ''

  return sendMail(event, {
    to: payload.to,
    subject: `SmartTag 扫码提醒: ${payload.displayName}`,
    text: [
      `${payload.displayName} 的防丢牌刚刚被扫描。`,
      `时间: ${payload.scannedAt}`,
      `位置: ${payload.locationText}${mapText}`,
      `公开页: ${publicUrl}`
    ].join('\n')
  })
}

export async function sendLocalizedScanNotificationEmail(
  event: H3Event,
  payload: {
    to: string
    tagUid: string
    displayName: string
    scannedAt: string
    locationText: string
    mapUrl: string | null
    locale?: PreferredLocale | null
  }
) {
  const publicUrl = `${String(useRuntimeConfig(event).public.appUrl).replace(/\/$/, '')}/t/${payload.tagUid}`
  const copy = buildLocalizedScanMail(payload.locale)
  const mapText = payload.mapUrl ? `\n${copy.mapLabel}: ${payload.mapUrl}` : ''

  return sendMail(event, {
    to: payload.to,
    subject: `${copy.subjectPrefix}: ${payload.displayName}`,
    text: [
      `${payload.displayName}${copy.scannedCopy}`,
      `${copy.timeLabel}: ${payload.scannedAt}`,
      `${copy.locationLabel}: ${payload.locationText}${mapText}`,
      `${copy.publicPageLabel}: ${publicUrl}`
    ].join('\n')
  })
}

export async function sendPrivacyMessageNotificationEmail(
  event: H3Event,
  payload: {
    to: string
    tagUid: string
    displayName: string
    finderName: string | null
    finderContact: string | null
    message: string
  }
) {
  const publicUrl = `${String(useRuntimeConfig(event).public.appUrl).replace(/\/$/, '')}/t/${payload.tagUid}`

  return sendMail(event, {
    to: payload.to,
    subject: `SmartTag 留言提醒: ${payload.displayName}`,
    text: [
      `${payload.displayName} 收到一条新的匿名留言。`,
      `发现者: ${payload.finderName || '未填写'}`,
      `联系方式: ${payload.finderContact || '未填写'}`,
      `留言: ${payload.message}`,
      `公开页: ${publicUrl}`
    ].join('\n')
  })
}
