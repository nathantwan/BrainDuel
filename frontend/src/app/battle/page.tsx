'use client'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Plus, User,
  Settings, LogOut, Bell
} from 'lucide-react';
import { useBattles } from '../../hooks/use-battles';
import type { CreateBattleRequest } from '../../types/battle';
import { useAuth } from '../../hooks/use-auth';
import type { CreateBattleTabProps, JoinBattleTabProps } from '../../types/ui';
import { useFolders } from '../../hooks/use-folders';
import type { FolderResponse } from '../../types/file';

const BattleHub = () => {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  
  // Use the battle hooks
  const {
    loading: battlesLoading,
    createBattle,
    joinBattle,
    fetchBattles
  } = useBattles();

  // Memoize the fetch function to avoid dependency issues
  const memoizedFetchBattles = useCallback(() => {
    fetchBattles();
  }, [fetchBattles]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth')
      return
    }
  }, [isAuthenticated, user, router])

  const handleCreateBattle = async (battleData: CreateBattleRequest) => {
    if (!user) return;
    
    try {
      const result = await createBattle(battleData);
      // Navigate to the battle page
      router.push(`/battle/${result.id}`);
      return result;
    } catch (error) {
      console.error('Failed to create battle:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fetch battles when user is available - but we'll only show invites now
  useEffect(() => {
    if (user && isAuthenticated) {
      memoizedFetchBattles();
    }
  }, [user, isAuthenticated, memoizedFetchBattles]);

  // Show loading state while fetching user
  if (authLoading || !user || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
                <User className="h-5 w-5" />
                <span className="hidden sm:block font-medium">{user.username}</span>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Battle Arena</h2>
          <p className="text-gray-300">Create battles with room codes or join existing battles</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-gray-700 rounded-2xl p-1 shadow-md">
            <button
              onClick={() => setActiveTab('join')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'join' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' 
                  : 'text-gray-300 hover:text-blue-400'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Join Battle
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'create' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' 
                  : 'text-gray-300 hover:text-blue-400'
              }`}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Battle
            </button>
          </div>
        </div>

        {activeTab === 'join' ? (
          <JoinBattleTab 
            joinBattle={joinBattle}
            loading={battlesLoading}
          />
        ) : (
          <CreateBattleTab 
            onCreateBattle={handleCreateBattle}
            loading={battlesLoading}
          />
        )}
      </main>
    </div>
  );
};

const JoinBattleTab: React.FC<JoinBattleTabProps> = ({ 
  joinBattle,
  loading
}) => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState(''); // For room code join errors

  const handleJoinByRoomCode = async () => {
    if (!roomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }
    
    try {
      setJoinError('');
      const battle = await joinBattle(roomCode.trim().toUpperCase());
      console.log('Join battle response:', battle);
      
      // Validate battle ID before navigation
      if (!battle || !battle.id) {
        console.error('Invalid battle response:', battle);
        console.error('Battle object keys:', battle ? Object.keys(battle) : 'null');
        setJoinError('Invalid battle response from server');
        return;
      }
      
      // Clear the input after successful join
      setRoomCode('');
      console.log('Navigating to battle:', battle.id);
      router.push(`/battle/${battle.id}`); // Navigate to the battle room
      // Note: The actual navigation to battle room should be handled
      // by the parent component or via the joinBattle implementation
    } catch (error) {
      console.error('Failed to join battle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join battle. Please check the room code.';
      setJoinError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading invites...</p>
        </div>
      </div>
    );
  }

  // The rest of your component JSX goes here
  // Make sure to show joinError if it exists and handle joinLoading state

  return (
    <div className="space-y-6">
      {/* Room Code Input */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Join Battle with Room Code</h3>
                  <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gray-700 text-white placeholder-gray-400"
              maxLength={6}
            />
            <button
              onClick={handleJoinByRoomCode}
              disabled={!roomCode.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              Join Battle
            </button>
          </div>
          {joinError && (
            <div className="mt-3 p-3 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{joinError}</p>
            </div>
          )}
      </div>

      {/* Info Section */}
      <div className="bg-gray-800 rounded-2xl p-8 shadow-lg text-center border border-gray-700">
        <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Join a Battle</h3>
        <p className="text-gray-400">Enter a room code to join an existing battle!</p>
      </div>
    </div>
  );
};

const CreateBattleTab: React.FC<CreateBattleTabProps> = ({ 
  onCreateBattle,
  loading
}) => {
  const router = useRouter();
  // Use the folders hook to get real data
  const { getMyFolders, loading: foldersLoading, error: foldersError } = useFolders();
  const [availableFolders, setAvailableFolders] = useState<FolderResponse[]>([]);
  
  const [selectedFolder, setSelectedFolder] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState(300);

  // Fetch folders when component mounts
  useEffect(() => {
    const fetchFolders = async () => {
      const folders = await getMyFolders();
      if (folders) {
        setAvailableFolders(folders);
      }
    };
    
    fetchFolders();
  }, [getMyFolders]);

  const handleCreateBattle = async () => {
    if (!selectedFolder) {
      alert('Please select a folder');
      return;
    }

    const battleData: CreateBattleRequest = {
      class_folder_id: selectedFolder,
      total_questions: numQuestions,
      time_limit_seconds: timeLimit,
      is_public: true,
    };
    console.log(numQuestions)
    try {
      const result = await onCreateBattle(battleData);
      
      // Navigate directly to the battle page instead of showing room code screen
      if (result?.id || result?.battle_id) {
        const battleId = result.id || result.battle_id;
        router.push(`/battle/${battleId}`);
      }
      
      // Reset form
      setSelectedFolder('');
      setNumQuestions(5);
      setTimeLimit(300);
    } catch (error) {
      console.error('Failed to create battle:', error);
    }
  };



  // Show loading state while fetching folders
  if (foldersLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading your folders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if folders failed to load
  if (foldersError) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
        <div className="text-center text-red-400">
          <h3 className="text-lg font-medium mb-2">Failed to load folders</h3>
          <p className="text-sm">{foldersError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Battle</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Course Folder
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
            >
              <option value="">Choose a folder...</option>
              {availableFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name} - {folder.course_code || 'No course specified'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Questions
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />


            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>5</span>
              <span className="font-medium text-blue-400">{numQuestions} questions</span>
              <span>20</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Limit (minutes)
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
            >
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
              <option value={1800}>30 minutes</option>
            </select>
          </div>



          <button
            onClick={handleCreateBattle}
            disabled={loading || !selectedFolder}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Battle...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Battle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleHub;