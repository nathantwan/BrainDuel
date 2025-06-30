'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Upload, 
  FolderOpen, 
  Sword, 
  LogOut, 
  Bell,
  Trophy,
  BookOpen,
  Zap,
  Settings,
  Gamepad2
} from 'lucide-react'
import { User as UserIcon } from 'lucide-react'
import { User } from '../../types/auth'
import { authService } from '../../services/auth'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    totalNotes: 12,
    totalBattles: 8,
    winRate: 75,
    currentStreak: 3
  })

  useEffect(() => {
     const fetchUserData = async () => {
      try {
        // First check if user is authenticated
        const isAuthenticated = await authService.initializeAuth()
        
        if (!isAuthenticated) {
          router.push('/auth')
          return
        }

        // Try to get user from local storage first (instant UI)
        const userFromStorage = authService.getCurrentUserFromStorage()
        if (userFromStorage) {
          setUser(userFromStorage)
        }

        // Then fetch fresh user data from API
        const freshUserData = await authService.getCurrentUser()
        setUser(freshUserData)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        authService.clearAuth()
        router.push('/auth')
      }
    }

    fetchUserData()
  }, [router]) // Make sure to include router in dependencies


  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/auth')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navigateToUpload = () => {
    router.push('/upload')
  }

  const navigateToFolders = () => {
    router.push('/folders')
  }

  const navigateToBattle = () => {
    router.push('/battle')
  }

  const navigateToProfile = () => {
    router.push('/profile')
  }

  const navigateToSettings = () => {
    router.push('/settings')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">BrainDuel</h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={navigateToProfile}
                className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:block font-medium">{user?.username || 'User'}</span>
              </button>
              <button 
                onClick={navigateToSettings}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username || 'Student'}! 👋
          </h2>
          <p className="text-gray-600">
            Ready to challenge your knowledge and dominate the leaderboards?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Battles Fought</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBattles}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Sword className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.winRate}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upload Notes */}
          <button
            onClick={navigateToUpload}
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div className="bg-blue-50 group-hover:bg-blue-100 p-2 rounded-lg transition-colors">
                <span className="text-xs font-semibold text-blue-600">NEW</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Notes</h3>
            <p className="text-gray-600 mb-4">
              Add your study materials and transform them into battle-ready knowledge
            </p>
            <div className="flex items-center text-blue-600 font-medium">
              <span>Get Started</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Class Folders */}
          <button
            onClick={navigateToFolders}
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-2xl group-hover:from-purple-700 group-hover:to-purple-800 transition-all">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <div className="bg-purple-50 group-hover:bg-purple-100 p-2 rounded-lg transition-colors">
                <span className="text-xs font-semibold text-purple-600">{stats.totalNotes}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Class Folders</h3>
            <p className="text-gray-600 mb-4">
              Organize and review your study materials by subject and topic
            </p>
            <div className="flex items-center text-purple-600 font-medium">
              <span>Browse Files</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Start Battle */}
          <button
            onClick={navigateToBattle}
            className="group bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 text-left text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-4 rounded-2xl group-hover:bg-white/30 transition-all">
                <Sword className="h-8 w-8 text-white" />
              </div>
              <div className="bg-white/20 group-hover:bg-white/30 p-2 rounded-lg transition-colors">
                <span className="text-xs font-semibold text-white">LIVE</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Start Battle</h3>
            <p className="text-white/90 mb-4">
              Challenge opponents and test your knowledge in real-time duels
            </p>
            <div className="flex items-center font-medium">
              <span>Enter Arena</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Victory in Math Battle!</p>
                <p className="text-sm text-gray-600">Defeated @student123 in Calculus duel</p>
              </div>
              <span className="text-xs text-gray-500">2h ago</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">New notes uploaded</p>
                <p className="text-sm text-gray-600">Physics Chapter 12 - Quantum Mechanics</p>
              </div>
              <span className="text-xs text-gray-500">1d ago</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Sword className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Close battle</p>
                <p className="text-sm text-gray-600">Lost to @brainiac_99 by 2 points</p>
              </div>
              <span className="text-xs text-gray-500">2d ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}