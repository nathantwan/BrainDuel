'use client'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Plus, Filter, 
  ArrowRight, Gamepad2, User, Copy, Check,
  Settings, LogOut, Bell, Clock, Trophy
} from 'lucide-react';
import { useBattles } from '../../hooks/use-battles';
import { useBattleGame } from '../../hooks/use-battle';
import { useBattleWebSocket } from '../../hooks/use-battlewebsocket';
import { usePendingInvites } from '../../hooks/use-invites';
import type { Battle, CreateBattleRequest, PendingInvite } from '../../types/battle';
import { authService } from '../../services/auth';
import type { User as UserType } from '../../types/auth';
import { useFolders } from '../../hooks/use-folders';
import type { FolderResponse } from '../../types/file';


const BattleHub = () => {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [realtimeInvites, setRealtimeInvites] = useState<any[]>([]); // For real-time invites
  
  // Use the battle hooks
  const {
    battles,
    loading: battlesLoading,
    error: battlesError,
    createBattle,
    joinBattle,
    acceptBattle,
    declineBattle,
    fetchBattles
  } = useBattles();


  
  // Memoize the fetch function to avoid dependency issues
  const memoizedFetchBattles = useCallback(() => {
    fetchBattles();
  }, [fetchBattles]);

  // WebSocket integration - only initialize when user is available
  const {
    isConnected: wsConnected,
    acceptBattle: wsAcceptBattle,
    declineBattle: wsDeclineBattle
  } = useBattleWebSocket({
    userId: user?.id || '',
    onBattleInvite: (data) => {
      console.log('New battle invite received:', data);
      console.log('Current realtimeInvites:', realtimeInvites);
      setRealtimeInvites(prev => {
        console.log('Updating realtimeInvites from:', prev, 'to:', [...prev, data]);
        return [...prev, data];
      });
      memoizedFetchBattles(); // Refresh battles list
    },
    onBattleAccepted: (data) => {
      console.log('Battle accepted:', data);
      memoizedFetchBattles();
    },
    onBattleDeclined: (data) => {
      console.log('Battle declined:', data);
      memoizedFetchBattles();
    }
  });

  // Debug realtimeInvites changes
  useEffect(() => {
    console.log('realtimeInvites updated:', realtimeInvites);
  }, [realtimeInvites]);

  const fetchUserData = async () => {
    try {
      setUserLoading(true);
      
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
    } finally {
      setUserLoading(false);
    }
  }

  // Handle battle actions
  const handleBattleStart = async (battleId: string) => {
    if (!user) return;
    
    try {
      await joinBattle(battleId);
      // The battle state will update via the WebSocket handler
    } catch (error) {
      console.error('Failed to join battle:', error);
    }
  };

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

  const handleAcceptBattle = async (battleId: string) => {
    if (!user) return;
    
    try {
      await acceptBattle(battleId);
      wsAcceptBattle(battleId);
      // Navigate to the battle page
      router.push(`/battle/${battleId}`);
    } catch (error) {
      console.error('Failed to accept battle:', error);
    }
  };

  const handleDeclineBattle = async (battleId: string) => {
    if (!user) return;
    
    try {
      await declineBattle(battleId);
      wsDeclineBattle(battleId, user.id);
    } catch (error) {
      console.error('Failed to decline battle:', error);
    }
  };



  const handleLogout = async () => {
    try {
      await authService.clearAuth();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch battles when user is available - but we'll only show invites now
  useEffect(() => {
    if (user) {
      memoizedFetchBattles();
    }
  }, [user, memoizedFetchBattles]);

  // Show loading state while fetching user
  if (userLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">BrainDuel</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5" />
                <span className="hidden sm:block font-medium">{user.username}</span>
              </button>
              <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Battle Arena</h2>
          <p className="text-gray-600">Create battles with room codes or accept pending invites</p>
          {!wsConnected && (
            <div className="mt-2 text-sm text-yellow-600 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Connecting to real-time updates...
            </div>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-1 shadow-md">
            <button
              onClick={() => setActiveTab('join')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'join' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-500'
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
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create Battle
            </button>
          </div>
        </div>

        {activeTab === 'join' ? (
          <JoinBattleTab 
  userId={user.id}
  joinBattle={joinBattle}
  loading={battlesLoading}
  realtimeInvites={realtimeInvites}
  onAcceptInvite={handleAcceptBattle}
  onDeclineInvite={handleDeclineBattle}
  setRealtimeInvites={setRealtimeInvites}
/>
        ) : (
          <CreateBattleTab 
            userId={user.id}
            onCreateBattle={handleCreateBattle}
            loading={battlesLoading}
          />
        )}
      </main>
    </div>
  );
};

interface JoinBattleTabProps {
  userId: string;
  joinBattle: (roomCode: string) => Promise<Battle>;
  loading: boolean;
  realtimeInvites: any[];
  onAcceptInvite: (battleId: string) => Promise<void>;
  onDeclineInvite: (battleId: string) => Promise<void>;
  setRealtimeInvites: React.Dispatch<React.SetStateAction<any[]>>;
}

const JoinBattleTab: React.FC<JoinBattleTabProps> = ({ 
  userId,
  joinBattle,
  loading,
  realtimeInvites,
  onAcceptInvite,
  onDeclineInvite,
  setRealtimeInvites
}) => {
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
      // Clear the input after successful join
      setRoomCode('');
      router.push(`/battle/${battle.id}`); // Navigate to the battle room
      // Note: The actual navigation to battle room should be handled
      // by the parent component or via the joinBattle implementation
    } catch (error) {
      console.error('Failed to join battle:', error);
      setJoinError(error.message || 'Failed to join battle. Please check the room code.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invites...</p>
        </div>
      </div>
    );
  }

  // The rest of your component JSX goes here
  // Make sure to show joinError if it exists and handle joinLoading state

  return (
    <div className="space-y-6">
      {/* Room Code Input */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Join Battle with Room Code</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter room code..."
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            maxLength={6}
          />
          <button
            onClick={handleJoinByRoomCode}
            disabled={!roomCode.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all"
          >
            Join Battle
          </button>
        </div>
      </div>

      {/* Pending Invites */}
      {realtimeInvites.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Battle Invitations</h3>
          <div className="space-y-3">
            {realtimeInvites.map((invite, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium">{invite.battle?.challenger_username} challenged you to a battle</p>
                  <p className="text-sm text-gray-600">{invite.battle?.class_folder_name}</p>
                  <p className="text-xs text-gray-500">
                    {invite.battle?.total_questions} questions • {Math.floor(invite.battle?.time_limit_seconds / 60)} minutes
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onAcceptInvite(invite.battle.id);
                      setRealtimeInvites(realtimeInvites.filter((_, i) => i !== index));
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      onDeclineInvite(invite.battle.id);
                      setRealtimeInvites(realtimeInvites.filter((_, i) => i !== index));
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No pending invites</h3>
          <p className="text-gray-400">Use a room code to join a battle or wait for someone to invite you!</p>
        </div>
      )}
    </div>
  );
};

interface CreateBattleTabProps {
  userId: string;
  onCreateBattle: (data: CreateBattleRequest) => Promise<any>;
  loading: boolean;
}

const CreateBattleTab: React.FC<CreateBattleTabProps> = ({ 
  userId,
  onCreateBattle,
  loading
}) => {
  // Use the folders hook to get real data
  const { getMyFolders, loading: foldersLoading, error: foldersError } = useFolders();
  const [availableFolders, setAvailableFolders] = useState<FolderResponse[]>([]);
  
  const [selectedFolder, setSelectedFolder] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState(300);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [createdBattle, setCreatedBattle] = useState<{roomCode: string; battleId: string} | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
      opponent_username: opponentUsername.trim() || undefined,
      class_folder_id: selectedFolder,
      total_questions: numQuestions,
      time_limit_seconds: timeLimit,
      is_public: !opponentUsername.trim(),
    };
    console.log(numQuestions)
    try {
      const result = await onCreateBattle(battleData);
      
      // If no specific opponent, show the room code
      if (!opponentUsername.trim() && result?.room_code) {
        setCreatedBattle({
          roomCode: result.room_code,
          battleId: result.id || result.battle_id
        });
      }
      
      // Reset form
      setSelectedFolder('');
      setNumQuestions(5);
      setTimeLimit(300);
      setOpponentUsername('');
    } catch (error) {
      console.error('Failed to create battle:', error);
    }
  };

  const copyRoomCode = async () => {
    if (createdBattle?.roomCode) {
      try {
        await navigator.clipboard.writeText(createdBattle.roomCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy room code:', err);
      }
    } 
  };

  const createAnotherBattle = () => {
    setCreatedBattle(null);
    setCopiedCode(false);
  };

  // Show loading state while fetching folders
  if (foldersLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your folders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if folders failed to load
  if (foldersError) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center text-red-500">
          <h3 className="text-lg font-medium mb-2">Failed to load folders</h3>
          <p className="text-sm">{foldersError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show room code after creating a public battle
  if (createdBattle) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Battle Created!</h2>
          <p className="text-gray-600 mb-6">Share this room code with others to join your battle</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Room Code</p>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl font-bold font-mono text-blue-600 tracking-wider">
                {createdBattle.roomCode}
              </span>
              <button
                onClick={copyRoomCode}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="Copy room code"
              >
                {copiedCode ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            {copiedCode && (
              <p className="text-sm text-green-600 mt-2">Room code copied to clipboard!</p>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={createAnotherBattle}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Create Another Battle
            </button>
            <button
              onClick={() => {/* TODO: Navigate to battle waiting room */}}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Go to Battle Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Battle</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course Folder
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />


            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>5</span>
              <span className="font-medium text-blue-600">{numQuestions} questions</span>
              <span>20</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
              <option value={1800}>30 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Specific Opponent (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter username..."
              value={opponentUsername}
              onChange={(e) => setOpponentUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {opponentUsername.trim() 
                ? "This will send a private invite to the specified user" 
                : "Leave empty to create a battle with a room code that anyone can join"
              }
            </p>
          </div>

          <button
            onClick={handleCreateBattle}
            disabled={loading || !selectedFolder}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center"
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