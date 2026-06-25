<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { getAuthErrorMessage } = useAuthErrorMessage()
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : ''
})
const { isLoading, errorMessage, errorCode, successMessage, run, setSuccess, setError } = useApiRequest()

async function submitForgotPassword() {
  if (!form.email) {
    setError(t('auth.errorEmailRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{ accepted: boolean; devMailboxUrl?: string | null }>(() => $fetch('/api/auth/forgot-password', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  setSuccess(t('auth.forgotSuccess'))
  const mailboxQuery = data.devMailboxUrl ? `&mailbox=${encodeURIComponent(data.devMailboxUrl)}` : ''
  await navigateTo(localePath(`/auth/reset-password?email=${encodeURIComponent(form.email)}${mailboxQuery}`))
}

useHead({
  title: t('auth.forgotTitle')
})

definePageMeta({
  layout: 'minimal'
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('auth.forgotEyebrow') }}</span>
        <h1 class="section-title">{{ t('auth.forgotTitle') }}</h1>
        <form @submit.prevent="submitForgotPassword">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="form.email" type="email" autocomplete="username" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('auth.forgotAction') }}
          </button>
        </form>
        <p class="form-note">{{ t('auth.forgotFlowHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
