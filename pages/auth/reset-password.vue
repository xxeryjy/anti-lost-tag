<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { getAuthErrorMessage } = useAuthErrorMessage()
const hasPrefilledLink = computed(() => {
  return typeof route.query.email === 'string'
    && !!route.query.email
    && typeof route.query.code === 'string'
    && !!route.query.code
})
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: typeof route.query.code === 'string' ? route.query.code : '',
  newPassword: ''
})
const { isLoading, errorMessage, errorCode, successMessage, run, setSuccess, setError } = useApiRequest()

async function submitResetPassword() {
  if (!form.email || !form.code || !form.newPassword) {
    setError(t('auth.errorResetRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{ message: string }>(() => $fetch('/api/auth/reset-password', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  setSuccess(t('auth.resetSuccess'))
  await navigateTo(localePath('/auth/login'))
}

watch(
  () => [route.query.email, route.query.code],
  ([email, code]) => {
    if (typeof email === 'string') {
      form.email = email
    }
    if (typeof code === 'string') {
      form.code = code
    }
  },
  { immediate: true }
)

useHead({
  title: t('auth.resetTitle')
})

definePageMeta({
  layout: 'minimal'
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
            <input v-model="form.email" type="email" autocomplete="username" :readonly="hasPrefilledLink" />
          </label>
          <label class="field-label">
            {{ t('auth.verificationCode') }}
            <input v-model="form.code" type="text" autocomplete="one-time-code" :readonly="hasPrefilledLink" />
          </label>
          <label class="field-label">
            {{ t('auth.newPassword') }}
            <input v-model="form.newPassword" type="password" autocomplete="new-password" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('auth.resetAction') }}
          </button>
        </form>
        <p class="form-note">{{ t('auth.resetFlowHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
