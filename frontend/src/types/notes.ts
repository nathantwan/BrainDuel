import { QuestionResponse } from './file';
// Base types for file uploads
export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

// API Response types
export interface UploadResponse {
  message: string
  folder_id: string
  uploaded_files: {
    filename: string
    size: number
    status: string
  }[]
  temp_note_ids: string[]
}



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