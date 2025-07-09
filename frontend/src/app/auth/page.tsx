'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Mail, User, Lock } from 'lucide-react'
import { authService } from '../../services/auth'
import { AlertMessage } from '../../components/ui/'
import { InputField } from '../../components/ui/'


// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password) => {
  return password.length >= 6
}

const validateUsername = (username) => {
  return username.length >= 3
}

const getPasswordStrength = (password) => {
  if (!password) return 0
  let strength = 0
  if (password.length >= 6) strength += 1
  if (password.length >= 8) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^A-Za-z0-9]/.test(password)) strength += 1
  return Math.min(strength, 5)
}

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form data states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Form errors
  const [loginErrors, setLoginErrors] = useState({
    email: '',
    password: ''
  })
  const [signupErrors, setSignupErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Validation functions
  const validateLoginForm = () => {
    const errors = {
      email: '',
      password: ''
    }
    
    if (!loginData.email) {
      errors.email = 'Email is required'
    } else if (!validateEmail(loginData.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required'
    } else if (!validatePassword(loginData.password)) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setLoginErrors(errors)
    return !errors.email && !errors.password
  }

  const validateSignupForm = () => {
    const errors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  
    if (!signupData.username) {
      errors.username = 'Username is required'
    } else if (!validateUsername(signupData.username)) {
      errors.username = 'Username must be at least 3 characters'
    }
    
    if (!signupData.email) {
      errors.email = 'Email is required'
    } else if (!validateEmail(signupData.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    if (!signupData.password) {
      errors.password = 'Password is required'
    } else if (!validatePassword(signupData.password)) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!signupData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match"
    }
    
    setSignupErrors(errors)
    return !errors.username && !errors.email && !errors.password && !errors.confirmPassword
  }

  const handleLoginSubmit = async () => {
    setError('')
    setSuccess('')
    
    if (!validateLoginForm()) return
    
    setIsLoading(true)
    try {
      await authService.login({
        email: loginData.email,
        password: loginData.password
      })
      
      setSuccess('Login successful! Redirecting...')
      router.push('/dashboard')
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSubmit = async () => {
    setError('')
    setSuccess('')
    
    if (!validateSignupForm()) return
    
    setIsLoading(true)
    try {
      await authService.signup({
        username: signupData.username,
        email: signupData.email,
        password: signupData.password
      })
      
      setSuccess('Account created successfully! Redirecting...')
      router.push('/dashboard')
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (form, field, value) => {
    if (form === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }))
      if (loginErrors[field]) {
        setLoginErrors(prev => ({ ...prev, [field]: '' }))
      }
    } else {
      setSignupData(prev => ({ ...prev, [field]: value }))
      if (signupErrors[field]) {
        setSignupErrors(prev => ({ ...prev, [field]: '' }))
      }
    }
    
    if (error) setError('')
  }

  const switchMode = (mode) => {
    setIsLogin(mode)
    setError('')
    setSuccess('')
    setLoginErrors({
      email: '',
      password: ''
    })
    setSignupErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  const passwordStrength = getPasswordStrength(signupData.password)
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-800 to-purple-900 p-2 rounded-full">
              <img src="/icons/brainduel1.svg" alt="BrainDuel" className="h-16 w-16" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BrainDuel</h1>
          <p className="text-gray-300">
            {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to start dueling'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
          {/* Toggle Buttons */}
          <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                ? 'bg-gray-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                ? 'bg-gray-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error/Success Messages */}
          <AlertMessage type="error" message={error} />
          <AlertMessage type="success" message={success} />

          {/* Login Form */}
          {isLogin ? (
            <div className="space-y-4">
              <InputField
                id="email"
                label="Email"
                type="email"
                value={loginData.email}
                onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                placeholder="Enter your email"
                icon={Mail}
                error={loginErrors.email}
              />

              <InputField
                id="password"
                label="Password"
                type="password"
                value={loginData.password}
                onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                placeholder="Enter your password"
                icon={Lock}
                error={loginErrors.password}
                hasPasswordToggle={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              <button
                type="button"
                onClick={handleLoginSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          ) : (
            /* Signup Form */
            <div className="space-y-4">
              <InputField
                id="username"
                label="Username"
                type="text"
                value={signupData.username}
                onChange={(e) => handleInputChange('signup', 'username', e.target.value)}
                placeholder="Choose a username"
                icon={User}
                error={signupErrors.username}
              />

              <InputField
                id="signup-email"
                label="Email"
                type="email"
                value={signupData.email}
                onChange={(e) => handleInputChange('signup', 'email', e.target.value)}
                placeholder="Enter your email"
                icon={Mail}
                error={signupErrors.email}
              />

              <InputField
                id="signup-password"
                label="Password"
                type="password"
                value={signupData.password}
                onChange={(e) => handleInputChange('signup', 'password', e.target.value)}
                placeholder="Create a password"
                icon={Lock}
                error={signupErrors.password}
                hasPasswordToggle={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Password Strength Indicator */}
              {signupData.password && (
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Password strength:</span>
                    <span className="text-xs font-medium text-gray-300">
                      {passwordStrength < 2 ? 'Weak' : 
                       passwordStrength < 4 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${strengthColors[passwordStrength - 1] || 'bg-gray-700'}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <InputField
                id="confirm-password"
                label="Confirm Password"
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) => handleInputChange('signup', 'confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                icon={Lock}
                error={signupErrors.confirmPassword}
                hasPasswordToggle={true}
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <button
                type="button"
                onClick={handleSignupSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          )}

          {/* Google Login Placeholder */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <button
              type="button"
              disabled
              className="mt-4 w-full bg-gray-700 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed flex items-center justify-center space-x-2 border border-gray-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google (Coming Soon)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}