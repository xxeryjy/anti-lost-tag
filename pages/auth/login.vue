<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const form = reactive({
  email: 'owner@smarttag.local',
  password: 'Password123'
})
const responseText = ref('')

async function submitLogin() {
  const response = await $fetch('/api/auth/login', {
    method: 'POST',
    body: form
  }).catch((error) => error.data || error)

  responseText.value = JSON.stringify(response, null, 2)
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
            <button class="solid-button" type="submit">{{ t('auth.loginAction') }}</button>
            <NuxtLink class="ghost-button" :to="localePath('/auth/forgot-password')">{{ t('auth.forgotPassword') }}</NuxtLink>
          </div>
        </form>
        <p class="form-note">{{ t('auth.mockAccountHint') }}</p>
        <pre v-if="responseText" class="response-box">{{ responseText }}</pre>
      </div>
    </section>
  </div>
</template>
