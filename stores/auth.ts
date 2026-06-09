export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '',
    isAuthenticated: false,
    isEmailVerified: false
  }),
  actions: {
    applyLogin(email: string) {
      this.email = email
      this.isAuthenticated = true
    },
    applyVerification() {
      this.isEmailVerified = true
    },
    clearSession() {
      this.email = ''
      this.isAuthenticated = false
      this.isEmailVerified = false
    }
  }
})
