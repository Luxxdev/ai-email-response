import { useState, useCallback } from 'react'
import { emailService } from '../services/emailService'
import type { EmailRequest, EmailResponse } from '../types/email'

interface UseEmailClassifierReturn {
  classifyEmail: (data: EmailRequest) => Promise<void>
  isLoading: boolean
  result: EmailResponse | null
  error: string | null
  reset: () => void
}

export const useEmailClassifier = (): UseEmailClassifierReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EmailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const classifyEmail = useCallback(async (data: EmailRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      const response = await emailService.classifyEmail(data)
      setResult(response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro na classificação:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    classifyEmail,
    isLoading,
    result,
    error,
    reset,
  }
}
