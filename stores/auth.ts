export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '',
    isAuthenticated: false,
    isEmailVerified: false,
    hasCheckedSession: false
  }),
  actions: {
    applyLogin(email: string, emailVerifiedAt?: string | null) {
      this.email = email
      this.isAuthenticated = true
      this.isEmailVerified = Boolean(emailVerifiedAt)
      this.hasCheckedSession = true
    },
    applyUser(user: { email: string; emailVerifiedAt: string | null }) {
      this.applyLogin(user.email, user.emailVerifiedAt)
    },
    applyVerification() {
      this.isEmailVerified = true
    },
    clearSession() {
      this.email = ''
      this.isAuthenticated = false
      this.isEmailVerified = false
      this.hasCheckedSession = true
    }
  }
})
