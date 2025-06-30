'use client'
import { useState, useCallback, ChangeEvent, DragEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Gamepad2,
  Zap,
  Folder,
  Save,
  XCircle,
  Loader2
} from 'lucide-react'
import { foldersService } from '../../services/folders'
import { useNotesUpload, useQuestionGeneration } from '../../hooks/use-notes'
import { 
  FolderResponse, 
  CreateFolderRequest,
  UploadFile
} from '../../types/file'

export default function UploadNotesPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState('')
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState(10)
  
  // Folder creation state
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolder, setNewFolder] = useState<Omit<CreateFolderRequest, 'is_public'> & { is_public: boolean }>({
    name: '',
    description: '',
    university_name: '',
    course_code: '',
    is_public: false
  })
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Initialize question generation hook
  const {
    generateQuestions,
    isGenerating: isGeneratingQuestions,
    error: generationError,
    resetState: resetGeneration
  } = useQuestionGeneration({
    onSuccess: (result) => {
      console.log('Questions generated:', result)
      router.push(`/dashboard`)
    },
    onError: (error) => {
      console.error('Generation failed:', error)
    }
  })

  // Initialize upload hook
  const { 
    uploadNotes, 
    isUploading, 
    progress, 
    error: uploadError,
    resetState: resetUploadState
  } = useNotesUpload({
    onSuccess: async (result) => {
      console.log('Files uploaded successfully!')
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'processed'
      })))
      
      // Automatically generate questions after successful upload
      try {
        console.log('Starting question generation...')
        await generateQuestions(selectedFolder.trim(), questionCount, difficulty)
      } catch (error) {
        console.error('Question generation failed:', error)
        // Still redirect even if question generation fails
        router.push(`/questions/review?folder=${selectedFolder}`)
      }
    },
    onError: (error) => {
      console.log(error.message)
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'error'
      })))
    }
  })

  // Calculate overall progress
  const processingProgress = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
    : 0

  // Fetch folders on mount
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await foldersService.getMyFolders()
        setFolders(response || [])
      } catch (error) {
        console.error('Folder fetch error:', error)
      }
    }
    fetchFolders()
  }, [])

  // Handle file operations
  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles: UploadFile[] = []
    const invalidReasons: string[] = []

    newFiles.forEach(file => {
      if (file.size === 0) {
        invalidReasons.push(`${file.name}: File is empty`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        invalidReasons.push(`${file.name}: Exceeds 10MB limit`)
        return
      }
      validFiles.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready'
      })
    })

    if (invalidReasons.length > 0) {
      console.log(`Some files were invalid: ${invalidReasons.join(', ')}`)
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }, [])

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
    resetUploadState()
  }

  // Folder management
  const handleFolderSelection = (value: string) => {
    if (value === 'CREATE_NEW') {
      setShowCreateFolder(true)
      setSelectedFolder('')
    } else {
      setSelectedFolder(value)
      setShowCreateFolder(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      console.log('Folder name is required')
      return
    }

    setIsCreatingFolder(true)
    try {
      const folderData: CreateFolderRequest = {
        ...newFolder,
        is_public: newFolder.is_public
      }
      const createdFolder = await foldersService.createFolder(folderData)
      setFolders(prev => [...prev, createdFolder])
      setSelectedFolder(createdFolder.id)
      setShowCreateFolder(false)
      setNewFolder({
        name: '',
        description: '',
        university_name: '',
        course_code: '',
        is_public: false
      })
      console.log('Folder created successfully!')
    } catch (error) {
      console.log(error instanceof Error ? error.message : 'Failed to create folder')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleProcessFiles = async () => {
    if (!selectedFolder || files.length === 0) return

    try {
      await uploadNotes(selectedFolder.trim(), files.map(f => f.file))
    } catch (error) {
      console.error('Processing error:', error)
    }
  }

  // Helper functions
  const getFileIcon = (type: string) => {
    const icons = {
      'application/pdf': <FileText className="h-5 w-5 text-red-500" />,
      'image/': <Image className="h-5 w-5 text-blue-500" />,
      'text/': <FileText className="h-5 w-5 text-green-500" />,
      'application/msword': <FileText className="h-5 w-5 text-blue-600" />,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 
        <FileText className="h-5 w-5 text-blue-600" />
    }
    return icons[type] || <FileText className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canProcess = files.length > 0 && selectedFolder && !isUploading && !isGeneratingQuestions

  // Dynamic CSS classes
  const dropZoneClasses = `border-2 border-dashed rounded-xl p-8 text-center transition-all ${
    dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
  }`

  const processButtonClasses = `w-full py-3 px-4 rounded-xl font-bold text-white transition-all ${
    canProcess
      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      : "bg-gray-400 cursor-not-allowed"
  }`

  // Combined progress for upload and question generation
  const totalProgress = isGeneratingQuestions ? 
    (processingProgress > 0 ? Math.min(processingProgress + 25, 95) : 75) : 
    processingProgress

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">BrainDuel</h1>
                  <p className="text-sm text-gray-600">Upload Notes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Transform Your Notes into Questions ✨
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your study materials and let our AI create personalized exam questions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                Upload Your Notes
              </h3>

              <div
                className={dropZoneClasses}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 p-4 rounded-full mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {dragActive ? 'Drop your files here' : 'Drag and drop files'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Or click to browse your computer
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.md"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer"
                  >
                    Choose Files
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported: PDF, Word, Text, Markdown, Images (Max 10MB each)
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Selected Files ({files.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {getFileIcon(file.type)}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.status === 'processed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          {isUploading && file.status === 'ready' && (
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            disabled={isUploading}
                            className="p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {(uploadError || generationError) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Error</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {uploadError || generationError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-6">
            {/* Folder Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Folder className="h-5 w-5 mr-2 text-purple-600" />
                Select Folder
              </h3>
              
              {!showCreateFolder ? (
                <div className="space-y-3">
                  <select
                    value={selectedFolder}
                    onChange={(e) => handleFolderSelection(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a folder...</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                    <option value="CREATE_NEW" className="font-medium text-blue-600">
                      + Create New Folder
                    </option>
                  </select>
                  
                  {selectedFolder && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 truncate">
                        Selected: {folders.find(f => f.id === selectedFolder)?.name}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Create New Folder</h4>
                    <button
                      onClick={() => setShowCreateFolder(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Folder Name *
                      </label>
                      <input
                        type="text"
                        value={newFolder.name}
                        onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                        placeholder="Enter folder name"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newFolder.description}
                        onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                        placeholder="Optional description"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        University
                      </label>
                      <input
                        type="text"
                        value={newFolder.university_name}
                        onChange={(e) => setNewFolder({...newFolder, university_name: e.target.value})}
                        placeholder="e.g., MIT, Stanford"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course
                      </label>
                      <input
                        type="text"
                        value={newFolder.course_code}
                        onChange={(e) => setNewFolder({...newFolder, course_code: e.target.value})}
                        placeholder="e.g., CS101, Biology"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={newFolder.is_public}
                        onChange={(e) => setNewFolder({...newFolder, is_public: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        Make folder public
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleCreateFolder}
                      disabled={isCreatingFolder || !newFolder.name.trim()}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg font-medium transition-colors ${
                        isCreatingFolder || !newFolder.name.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isCreatingFolder ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Create Folder
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Question Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                Question Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions: {questionCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcessFiles}
              disabled={!canProcess}
              className={processButtonClasses}
            >
              {isUploading || isGeneratingQuestions ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? `Uploading ${processingProgress}%` : 
                   isGeneratingQuestions ? 'Generating Questions...' : 
                   'Processing...'}
                </span>
              ) : (
                'Upload & Generate Questions'
              )}
            </button>

            {(isUploading || isGeneratingQuestions) && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}