import { AxiosError } from 'axios'
import { api } from './auth' // Import the configured axios instance

import { CreateFolderRequest, FolderResponse, PublicFoldersParams, QuestionResponse } from '../types/file'

// Folders service functions
export const foldersService = {
  // Create a new class folder
  async createFolder(folderData: CreateFolderRequest): Promise<FolderResponse> {
    try {
      const response = await api.post('/folders/', folderData)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to create folder'
      throw new Error(message)
    }
  },

  // Get public class folders with optional filters
  async getPublicFolders(params?: PublicFoldersParams): Promise<FolderResponse[]> {
    try {
      const response = await api.get('/folders/public', {
        params: {
          ...(params?.university && { university: params.university }),
          ...(params?.course && { course: params.course }),
        }
      })
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get public folders'
      throw new Error(message)
    }
  },

  // Get current user's folders
  async getMyFolders(): Promise<FolderResponse[]> {
    try {
      const response = await api.get('/folders/my')
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get your folders'
      throw new Error(message)
    }
  },

  // Get a specific folder by ID
  async getFolderById(folderId: string): Promise<FolderResponse> {
    try {
      const response = await api.get(`/folders/${folderId}`)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      
      if (axiosError.response?.status === 404) {
        throw new Error('Folder not found')
      }
      if (axiosError.response?.status === 403) {
        throw new Error('Access denied - you do not have permission to view this folder')
      }
      if (axiosError.response?.status === 400) {
        throw new Error('Invalid folder ID format')
      }
      
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get folder'
      throw new Error(message)
    }
  },
  async getQuestionsByFolderId(folderId: string): Promise<QuestionResponse[]> {
    try {
      const response = await api.get<QuestionResponse[]>(`/folders/${folderId}/questions`)

      return response.data  
    } catch (error){
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      
      if (axiosError.response?.status === 404) {
        throw new Error('Folder not found or no questions available')
      }
      if (axiosError.response?.status === 403) {
        throw new Error('Access denied - you do not have permission to view questions in this folder')
      }
      
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get questions for folder'
      throw new Error(message)
    }
  },

  // Update a folder (if you need this endpoint later)
  async updateFolder(folderId: string, folderData: Partial<CreateFolderRequest>): Promise<FolderResponse> {
    try {
      const response = await api.put(`/folders/${folderId}`, folderData)
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      
      if (axiosError.response?.status === 404) {
        throw new Error('Folder not found')
      }
      if (axiosError.response?.status === 403) {
        throw new Error('Access denied - you can only update your own folders')
      }
      
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to update folder'
      throw new Error(message)
    }
  },

  // Delete a folder (if you need this endpoint later)
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await api.delete(`/folders/${folderId}`)
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      
      if (axiosError.response?.status === 404) {
        throw new Error('Folder not found')
      }
      if (axiosError.response?.status === 403) {
        throw new Error('Access denied - you can only delete your own folders')
      }
      
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to delete folder'
      throw new Error(message)
    }
  },

  // Get folders by university (helper function)
  async getFoldersByUniversity(university: string): Promise<FolderResponse[]> {
    return this.getPublicFolders({ university })
  },

  // Get folders by course (helper function)
  async getFoldersByCourse(course: string): Promise<FolderResponse[]> {
    return this.getPublicFolders({ course })
  },

  // Search folders (if you implement search later)
  async searchFolders(query: string, filters?: PublicFoldersParams): Promise<FolderResponse[]> {
    try {
      const response = await api.get('/folders/search', {
        params: {
          q: query,
          ...(filters?.university && { university: filters.university }),
          ...(filters?.course && { course: filters.course }),
        }
      })
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to search folders'
      throw new Error(message)
    }
  }
}

