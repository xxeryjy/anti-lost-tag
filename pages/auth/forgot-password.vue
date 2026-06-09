<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const form = reactive({
  email: 'owner@smarttag.local'
})
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

async function submitForgotPassword() {
  const data = await run<{ accepted: boolean; mockMode: boolean }>(() => $fetch('/api/auth/forgot-password', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    return
  }

  setSuccess(t('auth.forgotSuccess'))
  await navigateTo(localePath(`/auth/reset-password?email=${encodeURIComponent(form.email)}`))
}

useHead({
  title: t('auth.forgotTitle')
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
            <input v-model="form.email" type="email" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('auth.forgotAction') }}
          </button>
        </form>
        <p class="form-note">{{ t('auth.mockCodeHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
