'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { foldersService } from '../../../services/folders'
import { FolderResponse, QuestionResponse } from '../../../types/file'

const FolderQuestionsPage: React.FC = () => {
  const router = useRouter()
  const params = useParams()
  const folderId = params.folderId as string

  const [folder, setFolder] = useState<FolderResponse | null>(null)
  const [questions, setQuestions] = useState<QuestionResponse[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch folder details
        const folderResponse = await foldersService.getFolderById(folderId)
        setFolder(folderResponse)

        // Fetch existing questions for this folder
        try {
          const questionsResponse = await foldersService.getQuestionsByFolderId(folderId)
          setQuestions(questionsResponse || [])
        } catch (questionsError) {
          console.error('Error fetching questions:', questionsError)
          // If questions fetching fails, continue with empty questions array
          setQuestions([])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load folder data'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (folderId) {
      fetchData()
    }
  }, [folderId])

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Folders
          </button>
          
          {folder && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{folder.name}</h1>
              {folder.description && (
                <p className="text-gray-600 mb-4">{folder.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {folder.university_name}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {folder.course_code}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  folder.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {folder.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Study Questions {questions.length > 0 && `(${questions.length})`}
          </h2>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions available</h3>
            <p className="text-gray-500">There are currently no questions for this folder</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div
                  onClick={() => toggleQuestion(question.id)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded mr-3">
                          Q{index + 1}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getDifficultyColor(question.difficulty_level)}`}>
                          {question.difficulty_level}
                        </span>
                        {question.topic && (
                          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded ml-2">
                            {question.topic}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {question.question_text}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="capitalize">{question.question_type.replace('_', ' ')}</span>
                        <span className="mx-2">•</span>
                        <span>{question.points_value} points</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          expandedQuestions.has(question.id) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedQuestions.has(question.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    {/* Multiple Choice Options */}
                    {question.options && question.options.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Options:</h4>
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`p-3 rounded border ${
                                option.is_correct
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-start">
                                <span className="font-medium mr-2">{option.option_letter}.</span>
                                <span className="flex-1">{option.option_text}</span>
                                {option.is_correct && (
                                  <svg className="w-4 h-4 text-green-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Correct Answer (for non-multiple choice questions) */}
                    {(!question.options || question.options.length === 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Correct Answer:</h4>
                        <p className="text-gray-900 leading-relaxed bg-green-50 border border-green-200 p-3 rounded">
                          {question.correct_answer}
                        </p>
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Explanation:</h4>
                        <p className="text-gray-700 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FolderQuestionsPage