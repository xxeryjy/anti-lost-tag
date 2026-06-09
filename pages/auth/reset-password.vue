<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : 'owner@smarttag.local',
  code: '123456',
  newPassword: 'Password456'
})
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

async function submitResetPassword() {
  const data = await run<{ message: string }>(() => $fetch('/api/auth/reset-password', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    return
  }

  setSuccess(t('auth.resetSuccess'))
  await navigateTo(localePath('/auth/login'))
}

useHead({
  title: t('auth.resetTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('auth.resetEyebrow') }}</span>
        <h1 class="section-title">{{ t('auth.resetTitle') }}</h1>
        <form @submit.prevent="submitResetPassword">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="form.email" type="email" />
          </label>
          <label class="field-label">
            {{ t('auth.verificationCode') }}
            <input v-model="form.code" type="text" />
          </label>
          <label class="field-label">
            {{ t('auth.newPassword') }}
            <input v-model="form.newPassword" type="password" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('auth.resetAction') }}
          </button>
        </form>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
