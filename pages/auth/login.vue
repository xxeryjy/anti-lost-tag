<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const authStore = useAuthStore()
const { getAuthErrorMessage } = useAuthErrorMessage()
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '1157389582@qq.com',
  password: '123456'
})
const { isLoading, errorMessage, errorCode, successMessage, run, setSuccess, setError } = useApiRequest()

function getRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/dashboard/tags'
}

async function submitLogin() {
  if (!form.email || !form.password) {
    setError(t('auth.errorRequired'), 'BAD_REQUEST')
    return
  }

  const data = await run<{ user: { email: string; emailVerifiedAt: string | null } }>(() => $fetch('/api/auth/login', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    setError(getAuthErrorMessage(errorCode.value), errorCode.value)
    return
  }

  setSuccess(t('auth.loginSuccess'))
  authStore.applyUser(data.user)
  await navigateTo(localePath(getRedirectPath()))
}

useHead({
  title: t('auth.loginTitle')
})

definePageMeta({
  layout: 'minimal'
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('auth.loginEyebrow') }}</span>
        <h1 class="section-title">{{ t('auth.loginTitle') }}</h1>
        <form @submit.prevent="submitLogin">
          <label class="field-label">
            {{ t('auth.email') }}
            <input v-model="form.email" type="email" autocomplete="username" />
          </label>
          <label class="field-label">
            {{ t('auth.password') }}
            <input v-model="form.password" type="password" autocomplete="current-password" />
          </label>
          <div class="stack-actions">
            <button class="solid-button" type="submit" :disabled="isLoading">
              {{ isLoading ? t('common.submitting') : t('auth.loginAction') }}
            </button>
            <NuxtLink class="ghost-button" :to="localePath('/auth/forgot-password')">{{ t('auth.forgotPassword') }}</NuxtLink>
            <NuxtLink class="ghost-button" :to="localePath('/auth/register')">{{ t('nav.register') }}</NuxtLink>
          </div>
        </form>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
