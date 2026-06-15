<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const email = computed(() => typeof route.query.email === 'string' ? route.query.email : '')
const { data, pending, error, refresh } = await useAsyncData(
  () => `dev-mailbox:${email.value || 'all'}`,
  () => $fetch<{ messages: Array<{
    id: string
    to: string
    subject: string
    text: string
    createdAt: string
    actions: Array<{ label: string; url: string }>
  }> }>('/api/dev/mailbox', {
    query: email.value ? { email: email.value } : undefined
  }),
  {
    watch: [email]
  }
)

useHead({
  title: t('devMailbox.title')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('devMailbox.eyebrow') }}</span>
        <h1 class="section-title">{{ t('devMailbox.title') }}</h1>
        <p class="form-note">
          {{ email ? t('devMailbox.filteredHint', { email }) : t('devMailbox.allHint') }}
        </p>

        <div class="auth-action-row">
          <button class="ghost-button" type="button" @click="refresh">
            {{ t('devMailbox.refreshAction') }}
          </button>
          <NuxtLink class="ghost-button" :to="localePath('/auth/login')">
            {{ t('auth.loginAction') }}
          </NuxtLink>
        </div>

        <p v-if="pending" class="form-note">{{ t('common.loading') }}</p>
        <p v-else-if="error" class="alert-box alert-error">{{ t('devMailbox.loadFailed') }}</p>

        <div v-else class="mailbox-list">
          <article v-for="message in data?.messages || []" :key="message.id" class="mailbox-card">
            <p class="mailbox-meta">{{ message.to }} · {{ new Date(message.createdAt).toLocaleString() }}</p>
            <h2 class="mailbox-subject">{{ message.subject }}</h2>
            <pre class="mailbox-body">{{ message.text }}</pre>
            <div v-if="message.actions?.length" class="auth-action-row">
              <a
                v-for="action in message.actions"
                :key="`${message.id}-${action.url}`"
                class="ghost-button"
                :href="action.url"
              >
                {{ action.label }}
              </a>
            </div>
          </article>

          <p v-if="!(data?.messages || []).length" class="form-note">{{ t('devMailbox.empty') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
