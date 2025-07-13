import React from 'react';
import { Trophy, Clock, Target, Award, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { BattleResultsScreenProps } from '../../types/ui';

const BattleResultsScreen: React.FC<BattleResultsScreenProps> = ({ results, onPlayAgain, onBackToHub }) => {
  const router = useRouter();
  
  // Determine if current user is challenger or opponent
  const isChallenger = results.challenger.username === 'You' || results.challenger.username === 'Current User';
  const currentPlayer = isChallenger ? results.challenger : results.opponent;
  const opponent = isChallenger ? results.opponent : results.challenger;
  
  // Determine winner information
  const isWinner = results.winner_id === currentUserId;
  const isTie = results.winner_reason === 'complete_tie';
  
  const getWinnerReasonText = (reason: string) => {
    switch (reason) {
      case 'higher_score':
        return 'Higher Score';
      case 'more_correct_answers':
        return 'More Correct Answers';
      case 'faster_average_time':
        return 'Faster Average Time';
      case 'complete_tie':
        return 'Complete Tie';
      default:
        return 'Unknown';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBackToHub}
            className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Battle Hub
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-500 mr-4" />
            <h1 className="text-4xl font-bold text-white">Battle Complete!</h1>
          </div>
          
          {/* Winner Announcement */}
          <div className="mb-6">
            {isTie ? (
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">It's a Tie!</h2>
                <p className="text-gray-300">Both players performed equally well</p>
              </div>
            ) : isWinner ? (
              <div className="bg-green-900 rounded-lg p-4 border border-green-700">
                <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 You Won! 🎉</h2>
                <p className="text-green-200">Congratulations on your victory!</p>
                <p className="text-green-300 text-sm mt-1">
                  Reason: {getWinnerReasonText(results.winner_reason)}
                </p>
              </div>
            ) : (
              <div className="bg-red-900 rounded-lg p-4 border border-red-700">
                <h2 className="text-2xl font-bold text-red-400 mb-2">Better Luck Next Time</h2>
                <p className="text-red-200">Keep practicing and try again!</p>
                <p className="text-red-300 text-sm mt-1">
                  Reason: {getWinnerReasonText(results.winner_reason)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Current Player */}
          <div className={`bg-gray-800 rounded-lg p-6 border-2 ${
            isWinner ? 'border-green-500' : isTie ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">You</h3>
              {isWinner && <Award className="w-6 h-6 text-green-400" />}
              {isTie && <Award className="w-6 h-6 text-yellow-400" />}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Score:</span>
                <span className="text-2xl font-bold text-white">{currentPlayer.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Accuracy:</span>
                <span className="text-white font-medium">{currentPlayer.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Correct:</span>
                <span className="text-white">{currentPlayer.correct_answers}/{currentPlayer.total_answers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Time:</span>
                <span className="text-white">{formatTime(currentPlayer.average_time)}</span>
              </div>
            </div>
          </div>

          {/* Opponent */}
          <div className={`bg-gray-800 rounded-lg p-6 border-2 ${
            !isWinner && !isTie ? 'border-green-500' : isTie ? 'border-yellow-500' : 'border-gray-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Opponent</h3>
              {!isWinner && !isTie && <Award className="w-6 h-6 text-green-400" />}
              {isTie && <Award className="w-6 h-6 text-yellow-400" />}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Score:</span>
                <span className="text-2xl font-bold text-white">{opponent.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Accuracy:</span>
                <span className="text-white font-medium">{opponent.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Correct:</span>
                <span className="text-white">{opponent.correct_answers}/{opponent.total_answers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Time:</span>
                <span className="text-white">{formatTime(opponent.average_time)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Statistics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-400" />
            Battle Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{results.total_questions}</div>
              <div className="text-sm text-gray-400">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {currentPlayer.correct_answers + opponent.correct_answers}
              </div>
              <div className="text-sm text-gray-400">Total Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round((currentPlayer.correct_answers + opponent.correct_answers) / (results.total_questions * 2) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {formatTime(Math.max(currentPlayer.total_time, opponent.total_time))}
              </div>
              <div className="text-sm text-gray-400">Longest Time</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBackToHub}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Users className="w-5 h-5 mr-2" />
            Back to Battle Hub
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <Target className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultsScreen; 