'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebSocket } from '../../../hooks/use-websocket';
import { battleService } from '../../../services/battle';
import { authService } from '../../../services/auth';
import BattleWaitingScreen from '../../../components/quiz/BattleWaitingScreen';
import BattleGameScreen from '../../../components/quiz/BattleGameScreen';
import BattleResultsScreen from '../../../components/quiz/BattleResultsScreen';
import { Battle, BattleQuestion } from '../../../types/battle';
import { WebSocketMessage } from '../../../types/websocket';
import type { BattleState } from '../../../types/ui';
import type { User } from '../../../types/auth';

const BattlePage = () => {
  const params = useParams();
  const router = useRouter();
  const battleId = params.battleId as string;
  
  const [battleState, setBattleState] = useState<BattleState>('loading');
  const [battleData, setBattleData] = useState<Battle | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Game state
  const [battleResults, setBattleResults] = useState<any>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  
  // WebSocket message state for BattleGameScreen
  const [opponentAnswered, setOpponentAnswered] = useState<any>(null);
  const [questionCompleted, setQuestionCompleted] = useState<any>(null);
  
  // Individual timer state
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  
  // Opponent status tracking
  const [lastOpponentCheck, setLastOpponentCheck] = useState<number>(0);
  const fallbackPollingInterval = useRef<NodeJS.Timeout | null>(null);
  const battleStatusInterval = useRef<NodeJS.Timeout | null>(null);
  
  // WebSocket connection
  const {
    isConnected: wsConnected,
    addMessageHandler,
    removeMessageHandler,
    addConnectionListener,
    removeConnectionListener,
  } = useWebSocket(user?.id || '');

  // Timer functions
  const startQuestionTimer = useCallback(() => {
    console.log('=== STARTING QUESTION TIMER ===');
    setCurrentQuestionStartTime(Date.now());
    setAccumulatedTime(0);
    setIsPaused(false);
  }, []);

  const pauseQuestionTimer = useCallback(() => {
    if (currentQuestionStartTime && !isPaused) {
      console.log('=== PAUSING QUESTION TIMER ===');
      const timeSpent = Date.now() - currentQuestionStartTime;
      setAccumulatedTime(prev => prev + timeSpent);
      setIsPaused(true);
    }
  }, [currentQuestionStartTime, isPaused]);

  const resumeQuestionTimer = useCallback(() => {
    if (isPaused) {
      console.log('=== RESUMING QUESTION TIMER ===');
      setCurrentQuestionStartTime(Date.now());
      setIsPaused(false);
    }
  }, [isPaused]);

  const getCurrentQuestionTime = useCallback(() => {
    if (!currentQuestionStartTime) return 0;
    
    let totalTime = accumulatedTime;
    if (!isPaused) {
      totalTime += Date.now() - currentQuestionStartTime;
    }
    
    return Math.round(totalTime / 1000);
  }, [currentQuestionStartTime, accumulatedTime, isPaused]);

  // Fetch battle questions
  const fetchBattleQuestions = useCallback(async () => {
    try {
      console.log('=== FETCHING BATTLE QUESTIONS ===');
      const questionsData = await battleService.getBattleQuestions(battleId);
      console.log('Questions loaded:', questionsData.questions?.length || 0);
      setQuestions(questionsData.questions || []);
    } catch (error) {
      console.error('Failed to fetch battle questions:', error);
      setError('Failed to load battle questions');
    }
  }, [battleId]);

  // Simplified opponent activity check (fallback when WebSocket fails)
  const checkOpponentActivity = useCallback(async () => {
    if (!battleId || wsConnected) {
      return; // Don't poll if WebSocket is working
    }
    
    try {
      console.log('=== FALLBACK: Checking opponent activity ===');
      const battleData = await battleService.getBattleById(battleId);
      
      // Check if there's new activity - simplified without timestamp checking
      console.log('=== OPPONENT ACTIVITY DETECTED (FALLBACK) ===');
      setOpponentAnswered({
        type: 'opponent_answered',
        timestamp: Date.now(),
        battleData: battleData,
        source: 'polling_fallback'
      });
      setLastOpponentCheck(Date.now());
    } catch (error) {
      console.error('Failed to check opponent activity:', error);
    }
  }, [battleId, wsConnected, lastOpponentCheck]);

  // WebSocket message handler - simplified with no stale closures
  const handleWebSocketMessage = useCallback(async (message: any) => {
    console.log('=== WEBSOCKET MESSAGE RECEIVED ===');
    console.log('Message type:', message.type);
    console.log('Message data:', message);
    
    // Handle battle state transitions
    if (message.type === 'BATTLE_STARTED' || 
        message.type === 'BATTLE_ACCEPTED' ||
        message.type === 'PLAYER_JOINED' ||
        message.type === 'ROOM_JOINED' ||
        message.type === 'OPPONENT_JOINED' ||
        message.type === 'BATTLE_READY') {
      console.log('Battle started/accepted/joined - transitioning to playing state');
      setBattleState('playing');
      fetchBattleQuestions();
      return;
    }
    
    if (message.type === 'BATTLE_COMPLETED' || message.type === 'battle_completed') {
      console.log('=== BATTLE COMPLETED ===');
      console.log('Battle completion message:', message);
      
      // Clean up intervals
      if (fallbackPollingInterval.current) {
        clearInterval(fallbackPollingInterval.current);
        fallbackPollingInterval.current = null;
      }
      if (battleStatusInterval.current) {
        clearInterval(battleStatusInterval.current);
        battleStatusInterval.current = null;
      }
      
      // Fetch detailed results from the API
      try {
        const detailedResults = await battleService.getBattleResults(battleId);
        console.log('Fetched detailed results:', detailedResults);
        setBattleResults(detailedResults);
      } catch (error) {
        console.error('Failed to fetch battle results:', error);
        // Fallback to message data if API call fails
        const results = message.results || message.battle || message;
        setBattleResults(results);
      }
      
      setBattleState('completed');
      return;
    }
    
    // Handle opponent actions - KEY PART FOR OPPONENT UPDATES
    if (message.type === 'opponent_answered' || 
        message.type === 'OPPONENT_ANSWERED' ||
        message.type === 'opponent_activity' ||
        message.type === 'OPPONENT_ACTIVITY') {
      console.log('=== OPPONENT ANSWERED - UPDATING STATE ===');
      console.log('Opponent answered message data:', message);
      console.log('Both answered flag:', message.both_answered);
      
      // Update opponent score if provided
      if (message.points_earned !== undefined) {
        setOpponentScore(prev => prev + message.points_earned);
      }
      
      // Force update with timestamp to ensure re-render
      setOpponentAnswered({
        ...message,
        timestamp: Date.now(),
        received_at: new Date().toISOString(),
        source: 'websocket'
      });
      setLastOpponentCheck(Date.now());
      return;
    }
    
    if (message.type === 'question_completed' || 
        message.type === 'QUESTION_COMPLETED') {
      console.log('=== QUESTION COMPLETED ===');
      console.log('Question completed message data:', message);
      console.log('WebSocket connected status:', wsConnected);
      console.log('Current user ID:', user?.id);
      setQuestionCompleted({
        ...message,
        timestamp: Date.now()
      });
      return;
    }
    
    // Log unhandled messages for debugging
    console.log('Unhandled WebSocket message type:', message.type);
  }, [fetchBattleQuestions]);

  // Function to register all WebSocket handlers
  const registerWebSocketHandlers = useCallback(() => {
    if (user?.id) {
      console.log('=== REGISTERING WEBSOCKET HANDLERS (called from connection listener) ===');
      
      // Register handlers for specific message types
      addMessageHandler('BATTLE_STARTED', handleWebSocketMessage);
      addMessageHandler('BATTLE_ACCEPTED', handleWebSocketMessage);
      addMessageHandler('PLAYER_JOINED', handleWebSocketMessage);
      addMessageHandler('ROOM_JOINED', handleWebSocketMessage);
      addMessageHandler('OPPONENT_JOINED', handleWebSocketMessage);
      addMessageHandler('BATTLE_READY', handleWebSocketMessage);
      addMessageHandler('BATTLE_COMPLETED', handleWebSocketMessage);
      addMessageHandler('battle_completed', handleWebSocketMessage);
      addMessageHandler('opponent_answered', handleWebSocketMessage);
      addMessageHandler('OPPONENT_ANSWERED', handleWebSocketMessage);
      addMessageHandler('opponent_activity', handleWebSocketMessage);
      addMessageHandler('OPPONENT_ACTIVITY', handleWebSocketMessage);
      addMessageHandler('question_completed', handleWebSocketMessage);
      addMessageHandler('QUESTION_COMPLETED', handleWebSocketMessage);
      
      console.log('=== ALL WEBSOCKET HANDLERS REGISTERED (from connection listener) ===');
    }
  }, [user?.id, addMessageHandler, handleWebSocketMessage]);

  // Set up WebSocket message handling
  useEffect(() => {
    if (wsConnected && user?.id) {
      registerWebSocketHandlers();
    }
  }, [wsConnected, user?.id, registerWebSocketHandlers]);

  // Set up connection listener to re-register handlers on reconnect
  useEffect(() => {
    if (user?.id) {
      console.log('=== SETTING UP CONNECTION LISTENER ===');
      addConnectionListener(registerWebSocketHandlers);
      
      return () => {
        console.log('=== CLEANING UP CONNECTION LISTENER ===');
        removeConnectionListener(registerWebSocketHandlers);
      };
    }
  }, [user?.id, addConnectionListener, removeConnectionListener, registerWebSocketHandlers]);

  // Fallback polling for opponent activity when WebSocket is down
  useEffect(() => {
    if (battleState === 'playing' && !wsConnected && battleId) {
      console.log('=== STARTING FALLBACK POLLING (WebSocket disconnected) ===');
      
      // Check immediately
      checkOpponentActivity();
      
      // Then poll every 2 seconds
      fallbackPollingInterval.current = setInterval(checkOpponentActivity, 2000);
      
      return () => {
        if (fallbackPollingInterval.current) {
          console.log('=== STOPPING FALLBACK POLLING ===');
          clearInterval(fallbackPollingInterval.current);
          fallbackPollingInterval.current = null;
        }
      };
    }
  }, [battleState, wsConnected, checkOpponentActivity]);

  // Battle status polling when waiting
  useEffect(() => {
    if (battleState === 'waiting' && battleId && battleId !== 'undefined') {
      console.log('=== STARTING BATTLE STATUS POLLING ===');
      
      const pollBattleStatus = async () => {
        try {
          const battleStatus = await battleService.getBattleStatus(battleId);
          console.log('Polled battle status:', battleStatus.status);
          
          if (battleStatus.status === 'active') {
            console.log('Battle status changed to active, transitioning to playing');
            setBattleState('playing');
            const battle = await battleService.getBattleById(battleId);
            setBattleData(battle);
            fetchBattleQuestions();
          } else if (battleStatus.status === 'completed') {
            console.log('Battle completed during waiting, transitioning to completed state');
            setBattleState('completed');
            const battle = await battleService.getBattleById(battleId);
            setBattleData(battle);
            setBattleResults(battle);
          }
        } catch (error) {
          console.error('Failed to poll battle status:', error);
        }
      };
      
      // Check immediately
      pollBattleStatus();
      
      // Then poll every 2 seconds
      battleStatusInterval.current = setInterval(pollBattleStatus, 2000);
      
      return () => {
        if (battleStatusInterval.current) {
          console.log('=== STOPPING BATTLE STATUS POLLING ===');
          clearInterval(battleStatusInterval.current);
          battleStatusInterval.current = null;
        }
      };
    }
  }, [battleState, battleId, fetchBattleQuestions]);

  // Debug effect for opponent answers
  useEffect(() => {
    if (opponentAnswered) {
      console.log('=== OPPONENT ANSWERED STATE UPDATED ===');
      console.log('New opponentAnswered value:', opponentAnswered);
      console.log('Timestamp:', opponentAnswered.timestamp);
      console.log('Source:', opponentAnswered.source);
    }
  }, [opponentAnswered]);

  // Debug effect to log all WebSocket messages
  useEffect(() => {
    console.log('=== WEBSOCKET CONNECTION STATUS ===');
    console.log('Connected:', wsConnected);
    console.log('User ID:', user?.id);
    console.log('Battle ID:', battleId);
  }, [wsConnected, user?.id, battleId]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/auth');
      }
    };
    fetchUser();
  }, [router]);

  // Fetch battle data
  useEffect(() => {
    if (battleId && user && battleId !== 'undefined') {
      console.log('Fetching battle data for ID:', battleId);
      fetchBattleData();
    }
  }, [battleId, user]);

  const fetchBattleData = async () => {
    if (!battleId || battleId === 'undefined') {
      console.error('Invalid battle ID:', battleId);
      setError('Invalid battle ID');
      return;
    }
    
    try {
      setError(null);
      
      // Get battle status for quick state determination
      const battleStatus = await battleService.getBattleStatus(battleId);
      console.log('Initial battle status:', battleStatus.status);
      
      // Get full battle data
      const battle = await battleService.getBattleById(battleId);
      setBattleData(battle);
      
      if (battleStatus.status === 'pending') {
        setBattleState('waiting');
      } else if (battleStatus.status === 'active') {
        setBattleState('playing');
        fetchBattleQuestions();
      } else if (battleStatus.status === 'completed') {
        setBattleState('completed');
        setBattleResults(battle);
      }
    } catch (error) {
      console.error('Failed to fetch battle data:', error);
      setError('Failed to load battle data');
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: string) => {
    try {
      console.log('=== SUBMITTING ANSWER ===');
      console.log('Question ID:', questionId);
      console.log('Answer:', answer);
      
      const userTimeSpent = getCurrentQuestionTime();
      console.log('User time spent:', userTimeSpent, 'seconds');
      
      const response = await battleService.submitAnswer({
        battle_id: battleId,
        question_id: questionId,
        user_answer: answer,
        time_taken_seconds: userTimeSpent
      });
      
      console.log('=== USER ANSWER SUBMITTED ===');
      console.log('Answer response:', response);
      
      // Update current user's score if points were earned
      if (response && response.points_earned !== undefined) {
        setCurrentScore(prev => prev + response.points_earned);
      }
      
      // Reset timer
      setCurrentQuestionStartTime(null);
      setAccumulatedTime(0);
      setIsPaused(false);
      
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleBattleComplete = async (results: any) => {
    console.log('=== BATTLE COMPLETED ===');
    console.log('Results:', results);
    
    // Clean up intervals
    if (fallbackPollingInterval.current) {
      clearInterval(fallbackPollingInterval.current);
      fallbackPollingInterval.current = null;
    }
    if (battleStatusInterval.current) {
      clearInterval(battleStatusInterval.current);
      battleStatusInterval.current = null;
    }
    
    // Fetch detailed results from the API
    try {
      const detailedResults = await battleService.getBattleResults(battleId);
      console.log('Fetched detailed results:', detailedResults);
      setBattleResults(detailedResults);
    } catch (error) {
      console.error('Failed to fetch battle results:', error);
      // Fallback to provided results if API call fails
      setBattleResults(results);
    }
    
    setBattleState('completed');
  };

  const handleCancelBattle = async () => {
    try {
      // Clean up intervals
      if (fallbackPollingInterval.current) {
        clearInterval(fallbackPollingInterval.current);
        fallbackPollingInterval.current = null;
      }
      if (battleStatusInterval.current) {
        clearInterval(battleStatusInterval.current);
        battleStatusInterval.current = null;
      }
      
      router.push('/battle');
    } catch (error) {
      console.error('Failed to cancel battle:', error);
    }
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (fallbackPollingInterval.current) {
        clearInterval(fallbackPollingInterval.current);
      }
      if (battleStatusInterval.current) {
        clearInterval(battleStatusInterval.current);
      }
    };
  }, []);

  // Render logic
  if (battleState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading battle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/battle')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Battle Hub
          </button>
        </div>
      </div>
    );
  }

  if (battleState === 'waiting') {
    return (
      <BattleWaitingScreen
        battleId={battleId}
        opponentUsername={battleData?.opponent_username}
        roomCode={battleData?.room_code}
        isPublic={battleData?.is_public}
        onCancel={handleCancelBattle}
        wsConnected={wsConnected}
      />
    );
  }

  if (battleState === 'playing' && questions.length > 0) {
    return (
      <BattleGameScreen
        battleId={battleId}
        questions={questions}
        onAnswerSubmit={handleAnswerSubmit}
        onBattleComplete={handleBattleComplete}
        onOpponentAnswered={opponentAnswered}
        onQuestionCompleted={questionCompleted}
        onQuestionStart={startQuestionTimer}
        onTimerPause={pauseQuestionTimer}
        onTimerResume={resumeQuestionTimer}
        getCurrentTime={getCurrentQuestionTime}
        currentScore={currentScore}
        opponentScore={opponentScore}
      />
    );
  }

  if (battleState === 'completed') {
    return (
      <BattleResultsScreen
        results={battleResults}
        onBackToHub={() => router.push('/battle')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-300">Unknown battle state: {battleState}</p>
        <button
          onClick={() => router.push('/battle')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
        >
          Back to Battle Hub
        </button>
      </div>
    </div>
  );
};

export default BattlePage;