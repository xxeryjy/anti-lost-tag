export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/styles/main.scss'],
  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    authMockCode: process.env.AUTH_MOCK_CODE || '123456',
    authEnableEmailVendor: process.env.AUTH_ENABLE_EMAIL_VENDOR || 'false',
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
