import type { ApiError, EmailRequest, EmailResponse } from '../types/email'

// const API_BASE_URL = 'http://localhost:8000'
const API_BASE_URL = 'https://ai-email-response.onrender.com/'

class EmailService {
  private async fetchWithErrorHandling<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          detail: `HTTP Error: ${response.status}`,
        }))
        throw new Error(errorData.detail)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Erro desconhecido na comunicação com a API')
    }
  }

  async classifyEmail(emailData: EmailRequest): Promise<EmailResponse> {
    return this.fetchWithErrorHandling<EmailResponse>('/classify', {
      method: 'POST',
      body: JSON.stringify(emailData),
    })
  }
}

export const emailService = new EmailService()
