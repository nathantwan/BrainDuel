'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFolders } from '../../hooks/use-folders'
import { FolderResponse } from '../../types/file'

const MyFoldersPage: React.FC = () => {
  const router = useRouter()
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const { loading, error, getMyFolders } = useFolders()

  useEffect(() => {
    const fetchFolders = async () => {
      const result = await getMyFolders()
      if (result) {
        setFolders(result)
      }
    }

    fetchFolders()
  }, [getMyFolders])

  const handleFolderClick = (folderId: string) => {
    router.push(`/folders/${folderId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-dark-text-secondary">Loading your folders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-text">My Folders</h1>
          <p className="mt-2 text-dark-text-secondary">
            Click on any folder to view and practice with your study questions
          </p>
        </div>

        {folders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H7a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-dark-text mb-2">No folders yet</h3>
            <p className="text-dark-text-secondary">Create your first folder to start organizing your study materials</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className="bg-dark-surface rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-dark-border hover:border-blue-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 text-blue-600 mr-3">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H7a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-dark-text truncate">
                          {folder.name}
                        </h3>
                      </div>
                      
                      {folder.description && (
                        <p className="text-dark-text-secondary text-sm mb-3 line-clamp-2">
                          {folder.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-dark-text-secondary">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{folder.university_name}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-dark-text-secondary">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>{folder.course_code}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            folder.is_public 
                              ? 'bg-green-900 text-green-200' 
                              : 'bg-gray-700 text-gray-200'
                          }`}>
                            {folder.is_public ? 'Public' : 'Private'}
                          </span>
                          
                          <span className="text-xs text-dark-text-secondary">
                            {new Date(folder.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyFoldersPage