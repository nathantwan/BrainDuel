
export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'ready' | 'processed' | 'error'
}


export type FileUploadStatus = 
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'error';


export interface CreateFolderRequest {
  name: string
  description?: string
  course_code?: string 
  university_name?: string 
  is_public: boolean
}

export interface FolderResponse {
  id: string 
  owner_id: string 
  name: string
  description?: string
  course_code?: string 
  university_name?: string 
  question_count: number 
  is_public: boolean
  created_at: string 
  updated_at: string 
}
export interface PublicFoldersParams {
  university?: string;
  course?: string;
}

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

export interface QuestionOption {
  id: string;
  option_letter: string; // 'A', 'B', 'C', 'D'
  option_text: string;
  is_correct: boolean;
}

export interface QuestionResponse {
  id: string;
  class_folder_id: string;
  question_text: string;
  question_type: string; // e.g., 'multiple_choice', 'true_false', etc.
  difficulty_level: string; // 'easy', 'medium', 'hard'
  topic?: string;
  correct_answer: string;
  explanation?: string;
  points_value: number;
  created_at: string; // ISO date string
  options?: QuestionOption[]; // optional array of options
}
