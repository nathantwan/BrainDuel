// React hook for folders API (similar to auth patterns)
import { useState, useCallback } from 'react'
import { CreateFolderRequest, PublicFoldersParams } from '../types/file'
import { foldersService } from '../services/folders'
import { QuestionResponse } from '../types/file'

export const useQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuestionsByFolder = useCallback(async (folderId: string): Promise<QuestionResponse[]> => {
    try {
      setLoading(true);
      setError(null);
      // Replace with your actual API call
      const response = await fetch(`/api/folders/${folderId}/questions`);
      const data = await response.json();
      return data.questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Questions API error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { getQuestionsByFolder, loading, error };
};

export const useFolders = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await request()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Folders API error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createFolder = useCallback(
    (folderData: CreateFolderRequest) => 
      handleRequest(() => foldersService.createFolder(folderData)),
    [handleRequest]
  )

  const getPublicFolders = useCallback(
    (params?: PublicFoldersParams) => 
      handleRequest(() => foldersService.getPublicFolders(params)),
    [handleRequest]
  )

  const getMyFolders = useCallback(
    () => handleRequest(() => foldersService.getMyFolders()),
    [handleRequest]
  )

  const getFolderById = useCallback(
    (folderId: string) => 
      handleRequest(() => foldersService.getFolderById(folderId)),
    [handleRequest]
  )

  const updateFolder = useCallback(
    (folderId: string, folderData: Partial<CreateFolderRequest>) => 
      handleRequest(() => foldersService.updateFolder(folderId, folderData)),
    [handleRequest]
  )

  const deleteFolder = useCallback(
    (folderId: string) => 
      handleRequest(() => foldersService.deleteFolder(folderId)),
    [handleRequest]
  )

  const searchFolders = useCallback(
    (query: string, filters?: PublicFoldersParams) => 
      handleRequest(() => foldersService.searchFolders(query, filters)),
    [handleRequest]
  )

  return {
    loading,
    error,
    createFolder,
    getPublicFolders,
    getMyFolders,
    getFolderById,
    updateFolder,
    deleteFolder,
    searchFolders,
    clearError: () => setError(null),
  }
}