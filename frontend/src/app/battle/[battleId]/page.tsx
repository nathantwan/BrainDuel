'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBattleWebSocket } from '../../../hooks/use-battlewebsocket';
import { battleService } from '../../../services/battle';
import { authService } from '../../../services/auth';
import BattleWaitingScreen from '../../../components/quiz/BattleWaitingScreen';
import BattleGameScreen from '../../../components/quiz/BattleGameScreen';

type BattleState = 'waiting' | 'loading' | 'playing' | 'completed';

const BattlePage = () => {
  const params = useParams();
  const router = useRouter();
  const battleId = params.battleId as string;
  
  const [battleState, setBattleState] = useState<BattleState>('loading');
  const [battleData, setBattleData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const {
    isConnected: wsConnected,
    lastMessage,
  } = useBattleWebSocket({
    userId: user?.id || '',
    onBattleStarted: (data) => {
      console.log('Battle started:', data);
      setBattleState('playing');
      fetchBattleQuestions();
    },
    onBattleAccepted: (data) => {
      console.log('Battle accepted:', data);
      setBattleState('playing');
      fetchBattleQuestions();
    },
    onBattleCompleted: (data) => {
      console.log('Battle completed:', data);
      setBattleState('completed');
    }
  });

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
    if (battleId && user) {
      fetchBattleData();
    }
  }, [battleId, user]);

  // Listen for WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('WebSocket message received:', lastMessage);
      
      if (lastMessage.type === 'BATTLE_STARTED' || lastMessage.type === 'BATTLE_ACCEPTED') {
        setBattleState('playing');
        fetchBattleQuestions();
      } else if (lastMessage.type === 'BATTLE_COMPLETED') {
        setBattleState('completed');
      }
    }
  }, [lastMessage]);

  const fetchBattleData = async () => {
    try {
      setError(null);
      const battle = await battleService.getBattleById(battleId);
      setBattleData(battle);
      
      // Determine initial state based on battle status
      if (battle.battle_status === 'pending') {
        setBattleState('waiting');
      } else if (battle.battle_status === 'active') {
        setBattleState('playing');
        fetchBattleQuestions();
      } else if (battle.battle_status === 'completed') {
        setBattleState('completed');
      }
    } catch (error) {
      console.error('Failed to fetch battle data:', error);
      setError('Failed to load battle data');
    }
  };

  const fetchBattleQuestions = async () => {
    try {
      const questionsData = await battleService.getBattleQuestions(battleId);
      setQuestions(questionsData.questions || []);
    } catch (error) {
      console.error('Failed to fetch battle questions:', error);
      setError('Failed to load battle questions');
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: string, timeTaken: number) => {
    try {
      await battleService.submitAnswer({
        battle_id: battleId,
        question_id: questionId,
        user_answer: answer,
        time_taken_seconds: timeTaken
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleBattleComplete = (results: any) => {
    console.log('Battle completed with results:', results);
    setBattleState('completed');
  };

  const handleCancelBattle = async () => {
    try {
      // You might want to add a cancel battle endpoint
      router.push('/battle');
    } catch (error) {
      console.error('Failed to cancel battle:', error);
    }
  };

  // Loading state
  if (battleState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battle...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
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

  // Waiting state
  if (battleState === 'waiting') {
    return (
      <BattleWaitingScreen
        battleId={battleId}
        opponentUsername={battleData?.opponent_username}
        onCancel={handleCancelBattle}
      />
    );
  }

  // Playing state
  if (battleState === 'playing' && questions.length > 0) {
    return (
      <BattleGameScreen
        battleId={battleId}
        questions={questions}
        onAnswerSubmit={handleAnswerSubmit}
        onBattleComplete={handleBattleComplete}
      />
    );
  }

  // Completed state
  if (battleState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Battle Complete!</h2>
          <p className="text-gray-600 mb-4">Results will be available soon.</p>
          <button
            onClick={() => router.push('/battle')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Battle Hub
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Unknown battle state</p>
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