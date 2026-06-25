<script setup lang=ts>
const props = withDefaults(defineProps<{
  backTo: string
  backLabel: string
  eyebrow?: string
  title: string
}>(), {
  eyebrow: ''
})

async function handleBack() {
  await navigateTo(props.backTo)
}
</script>

<template>
  <div class=mobile-page-header>
    <van-nav-bar
      fixed
      placeholder
      safe-area-inset-top
      left-arrow
      :title=title
      @click-left=handleBack
    >
      <template #left>
        <span class=mobile-page-header-left :aria-label=backLabel>
          <van-icon class=mobile-page-header-left-icon name=arrow-left size=18 aria-hidden=true />
          <span class=mobile-page-header-left-text>{{ backLabel }}</span>
        </span>
      </template>
    </van-nav-bar>

    <p v-if=eyebrow class=mobile-page-header-eyebrow>{{ eyebrow }}</p>
  </div>
</template>

<style scoped>
.mobile-page-header {
  position: sticky;
  top: 0;
  z-index: 30;
  margin-bottom: 16px;
}

.mobile-page-header :deep(.van-nav-bar) {
  overflow: hidden;
  background: rgba(255, 252, 246, 0.94);
  border: 1px solid rgba(49, 95, 87, 0.08);
  border-radius: 20px;
  box-shadow: 0 14px 28px rgba(49, 95, 87, 0.07);
  backdrop-filter: blur(16px);
}

.mobile-page-header :deep(.van-nav-bar::after) {
  border-color: rgba(36, 51, 47, 0.08);
}

.mobile-page-header :deep(.van-nav-bar__content) {
  padding: 0 8px;
}

.mobile-page-header :deep(.van-nav-bar__title) {
  max-width: calc(100% - 132px);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.01em;
}

.mobile-page-header :deep(.van-nav-bar__left) {
  min-width: 48px;
  padding: 0 12px;
}

.mobile-page-header-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  color: var(--brand-deep);
}

.mobile-page-header-left-icon {
  color: var(--accent);
}

.mobile-page-header-left-text {
  max-width: 104px;
  overflow: hidden;
  color: rgba(49, 95, 87, 0.86);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
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

@media (max-width: 960px) {
  .mobile-page-header {
    margin-bottom: 12px;
  }

  .mobile-page-header :deep(.van-nav-bar) {
    border-radius: 18px;
  }

  .mobile-page-header-left-text {
    max-width: 76px;
  }
}

@media (max-width: 640px) {
  .mobile-page-header :deep(.van-nav-bar__content) {
    padding: 0 2px;
  }

  .mobile-page-header-left-text {
    display: none;
  }
}
</style>
