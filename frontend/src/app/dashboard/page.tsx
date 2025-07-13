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
  Settings
} from 'lucide-react'
import { User as UserIcon } from 'lucide-react'
import { useAuth } from '../../hooks/use-auth'
import { dashboardService, UserStats, RecentActivity } from '../../services/dashboard'

export default function Dashboard() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    totalNotes: 0,
    totalBattles: 0,
    winRate: 0,
    currentStreak: 0,
    totalWins: 0,
    totalLosses: 0,
    averageScore: 0,
    bestScore: 0,
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    accuracy: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) {
        router.push('/auth')
        return
      }

      try {
        // Fetch dashboard data
        const dashboardData = await dashboardService.getDashboardData()
        setStats(dashboardData.stats)
        setRecentActivity(dashboardData.recentActivity)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Keep default stats if dashboard data fails
      }
    }

    if (!authLoading) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user, authLoading, router])

  const handleLogout = async () => {
    try {
      await logout()
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

  if (authLoading || !user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-800 to-purple-900 p-2 rounded-full">
                <img src="/icons/brainduel1.svg" alt="BrainDuel" className="h-16 w-16" />
              </div>
              <h1 className="text-xl font-bold text-white">BrainDuel</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:block font-medium">{user.username}</span>
              </button>
              <button className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.username || 'Student'}! 👋
          </h2>
          <p className="text-gray-300">
            Ready to challenge your knowledge and dominate the leaderboards?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Notes</p>
                <p className="text-2xl font-bold text-white">{stats.totalNotes}</p>
              </div>
              <div className="bg-blue-900/30 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Battles Fought</p>
                <p className="text-2xl font-bold text-white">{stats.totalBattles}</p>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <Sword className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
              </div>
              <div className="bg-green-900/30 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
              </div>
              <div className="bg-orange-900/30 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upload Notes */}
          <button
            onClick={navigateToUpload}
            className="group bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 text-left border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div className="bg-blue-900/30 group-hover:bg-blue-900/50 p-2 rounded-lg transition-colors">
                <span className="text-xs font-semibold text-blue-400">NEW</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Notes</h3>
            <p className="text-gray-300 mb-4">
              Add your study materials and transform them into battle-ready knowledge
            </p>
            <div className="flex items-center text-blue-400 font-medium">
              <span>Get Started</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Class Folders */}
          <button
            onClick={navigateToFolders}
            className="group bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 text-left border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 rounded-2xl group-hover:from-purple-700 group-hover:to-purple-800 transition-all">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <div className="bg-purple-900/30 group-hover:bg-purple-900/50 p-2 rounded-lg transition-colors">
                <span className="text-xs font-semibold text-purple-400">{stats.totalNotes}</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Class Folders</h3>
            <p className="text-gray-300 mb-4">
              Organize and review your study materials by subject and topic
            </p>
            <div className="flex items-center text-purple-400 font-medium">
              <span>Browse Files</span>
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Start Battle */}
          <button
            onClick={navigateToBattle}
            className="group bg-gradient-to-br from-red-600 to-pink-700 rounded-2xl shadow-xl p-8 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 text-left text-white border border-red-500/30"
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
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'battle_victory' ? 'bg-green-900/30' :
                    activity.type === 'battle_defeat' ? 'bg-red-900/30' :
                    activity.type === 'notes_uploaded' ? 'bg-blue-900/30' :
                    'bg-purple-900/30'
                  }`}>
                    {activity.type === 'battle_victory' && <Trophy className="h-5 w-5 text-green-400" />}
                    {activity.type === 'battle_defeat' && <Sword className="h-5 w-5 text-red-400" />}
                    {activity.type === 'notes_uploaded' && <Upload className="h-5 w-5 text-blue-400" />}
                    {activity.type === 'battle_started' && <Sword className="h-5 w-5 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{activity.title}</p>
                    <p className="text-sm text-gray-300">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400">No recent activity</p>
                <p className="text-sm text-gray-500">Start uploading notes and battling to see your activity here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}