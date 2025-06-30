import { useState, useCallback } from 'react'
import { notesService } from '../services/notes'
import {
  GenerateQuestionsResponse,
  CleanupResponse,
  UploadProgress,
  UseNotesUploadOptions,
  UseQuestionGenerationOptions,
  UseNotesCleanupOptions
} from '../types/notes'

// Hook for notes upload
export const useNotesUpload = (options: UseNotesUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress[]>([])
  const [error, setError] = useState<string | null>(null)

  const uploadNotes = useCallback(async (folderId: string, files: File[]) => {
    if (!folderId.trim()) {
      const errorMsg = 'Folder ID is required'
      setError(errorMsg)
      options.onError?.(new Error(errorMsg))
      return
    }

    // Validate files before upload
    const validation = notesService.validateFiles(files)
    if (!validation.isValid) {
      const errorMsg = validation.errors.join('; ')
      setError(errorMsg)
      options.onError?.(new Error(errorMsg))
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress([])

    try {
      const result = await notesService.uploadNotes(folderId.trim(), files, setProgress)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      
      // Update progress to show error state
      setProgress(prev => prev.map(item => ({
        ...item,
        status: 'error',
        error: errorMessage
      })))
      
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [options])

  const resetState = useCallback(() => {
    setIsUploading(false)
    setProgress([])
    setError(null)
  }, [])

  return {
    uploadNotes,
    isUploading,
    progress,
    error,
    resetState
  }
}

// Hook for question generation
export const useQuestionGeneration = (options: UseQuestionGenerationOptions = {}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGeneration, setLastGeneration] = useState<GenerateQuestionsResponse | null>(null)

  const generateQuestions = useCallback(async (
    folderId: string, 
    questionCount: number = 10, 
    difficulty: string = "medium"
  ) => {
    if (!folderId.trim()) {
      const errorMsg = 'Folder ID is required'
      setError(errorMsg)
      options.onError?.(new Error(errorMsg))
      return
    }

    // Validate parameters
    const validation = notesService.validateQuestionParams(questionCount, difficulty)
    if (!validation.isValid) {
      const errorMsg = validation.errors.join('; ')
      setError(errorMsg)
      options.onError?.(new Error(errorMsg))
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await notesService.generateQuestions(folderId.trim(), questionCount, difficulty)
      setLastGeneration(result)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Question generation failed'
      setError(errorMessage)
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [options])

  const resetState = useCallback(() => {
    setIsGenerating(false)
    setError(null)
    setLastGeneration(null)
  }, [])

  return {
    generateQuestions,
    isGenerating,
    error,
    lastGeneration,
    resetState
  }
}

// Hook for notes cleanup
export const useNotesCleanup = (options: UseNotesCleanupOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCleanup, setLastCleanup] = useState<CleanupResponse | null>(null)

  const cleanupExpiredNotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await notesService.cleanupExpiredNotes()
      setLastCleanup(result)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cleanup failed'
      setError(errorMessage)
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const resetState = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setLastCleanup(null)
  }, [])

  return {
    cleanupExpiredNotes,
    isLoading,
    error,
    lastCleanup,
    resetState
  }
}