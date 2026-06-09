<script setup lang="ts">
const { t, locale } = useI18n()
const form = reactive({
  email: 'new-owner@smarttag.local',
  password: 'Password123',
  preferredLocale: locale.value as 'zh-CN' | 'en' | 'ja'
})
const verifyForm = reactive({
  email: 'new-owner@smarttag.local',
  code: '123456'
})
const responseText = ref('')

async function submitRegister() {
  const response = await $fetch('/api/auth/register', {
    method: 'POST',
    body: form
  }).catch((error) => error.data || error)

  responseText.value = JSON.stringify(response, null, 2)
}

async function confirmEmail() {
  const response = await $fetch('/api/auth/verify-email/confirm', {
    method: 'POST',
    body: verifyForm
  }).catch((error) => error.data || error)

  responseText.value = JSON.stringify(response, null, 2)
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
          <button class="solid-button" type="submit">{{ t('auth.registerAction') }}</button>
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
          <button class="solid-button" type="submit">{{ t('auth.verifyAction') }}</button>
        </form>
        <p class="form-note">{{ t('auth.mockCodeHint') }}</p>
        <pre v-if="responseText" class="response-box">{{ responseText }}</pre>
      </div>
    </section>
  </div>
</template>
