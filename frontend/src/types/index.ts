export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface ApiError {
  detail: string
  status_code: number
}