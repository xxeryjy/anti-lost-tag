<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const form = reactive({
  email: 'new-owner@smarttag.local',
  password: 'Password123',
  preferredLocale: locale.value as 'zh-CN' | 'en' | 'ja'
})
const verifyForm = reactive({
  email: 'new-owner@smarttag.local',
  code: '123456'
})
const step = ref<'REGISTER' | 'VERIFY'>('REGISTER')
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

async function submitRegister() {
  const data = await run<{ nextStep: string }>(() => $fetch('/api/auth/register', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    return
  }

  verifyForm.email = form.email
  step.value = 'VERIFY'
  setSuccess(t('auth.registerSuccess'))
}

async function confirmEmail() {
  const data = await run<{ user: { email: string } }>(() => $fetch('/api/auth/verify-email/confirm', {
    method: 'POST',
    body: verifyForm
  }))

  if (!data) {
    return
  }

  setSuccess(t('auth.verifySuccess'))
  await navigateTo(localePath(`/auth/login?redirect=${encodeURIComponent('/dashboard/tags')}`))
}

useHead({
  title: t('auth.registerTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section page-grid">
      <div class="form-card">
        <span class="eyebrow">{{ t('auth.registerEyebrow') }}</span>
        <h1 class="section-title">{{ t('auth.registerTitle') }}</h1>
        <form @submit.prevent="submitRegister">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="form.email" type="email" />
          </label>
          <label class="field-label">
            {{ t('auth.password') }}
            <input v-model="form.password" type="password" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading || step === 'VERIFY'">
            {{ step === 'VERIFY' ? t('auth.registeredAction') : t('auth.registerAction') }}
          </button>
        </form>
      </div>

      <div class="form-card">
        <span class="eyebrow">{{ t('auth.verifyEyebrow') }}</span>
        <h2 class="section-title">{{ t('auth.verifyTitle') }}</h2>
        <form @submit.prevent="confirmEmail">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="verifyForm.email" type="email" />
          </label>
          <label class="field-label">
            {{ t('auth.verificationCode') }}
            <input v-model="verifyForm.code" type="text" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading || step !== 'VERIFY'">
            {{ isLoading && step === 'VERIFY' ? t('common.submitting') : t('auth.verifyAction') }}
          </button>
        </form>
        <p class="form-note">{{ t('auth.mockCodeHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
