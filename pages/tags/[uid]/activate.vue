<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const form = reactive({
  uid: String(route.params.uid),
  activationCode: 'AC-003-777'
})
const responseText = ref('')

async function submitActivation() {
  const response = await $fetch('/api/tags/activate', {
    method: 'POST',
    body: form
  }).catch((error) => error.data || error)

  responseText.value = JSON.stringify(response, null, 2)
}

useHead({
  title: t('tag.activateTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('tag.activateEyebrow') }}</span>
        <h1 class="section-title">{{ t('tag.activateTitle') }}</h1>
        <form @submit.prevent="submitActivation">
          <label class="field-label">
            UID
            <input v-model="form.uid" type="text" />
          </label>
          <label class="field-label">
            {{ t('tag.activationCode') }}
            <input v-model="form.activationCode" type="text" />
          </label>
          <button class="solid-button" type="submit">{{ t('tag.activateAction') }}</button>
        </form>
        <p class="form-note">{{ t('tag.activateHint') }}</p>
        <pre v-if="responseText" class="response-box">{{ responseText }}</pre>
      </div>
    </section>
  </div>
</template>
