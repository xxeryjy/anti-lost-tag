<script setup lang="ts">
const { t } = useI18n()
const form = reactive({
  email: 'owner@smarttag.local',
  code: '123456',
  newPassword: 'Password456'
})
const responseText = ref('')

async function submitResetPassword() {
  const response = await $fetch('/api/auth/reset-password', {
    method: 'POST',
    body: form
  }).catch((error) => error.data || error)

  responseText.value = JSON.stringify(response, null, 2)
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
          <button class="solid-button" type="submit">{{ t('auth.resetAction') }}</button>
        </form>
        <pre v-if="responseText" class="response-box">{{ responseText }}</pre>
      </div>
    </section>
  </div>
</template>
