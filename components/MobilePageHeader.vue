<script setup lang="ts">
const props = withDefaults(defineProps<{
  backTo: string
  backLabel: string
  eyebrow?: string
  title: string
}>(), {
  eyebrow: ''
})
</script>

<template>
  <div class="mobile-page-header">
    <div class="mobile-page-header-bar">
      <NuxtLink class="mobile-page-header-back" :to="backTo">
        <span class="mobile-page-header-arrow" aria-hidden="true">&larr;</span>
        <span class="mobile-page-header-sr-only">{{ backLabel }}</span>
      </NuxtLink>
      <p class="mobile-page-header-title">{{ title }}</p>
      <span class="mobile-page-header-placeholder" aria-hidden="true" />
    </div>

    <p v-if="eyebrow" class="mobile-page-header-eyebrow">{{ eyebrow }}</p>
  </div>
</template>

<style scoped>
.mobile-page-header {
  position: sticky;
  top: 8px;
  z-index: 30;
  margin-bottom: 16px;
}

.mobile-page-header-bar {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  min-height: 48px;
  padding: 0 2px;
  background: rgba(247, 246, 241, 0.92);
  border-bottom: 1px solid rgba(36, 51, 47, 0.12);
  backdrop-filter: blur(10px);
}

.mobile-page-header-back {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  width: 32px;
  justify-content: center;
  color: var(--text);
  text-decoration: none;
}

.mobile-page-header-arrow {
  font-size: 16px;
  line-height: 1;
}

.mobile-page-header-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  color: var(--text);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.mobile-page-header-placeholder {
  justify-self: end;
  width: 32px;
  height: 1px;
}

.mobile-page-header-eyebrow {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mobile-page-header-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.mobile-page-header-back:hover {
  color: var(--brand-deep);
}

@media (max-width: 960px) {
  .mobile-page-header {
    top: 6px;
    margin-bottom: 12px;
  }

  .mobile-page-header-bar {
    min-height: 44px;
  }

  .mobile-page-header-title {
    font-size: 16px;
  }
}
</style>
