const protectedPathPrefixes = ['/dashboard', '/tags']
const localePrefixes = ['zh-CN', 'en', 'ja']

function stripLocalePrefix(path: string) {
  const segments = path.split('/')
  if (segments[1] && localePrefixes.includes(segments[1])) {
    return `/${segments.slice(2).join('/')}` || '/'
  }
  return path
}

function getRedirectPath(fullPath: string) {
  const [path = '/', query = ''] = fullPath.split('?')
  const normalizedPath = stripLocalePrefix(path)
  return query ? `${normalizedPath}?${query}` : normalizedPath
}

export default defineNuxtRouteMiddleware(async (to) => {
  const normalizedPath = stripLocalePrefix(to.path)
  const isProtected = protectedPathPrefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  )

  if (!isProtected) {
    return
  }

  const authStore = useAuthStore()
  if (authStore.hasCheckedSession && authStore.isAuthenticated) {
    return
  }

  try {
    const requestFetch = useRequestFetch()
    const response = await requestFetch<{
      success: true
      data: {
        user: {
          email: string
          emailVerifiedAt: string | null
        }
      }
    }>('/api/auth/me')
    authStore.applyUser(response.data.user)
  } catch {
    authStore.clearSession()
    const localePath = useLocalePath()
    return navigateTo(localePath(`/auth/login?redirect=${encodeURIComponent(getRedirectPath(to.fullPath))}`))
  }
})
