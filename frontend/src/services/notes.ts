import { AxiosError } from 'axios'
import { 
  UploadResponse, 
  GenerateQuestionsResponse, 
  CleanupResponse, 
  UploadProgress,
  ValidationResult 
} from '../types/notes'
import { api} from './auth' // Import the configured axios instance

// Create axios instance for notes API


export const notesService = {
  // Upload notes to a class folder
  async uploadNotes(
    folderId: string, 
    files: File[], 
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('files', file)
      })

      const progressArray: UploadProgress[] = files.map(file => ({
        file,
        progress: 0,
        status: 'pending'
      }))

      const response = await api.post(`/notes/upload/${folderId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            
            progressArray.forEach(item => {
              item.progress = percentCompleted
              item.status = percentCompleted === 100 ? 'completed' : 'uploading'
            })
            
            onProgress([...progressArray])
          }
        }
      })

      // Mark all files as completed
      if (onProgress) {
        progressArray.forEach(item => {
          item.progress = 100
          item.status = 'completed'
        })
        onProgress([...progressArray])
      }

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      
      // Handle specific error cases
      if (axiosError.response?.status === 413) {
        throw new Error('File size too large. Please reduce file size and try again.')
      }
      
      if (axiosError.response?.status === 415) {
        throw new Error('Unsupported file type. Please upload PDF, TXT, DOC, DOCX, or MD files.')
      }
      
      if (axiosError.response?.status === 404) {
        throw new Error('Class folder not found. Please check the folder ID.')
      }

      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to upload notes'
      throw new Error(message)
    }
  },

  // Generate questions from uploaded notes in a class folder
  async generateQuestions(
    folderId: string,
    questionCount: number = 10,
    difficulty: string = "medium"
  ): Promise<GenerateQuestionsResponse> {
    try {
      const response = await api.post(`/notes/generate-questions/${folderId}`, null, {
        params: {
          question_count: questionCount,
          difficulty: difficulty
        }
      })

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      
      // Handle specific error cases
      if (axiosError.response?.status === 404) {
        throw new Error('Class folder not found or no notes available for question generation.')
      }
      
      if (axiosError.response?.status === 400) {
        throw new Error('Invalid parameters. Please check question count and difficulty level.')
      }

      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to generate questions'
      throw new Error(message)
    }
  },

  // Cleanup expired notes
  async cleanupExpiredNotes(): Promise<CleanupResponse> {
    try {
      const response = await api.delete('/notes/cleanup-expired')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to cleanup expired notes'
      throw new Error(message)
    }
  },

  // Helper method to validate files before upload
  validateFiles(files: File[]): ValidationResult {
    const errors: string[] = []
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown'
    ]
    const maxFileSize = 10 * 1024 * 1024 // 10MB

    if (files.length === 0) {
      errors.push('No files selected')
      return { isValid: false, errors }
    }

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1} (${file.name}): Unsupported file type`)
      }

      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1} (${file.name}): File too large (max 10MB)`)
      }

      if (file.size === 0) {
        errors.push(`File ${index + 1} (${file.name}): File is empty`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Helper method to validate question generation parameters
  validateQuestionParams(questionCount: number, difficulty: string): ValidationResult {
    const errors: string[] = []
    const allowedDifficulties = ['easy', 'medium', 'hard']

    if (questionCount < 1 || questionCount > 50) {
      errors.push('Question count must be between 1 and 50')
    }

    if (!allowedDifficulties.includes(difficulty.toLowerCase())) {
      errors.push('Difficulty must be one of: easy, medium, hard')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}