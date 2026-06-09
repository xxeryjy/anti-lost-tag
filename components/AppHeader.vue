<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const homePath = computed(() => localePath('/'))
const isHomePage = computed(() => route.path === homePath.value)
const homeLinks = computed(() => [
  {
    label: t('home.navManifesto'),
    href: '#manifesto'
  },
  {
    label: t('home.navMission'),
    href: '#mission'
  },
  {
    label: t('home.navValues'),
    href: '#values'
  },
  {
    label: t('home.navContact'),
    href: '#contact'
  }
])
</script>

<template>
  <header class="site-header" :class="{ 'site-header-home': isHomePage }">
    <NuxtLink :to="localePath('/')" class="brand-mark">
      <span class="brand-dot" />
      <span>{{ t('brand.name') }}</span>
    </NuxtLink>

    <nav v-if="isHomePage" class="section-nav">
      <a v-for="link in homeLinks" :key="link.href" class="nav-link nav-link-text" :href="link.href">
        {{ link.label }}
      </a>
    </nav>
    <nav v-else class="nav-links">
      <NuxtLink class="nav-link" :to="localePath('/')">{{ t('nav.home') }}</NuxtLink>
      <NuxtLink class="nav-link" :to="localePath('/dashboard/tags')">{{ t('nav.dashboard') }}</NuxtLink>
      <NuxtLink class="nav-link" :to="localePath('/auth/login')">{{ t('nav.login') }}</NuxtLink>
    </nav>

    <div class="header-actions">
      <template v-if="isHomePage">
        <NuxtLink class="ghost-button" :to="localePath('/auth/login')">{{ t('nav.login') }}</NuxtLink>
        <NuxtLink class="solid-button header-cta" :to="localePath('/auth/register')">
          {{ t('nav.register') }}
        </NuxtLink>
      </template>
      <LanguageSwitcher />
    </div>
  </header>
</template>
