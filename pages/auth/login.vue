<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const form = reactive({
  email: 'owner@smarttag.local',
  password: 'Password123'
})
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

async function submitLogin() {
  const data = await run<{ user: { email: string } }>(() => $fetch('/api/auth/login', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    return
  }

  setSuccess(t('auth.loginSuccess'))
  const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard/tags'
  await navigateTo(localePath(redirectTo))
}

useHead({
  title: t('auth.loginTitle')
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
            <input v-model="form.email" type="email" />
          </label>
          <label class="field-label">
            {{ t('auth.password') }}
            <input v-model="form.password" type="password" />
          </label>
          <div class="stack-actions">
            <button class="solid-button" type="submit" :disabled="isLoading">
              {{ isLoading ? t('common.submitting') : t('auth.loginAction') }}
            </button>
            <NuxtLink class="ghost-button" :to="localePath('/auth/forgot-password')">{{ t('auth.forgotPassword') }}</NuxtLink>
          </div>
        </form>
        <p class="form-note">{{ t('auth.mockAccountHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
