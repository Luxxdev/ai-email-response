// export interface EmailClassification {
//   category: 'Produtivo' | 'Improdutivo'
//   confidence: number
//   suggestedResponse: string
//   originalText: string
// }

export interface EmailRequest {
  content: string
  subject?: string
  sender?: string
}

export interface EmailResponse {
  category: 'produtivo' | 'improdutivo'
  confidence: number
  suggested_response: string
  analysis: {
    reasoning: string
    keywords: string[]
    content_length: number
    has_subject: boolean
    sender: string
  }
  processing_time: number
}

export interface ApiError {
  detail: string
}
