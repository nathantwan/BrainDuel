import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { LoginRequest, SignupRequest, AuthResponse } from '../types/auth'

// Type for queued requests during token refresh
interface QueuedRequest {
  resolve: (value?: string) => void
  reject: (error?: Error) => void
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: QueuedRequest[] = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token || undefined)
    }
  })
  
  failedQueue = [] 
}

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await authService.refreshToken()
        processQueue(null, newToken)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        authService.clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Helper function to decode JWT token (without verification)
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.log(error)
    return null
  }
}

// Auth service functions
export const authService = {
  // Login user - 
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          email: credentials.email,
          password: credentials.password,
        }
      )

      const tokenData = response.data // { access_token, token_type }
      
      // Get user data after successful login
      const userResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        }
      )

      const authData: AuthResponse = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        user: userResponse.data
      }
      
      // Store token and user data
      localStorage.setItem('access_token', authData.access_token)
      localStorage.setItem('user', JSON.stringify(authData.user))
      
      return authData
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Login failed'
      throw new Error(message)
    }
  },

  // Register new user - then login automatically
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      // First, create the user
      await api.post('/auth/signup', userData)

      // Then login with the same credentials
      const loginData = await this.login({
        email: userData.email,
        password: userData.password
      })

      return loginData
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      if (axiosError.response?.status === 409) {
        throw new Error('User already exists with this email')
      }
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Registration failed'
      throw new Error(message)
    }
  },

  // Logout user - now with backend endpoint
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (logoutError) {
      console.error('Logout error:', logoutError)
    } finally {
      this.clearAuth()
      // Redirect to login page
      window.location.href = '/login'
    }
  },

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },

  // Get current user profile
  async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      const response = await api.get('/auth/me')
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Failed to get user data'
      throw new Error(message)
    }
  },

  // Refresh token - now implemented
  async refreshToken(): Promise<string> {
    try {
      const response = await api.post('/auth/refresh')
      const newToken = response.data.access_token
      localStorage.setItem('access_token', newToken)
      return newToken
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>
      const message = axiosError.response?.data?.detail || 
                    axiosError.response?.data?.message || 
                    'Token refresh failed'
      throw new Error(message)
    }
  },

  // Check if user is authenticated with token validation
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token')
    if (!token) return false

    // Check if token is expired
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return false

    // Check if token expires in the next 5 minutes
    const currentTime = Date.now() / 1000
    const expirationTime = decoded.exp
    const bufferTime = 5 * 60 // 5 minutes

    return expirationTime > (currentTime + bufferTime)
  },

  // Check if token exists but might be expired
  hasToken(): boolean {
    return !!localStorage.getItem('access_token')
  },

  // Get stored user data
  getCurrentUserFromStorage(): AuthResponse['user'] | null {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('access_token')
  },

  // Initialize auth (call this on app startup)
  async initializeAuth(): Promise<boolean> {
    if (!this.hasToken()) return false

    if (this.isAuthenticated()) {
      return true
    }

    // Token exists but might be expired, try to refresh
    try {
        await this.refreshToken()
        return true
    } catch (error) {
        console.log(error)
        this.clearAuth()
        return false
    }
  }
}

// Export the configured axios instance for other services
export { api }