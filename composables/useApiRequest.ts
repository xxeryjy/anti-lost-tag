interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiFailure {
  success: false
  error?: {
    code?: string
    message?: string
  }
}

export function useApiRequest() {
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  async function run<T>(request: () => Promise<ApiSuccess<T>>) {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await request()
      return response.data
    } catch (error: unknown) {
      const apiError = error as { data?: ApiFailure; statusMessage?: string; message?: string }
      errorMessage.value = apiError.data?.error?.message || apiError.statusMessage || apiError.message || '请求失败，请稍后重试'
      return null
    } finally {
      isLoading.value = false
    }
  }

  function setSuccess(message: string) {
    successMessage.value = message
  }

  return {
    isLoading,
    errorMessage,
    successMessage,
    run,
    setSuccess
  }
}
