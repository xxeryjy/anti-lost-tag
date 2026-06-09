<script setup lang="ts">
const { t } = useI18n()
const form = reactive({
  email: 'owner@smarttag.local'
})
const responseText = ref('')

async function submitForgotPassword() {
  const response = await $fetch('/api/auth/forgot-password', {
    method: 'POST',
    body: form
  }).catch((error) => error.data || error)

  responseText.value = JSON.stringify(response, null, 2)
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
          <button class="solid-button" type="submit">{{ t('auth.forgotAction') }}</button>
        </form>
        <p class="form-note">{{ t('auth.mockCodeHint') }}</p>
        <pre v-if="responseText" class="response-box">{{ responseText }}</pre>
      </div>
    </section>
  </div>
</template>
