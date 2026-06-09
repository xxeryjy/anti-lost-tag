<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const form = reactive({
  uid: String(route.params.uid),
  activationCode: 'AC-003-777'
})
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

async function submitActivation() {
  const data = await run<{ tag: { uid: string } }>(() => $fetch('/api/tags/activate', {
    method: 'POST',
    body: form
  }))

  if (!data) {
    return
  }

  setSuccess(t('tag.activateSuccess'))
  await navigateTo(localePath(`/tags/${data.tag.uid}/edit`))
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
            <input v-model="form.uid" type="text" readonly />
          </label>
          <label class="field-label">
            {{ t('tag.activationCode') }}
            <input v-model="form.activationCode" type="text" />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('tag.activateAction') }}
          </button>
        </form>
        <p class="form-note">{{ t('tag.activateHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
