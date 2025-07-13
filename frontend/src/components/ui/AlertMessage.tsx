import { AlertCircle } from 'lucide-react'
import type { AlertMessageProps } from '../../types/ui'

export function AlertMessage({ type, message }: AlertMessageProps) {
  if (!message) return null

  const isError = type === 'error'
  
  return (
    <div className={`mb-4 p-3 ${isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'} rounded-lg ${isError ? 'flex items-center space-x-2' : ''}`}>
      {isError && <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
      <span className={`text-sm ${isError ? 'text-red-700' : 'text-green-700'}`}>
        {message}
      </span>
    </div>
  )
} 