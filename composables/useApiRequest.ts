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
  const errorCode = ref('')
  const successMessage = ref('')

  async function run<T>(request: () => Promise<ApiSuccess<T>>) {
    isLoading.value = true
    errorMessage.value = ''
    errorCode.value = ''
    successMessage.value = ''

    try {
      const response = await request()
      return response.data
    } catch (error: unknown) {
      const apiError = error as { data?: ApiFailure; statusMessage?: string; message?: string }
      errorCode.value = apiError.data?.error?.code || ''
      errorMessage.value = apiError.data?.error?.message || apiError.statusMessage || apiError.message || '请求失败，请稍后重试'
      return null
    } finally {
      isLoading.value = false
    }
  }

  function setSuccess(message: string) {
    errorMessage.value = ''
    errorCode.value = ''
    successMessage.value = message
  }

  function setError(message: string, code = '') {
    errorMessage.value = message
    errorCode.value = code
    successMessage.value = ''
  }

  return {
    isLoading,
    errorMessage,
    errorCode,
    successMessage,
    run,
    setSuccess,
    setError
  }
}
