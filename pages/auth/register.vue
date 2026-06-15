<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { getAuthErrorMessage } = useAuthErrorMessage()

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: typeof route.query.code === 'string' ? route.query.code : '',
  password: '',
  preferredLocale: locale.value as 'zh-CN' | 'en' | 'ja'
})

const devMailboxUrl = ref('')
const autoConfirmToken = ref('')
const hasRequestedCode = ref(!!form.code)
const { isLoading, errorMessage, errorCode, successMessage, run, setSuccess, setError } = useApiRequest()

function getRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard/tags'
}

function applyPrefillEmail(email: string) {
  form.email = email
}

async function requestVerificationCode() {
  if (!form.email) {
    setError(t('auth.errorEmailRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{
    accepted?: boolean
    nextStep?: string
    codeDelivery?: {
      devMailboxUrl?: string | null
    }
    devMailboxUrl?: string | null
  }>(() => $fetch('/api/auth/verify-email/request', {
    method: 'POST',
    body: {
      email: form.email
    }
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  hasRequestedCode.value = true
  devMailboxUrl.value = data.devMailboxUrl || data.codeDelivery?.devMailboxUrl || ''
  setSuccess(t('auth.verifyResentSuccess'))
}

async function submitRegister() {
  if (!form.email || !form.password || !form.code) {
    setError(t('auth.errorRegisterRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{
    user: { email: string }
  }>(async () => {
    const registerResponse = await $fetch<{
      success: true
      data: {
        user: { email: string }
        codeDelivery?: {
          devMailboxUrl?: string | null
        }
      }
    }>('/api/auth/register', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password,
        preferredLocale: form.preferredLocale
      }
    })

    devMailboxUrl.value = registerResponse.data.codeDelivery?.devMailboxUrl || ''

    return $fetch('/api/auth/verify-email/confirm', {
      method: 'POST',
      body: {
        email: form.email,
        code: form.code
      }
    })
  })

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  setSuccess(t('auth.verifySuccess'))
  await navigateTo(localePath(`/auth/login?redirect=${encodeURIComponent(getRedirectPath())}&email=${encodeURIComponent(form.email)}`))
}

watch(
  () => [route.query.email, route.query.code],
  ([email, code]) => {
    if (typeof email === 'string' && email) {
      applyPrefillEmail(email)
    }

    if (typeof code === 'string' && code) {
      form.code = code
      hasRequestedCode.value = true
      const nextToken = `${form.email}:${code}`
      autoConfirmToken.value = nextToken
    }
  },
  { immediate: true }
)

useHead({
  title: t('auth.registerTitle')
})

definePageMeta({
  layout: 'minimal'
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card auth-register-card">
        <span class="eyebrow">{{ t('auth.registerEyebrow') }}</span>
        <h1 class="section-title">{{ t('auth.registerTitle') }}</h1>

        <form class="form-grid two-columns auth-register-grid" @submit.prevent="submitRegister">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="form.email" type="email" autocomplete="username" />
          </label>

          <div class="field-label auth-inline-action-field">
            <span>{{ t('auth.verificationCode') }}</span>
            <div class="auth-inline-input-group">
              <input v-model="form.code" type="text" autocomplete="one-time-code" :readonly="isLoading" />
              <button class="ghost-button" type="button" :disabled="isLoading || !form.email" @click="requestVerificationCode">
                {{ hasRequestedCode ? t('auth.resendVerificationAction') : t('auth.sendVerificationAction') }}
              </button>
            </div>
          </div>

          <label class="field-label auth-register-span-two">
            {{ t('auth.password') }}
            <input v-model="form.password" type="password" autocomplete="new-password" />
          </label>

          <div class="auth-register-span-two auth-action-row auth-register-actions">
            <button class="solid-button" type="submit" :disabled="isLoading">
              {{ isLoading ? t('common.submitting') : t('auth.registerAndVerifyAction') }}
            </button>
            <NuxtLink
              v-if="devMailboxUrl"
              class="ghost-button"
              :to="localePath(devMailboxUrl)"
            >
              {{ t('auth.openDevMailboxAction') }}
            </NuxtLink>
          </div>
        </form>

        <p class="form-note">{{ t('auth.registerFormHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
