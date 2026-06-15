<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { getAuthErrorMessage } = useAuthErrorMessage()

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  password: '',
  preferredLocale: locale.value as 'zh-CN' | 'en' | 'ja'
})

const verifyForm = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: typeof route.query.code === 'string' ? route.query.code : ''
})

const step = ref<'REGISTER' | 'VERIFY'>(
  verifyForm.email ? 'VERIFY' : 'REGISTER'
)
const devMailboxUrl = ref('')
const autoConfirmToken = ref('')
const { isLoading, errorMessage, errorCode, successMessage, run, setSuccess, setError } = useApiRequest()

function getRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard/tags'
}

function openVerifyStep(email: string, mailboxUrl?: string | null) {
  form.email = email
  verifyForm.email = email
  step.value = 'VERIFY'
  devMailboxUrl.value = mailboxUrl || ''
}

async function submitRegister() {
  if (!form.email || !form.password) {
    setError(t('auth.errorRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{
    nextStep: string
    codeDelivery?: {
      devMailboxUrl?: string | null
    }
  }>(() => $fetch('/api/auth/register', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  openVerifyStep(form.email, data.codeDelivery?.devMailboxUrl)
  setSuccess(t('auth.registerSuccess'))
}

async function resendVerification() {
  if (!verifyForm.email) {
    setError(t('auth.errorEmailRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{
    accepted: boolean
    devMailboxUrl?: string | null
  }>(() => $fetch('/api/auth/verify-email/request', {
    method: 'POST',
    body: {
      email: verifyForm.email
    }
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  devMailboxUrl.value = data.devMailboxUrl || ''
  setSuccess(t('auth.verifyResentSuccess'))
}

async function confirmEmail() {
  if (isLoading.value) {
    return
  }

  if (!verifyForm.email || !verifyForm.code) {
    setError(t('auth.errorVerifyRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{ user: { email: string } }>(() => $fetch('/api/auth/verify-email/confirm', {
    method: 'POST',
    body: verifyForm
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  setSuccess(t('auth.verifySuccess'))
  await navigateTo(localePath(`/auth/login?redirect=${encodeURIComponent(getRedirectPath())}`))
}

watch(
  () => [route.query.email, route.query.code],
  async ([email, code]) => {
    if (typeof email === 'string' && email) {
      verifyForm.email = email
      form.email = email
      step.value = 'VERIFY'
    }
    if (typeof code === 'string') {
      verifyForm.code = code
    }

    if (typeof email === 'string' && email && typeof code === 'string' && code) {
      const nextToken = `${email}:${code}`
      if (autoConfirmToken.value !== nextToken) {
        autoConfirmToken.value = nextToken
        await confirmEmail()
      }
    }
  },
  { immediate: true }
)

useHead({
  title: t('auth.registerTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card auth-register-card">
        <span class="eyebrow">
          {{ step === 'REGISTER' ? t('auth.registerEyebrow') : t('auth.verifyEyebrow') }}
        </span>
        <h1 class="section-title">
          {{ step === 'REGISTER' ? t('auth.registerTitle') : t('auth.verifyTitle') }}
        </h1>

        <div class="auth-step-strip">
          <div class="auth-step-chip" :class="{ 'is-active': step === 'REGISTER', 'is-done': step === 'VERIFY' }">
            <span class="auth-step-index">1</span>
            <span>{{ t('auth.registerTitle') }}</span>
          </div>
          <div class="auth-step-divider" />
          <div class="auth-step-chip" :class="{ 'is-active': step === 'VERIFY' }">
            <span class="auth-step-index">2</span>
            <span>{{ t('auth.verifyTitle') }}</span>
          </div>
        </div>

        <form v-if="step === 'REGISTER'" @submit.prevent="submitRegister">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="form.email" type="email" autocomplete="username" />
          </label>
          <label class="field-label">
            {{ t('auth.password') }}
            <input v-model="form.password" type="password" autocomplete="new-password" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('auth.registerAction') }}
          </button>
          <p class="form-note">{{ t('auth.registerFlowHint') }}</p>
        </form>

        <form v-else @submit.prevent="confirmEmail">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="verifyForm.email" type="email" autocomplete="username" />
          </label>
          <label class="field-label">
            {{ t('auth.verificationCode') }}
            <input v-model="verifyForm.code" type="text" autocomplete="one-time-code" :readonly="isLoading" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('auth.verifyAction') }}
          </button>
          <div class="auth-action-row">
            <button class="ghost-button" type="button" :disabled="isLoading" @click="resendVerification">
              {{ t('auth.resendVerificationAction') }}
            </button>
            <NuxtLink
              v-if="devMailboxUrl"
              class="ghost-button"
              :to="localePath(devMailboxUrl)"
            >
              {{ t('auth.openDevMailboxAction') }}
            </NuxtLink>
          </div>
          <p class="form-note">{{ t('auth.verifyFlowHint') }}</p>
        </form>

        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
