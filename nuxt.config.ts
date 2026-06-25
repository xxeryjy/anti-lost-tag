export default defineNuxtConfig({
  devtools: { enabled: true },
  experimental: {
    appManifest: false
  },
  css: ['~/assets/styles/main.scss'],
  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@vant/nuxt'],
  vant: {
    importStyle: true
  },
  runtimeConfig: {
    apiDataSource: process.env.API_DATA_SOURCE || 'mock',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    authMockCode: process.env.AUTH_MOCK_CODE || '123456',
    authEnableEmailVendor: process.env.AUTH_ENABLE_EMAIL_VENDOR || 'false',
    authCodeExpiresMinutes: process.env.AUTH_CODE_EXPIRES_MINUTES || '10',
    mailProvider: process.env.MAIL_PROVIDER || 'none',
    mailFrom: process.env.MAIL_FROM || '',
    mailApiKey: process.env.MAIL_API_KEY || '',
    mailSmtpHost: process.env.MAIL_SMTP_HOST || '',
    mailSmtpPort: process.env.MAIL_SMTP_PORT || '',
    mailSmtpSecure: process.env.MAIL_SMTP_SECURE || '',
    mailSmtpUser: process.env.MAIL_SMTP_USER || '',
    mailSmtpPass: process.env.MAIL_SMTP_PASS || '',
    uploadMaxImageSizeBytes: process.env.UPLOAD_MAX_IMAGE_SIZE_BYTES || `${5 * 1024 * 1024}`,
    uploadImageRateLimitMax: process.env.UPLOAD_IMAGE_RATE_LIMIT_MAX || '20',
    uploadImageRateLimitWindowMs: process.env.UPLOAD_IMAGE_RATE_LIMIT_WINDOW_MS || `${60 * 60 * 1000}`,
    publicScanRateLimitMax: process.env.PUBLIC_SCAN_RATE_LIMIT_MAX || '60',
    publicScanRateLimitWindowMs: process.env.PUBLIC_SCAN_RATE_LIMIT_WINDOW_MS || `${60 * 1000}`,
    publicMessageRateLimitMax: process.env.PUBLIC_MESSAGE_RATE_LIMIT_MAX || '10',
    publicMessageRateLimitWindowMs: process.env.PUBLIC_MESSAGE_RATE_LIMIT_WINDOW_MS || `${5 * 60 * 1000}`,
    public: {
      appName: 'SmartTag',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      defaultLocale: process.env.DEFAULT_LOCALE || 'zh-CN'
    }
  },
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'zh-CN',
    lazy: true,
    langDir: 'locales',
    bundle: {
      optimizeTranslationDirective: false
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'smarttag_locale',
      redirectOn: 'root'
    },
    locales: [
      { code: 'zh-CN', iso: 'zh-CN', file: 'zh-CN.json', name: '简体中文' },
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ja', iso: 'ja-JP', file: 'ja.json', name: '日本語' }
    ]
  },
  app: {
    head: {
      title: 'SmartTag',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          name: 'description',
          content: 'SmartTag 帮助主人绑定防丢牌，并让发现者快速看到公开信息。'
        }
      ]
    }
  }
})
