import type { H3Event } from 'h3'

export interface MailSendResult {
  sent: boolean
  mockMode: boolean
  provider: string
  error?: string
}

interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
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
      text: message.text
    })
    return {
      sent: true,
      mockMode: false,
      provider
    }
  }

  if (provider === 'resend') {
    return sendByResend(event, message)
  }

  return {
    sent: false,
    mockMode: false,
    provider,
    error: `暂不支持的邮件供应商：${provider}`
  }
}

export async function sendAuthCodeEmail(
  event: H3Event,
  payload: {
    to: string
    code: string
    purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET'
    expiresMinutes: number
  }
) {
  const subject = payload.purpose === 'EMAIL_VERIFY'
    ? 'SmartTag 邮箱验证码'
    : 'SmartTag 密码重置验证码'
  const actionText = payload.purpose === 'EMAIL_VERIFY'
    ? '完成邮箱验证'
    : '重置密码'
  const text = [
    `你的 SmartTag 验证码是：${payload.code}`,
    '',
    `请在 ${payload.expiresMinutes} 分钟内使用它来${actionText}。`,
    '如果这不是你本人操作，可以忽略这封邮件。'
  ].join('\n')

  return sendMail(event, {
    to: payload.to,
    subject,
    text,
    html: `<p>你的 SmartTag 验证码是：<strong>${payload.code}</strong></p><p>请在 ${payload.expiresMinutes} 分钟内使用它来${actionText}。</p><p>如果这不是你本人操作，可以忽略这封邮件。</p>`
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
  const mapText = payload.mapUrl ? `\n地图链接：${payload.mapUrl}` : ''

  return sendMail(event, {
    to: payload.to,
    subject: `SmartTag 扫码提醒：${payload.displayName}`,
    text: [
      `${payload.displayName} 的防丢牌刚刚被扫码。`,
      `时间：${payload.scannedAt}`,
      `位置：${payload.locationText}${mapText}`,
      `公开页：${publicUrl}`
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
    subject: `SmartTag 留言提醒：${payload.displayName}`,
    text: [
      `${payload.displayName} 收到一条新的匿名留言。`,
      `发现者：${payload.finderName || '未填写'}`,
      `联系方式：${payload.finderContact || '未填写'}`,
      `留言：${payload.message}`,
      `公开页：${publicUrl}`
    ].join('\n')
  })
}
