import { QuestionResponse, UploadProgress, UploadResponse } from './file';

// Re-export types for convenience
export type { UploadProgress, UploadResponse };

export interface GenerateQuestionsResponse {
  questions: QuestionResponse[]
  folder_id: string
  question_count: number
  difficulty: string
  generated_at: string
}

export interface CleanupResponse {
  message: string
  deleted_count: number
  deleted_notes: string[]
}

// Validation types
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Hook options
export interface UseNotesUploadOptions {
  onSuccess?: (result: UploadResponse) => void
  onError?: (error: Error) => void
}

export interface UseQuestionGenerationOptions {
  onSuccess?: (result: GenerateQuestionsResponse) => void
  onError?: (error: Error) => void
}

export interface UseNotesCleanupOptions {
  onSuccess?: (result: CleanupResponse) => void
  onError?: (error: Error) => void
}