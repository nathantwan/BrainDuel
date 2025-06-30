'use client'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Plus, Search, Filter, 
  ArrowRight, Gamepad2, User,
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

  const { invites, loading: invitesLoading, dismissInvite } = usePendingInvites();
  
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
      console.log('New battle invite:', data);
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
      await createBattle(battleData);
      setActiveTab('join'); // Switch to join tab to see the created battle
    } catch (error) {
      console.error('Failed to create battle:', error);
    }
  };

  const handleAcceptBattle = async (battleId: string) => {
    if (!user) return;
    
    try {
      await acceptBattle(battleId);
      wsAcceptBattle(battleId);
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

  const handleDismissInvite = async (inviteId: string) => {
    try {
      await dismissInvite(inviteId);
    } catch (error) {
      console.error('Failed to dismiss invite:', error);
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

  // Fetch battles when user is available
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
              <div className="relative">
                <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors relative">
                  <Bell className="h-5 w-5" />
                  {invites.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {invites.length}
                    </span>
                  )}
                </button>
              </div>
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
          <p className="text-gray-600">Challenge others or join existing battles to test your knowledge</p>
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
            battles={battles}
            loading={battlesLoading}
            error={battlesError}
            onBattleSelect={handleBattleStart}
            invites={invites}
            onAcceptInvite={handleAcceptBattle}
            onDeclineInvite={handleDeclineBattle}
            onDismissInvite={handleDismissInvite}
            userId={user.id}
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

// Types for the components
interface JoinBattleTabProps {
  battles: Battle[];
  loading: boolean;
  error: string | null;
  onBattleSelect: (battleId: string) => void;
  invites: PendingInvite[];
  onAcceptInvite: (battleId: string) => void;
  onDeclineInvite: (battleId: string) => void;
  onDismissInvite: (inviteId: string) => void;
  userId: string;
}

const JoinBattleTab: React.FC<JoinBattleTabProps> = ({ 
  battles, 
  loading, 
  error, 
  onBattleSelect,
  invites,
  onAcceptInvite,
  onDeclineInvite,
  onDismissInvite,
  userId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [showInvites, setShowInvites] = useState(invites.length > 0);

  // Update showInvites when invites change
  useEffect(() => {
    setShowInvites(invites.length > 0);
  }, [invites.length]);

  const filteredBattles = battles.filter(battle => {
    const folderIdMatch = (battle.class_folder_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const creatorMatch = filterCreator === '' || (battle.challenger_username || '').toLowerCase().includes(filterCreator.toLowerCase());
    return folderIdMatch && creatorMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
        <div className="text-red-500 text-6xl mb-4">!</div>
        <h3 className="text-xl font-semibold text-gray-500 mb-2">{error}</h3>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showInvites && invites.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Pending Invites</h3>
            <button 
              onClick={() => setShowInvites(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              Hide
            </button>
          </div>
          <div className="space-y-3">
            {invites.map(invite => (
              <div key={invite.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium">{invite.challenger_username} challenged you to a battle</p>
                  <p className="text-sm text-gray-600">{invite.class_folder_name}</p>
                  <p className="text-xs text-gray-500">
                    {invite.questions_count} questions • {Math.floor(invite.time_limit / 60)} minutes
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAcceptInvite(invite.battle_id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDeclineInvite(invite.battle_id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search battles by course name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Filter by creator username..."
                value={filterCreator}
                onChange={(e) => setFilterCreator(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredBattles.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No battles available</h3>
            <p className="text-gray-400">Check back later or create your own battle!</p>
          </div>
        ) : (
          filteredBattles.map((battle) => (
            <BattleCard 
              key={battle.id} 
              battle={battle} 
              onJoin={() => onBattleSelect(battle.id)}
              userId={userId}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface BattleCardProps {
  battle: Battle;
  onJoin: () => void;
  userId: string;
}

const BattleCard: React.FC<BattleCardProps> = ({ battle, onJoin, userId }) => {
  const timeAgo = Math.floor((Date.now() - new Date(battle.created_at).getTime()) / (1000 * 60));
  const isCreator = battle.challenger_id === userId;
  const canJoin = battle.battle_status === 'pending' && !isCreator && !battle.opponent_id;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">{battle.class_folder_id}</h3>
          <p className="text-gray-600">
            {isCreator ? 'You created this battle' : `Challenged by ${battle.challenger_username || 'Unknown'}`}
            {battle.opponent_username && ` vs ${battle.opponent_id === userId ? 'you' : battle.opponent_username}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          battle.battle_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          battle.battle_status === 'active' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {battle.battle_status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center bg-blue-50 p-3 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">{battle.questions_count}</div>
          <div className="text-sm text-gray-500">Questions</div>
        </div>
        
        <div className="text-center bg-purple-50 p-3 rounded-xl">
          <div className="flex items-center justify-center space-x-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              {Math.floor(battle.time_limit / 60)}
            </span>
          </div>
          <div className="text-sm text-gray-500">Minutes</div>
        </div>
        
        <div className="text-center bg-orange-50 p-3 rounded-xl">
          <div className="text-2xl font-bold text-orange-600">{Math.max(0, Math.floor(timeAgo))}</div>
          <div className="text-sm text-gray-500">Min ago</div>
        </div>
        
        <div className="text-center bg-green-50 p-3 rounded-xl">
          <div className="text-2xl font-bold text-green-600">
            {battle.opponent_id ? 2 : 1}
          </div>
          <div className="text-sm text-gray-500">Players</div>
        </div>
      </div>
      
      <button
        onClick={onJoin}
        disabled={!canJoin}
        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center group-hover:shadow-md ${
          !canJoin ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className="mr-2">⚔️</span>
        {isCreator ? 'Your Battle' : canJoin ? 'Join Battle' : 'Battle In Progress'}
        {canJoin && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
      </button>
    </div>
  );
};

interface CreateBattleTabProps {
  userId: string;
  onCreateBattle: (data: CreateBattleRequest) => void;
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
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(300);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [battleType, setBattleType] = useState<'public' | 'private'>('public');

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
      battle_type: opponentUsername.trim() ? 'private' : battleType,
      class_folder_id: selectedFolder,
      questions_count: numQuestions,
      time_limit: timeLimit,
      opponent_username: opponentUsername.trim() || undefined,
    };

    await onCreateBattle(battleData);
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
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Battle</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Battle Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  checked={battleType === 'public'}
                  onChange={(e) => setBattleType(e.target.value as 'public' | 'private')}
                  className="mr-2"
                />
                Public (Anyone can join)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  checked={battleType === 'private'}
                  onChange={(e) => setBattleType(e.target.value as 'public' | 'private')}
                  className="mr-2"
                />
                Private (Invite only)
              </label>
            </div>
          </div>

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

          {battleType === 'private' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Specific Opponent
              </label>
              <input
                type="text"
                placeholder="Enter username..."
                value={opponentUsername}
                onChange={(e) => setOpponentUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={battleType === 'private'}
              />
              <p className="text-sm text-gray-500 mt-1">
                Required for private battles
              </p>
            </div>
          )}

          {battleType === 'public' && (
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
                Leave empty to make it available for anyone to join
              </p>
            </div>
          )}

          <button
            onClick={handleCreateBattle}
            disabled={loading || !selectedFolder || (battleType === 'private' && !opponentUsername.trim())}
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