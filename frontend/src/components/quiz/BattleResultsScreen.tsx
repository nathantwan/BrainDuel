import React from 'react';
import { Trophy, Clock, Target, Award, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import type { BattleResultsScreenProps } from '../../types/ui';

const BattleResultsScreen: React.FC<BattleResultsScreenProps> = ({ results, onPlayAgain, onBackToHub }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  
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

  const getScoreColor = (score: number) => {
    const percentage = (score / results.total_questions) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {isTie ? (
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 rounded-full">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            ) : isWinner ? (
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 rounded-full">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 rounded-full">
                <Award className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isTie ? 'It\'s a Tie!' : isWinner ? 'Victory!' : 'Defeat'}
          </h1>
          <p className="text-gray-300 text-lg">
            {isTie 
              ? 'Both players performed equally well!' 
              : isWinner 
                ? 'Congratulations! You won this battle!' 
                : 'Better luck next time!'
            }
          </p>
        </div>

        {/* Results Card */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Current Player */}
            <div className={`text-center p-6 rounded-xl border-2 ${
              isWinner ? 'border-green-500 bg-green-900/20' : 
              isTie ? 'border-yellow-500 bg-yellow-900/20' : 
              'border-gray-600 bg-gray-700/50'
            }`}>
              <div className="flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-400 mr-2" />
                <h3 className="text-xl font-bold text-white">You</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(currentPlayer.score)}`}>
                    {currentPlayer.score}/{results.total_questions}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Correct Answers</p>
                  <p className="text-xl font-semibold text-white">
                    {currentPlayer.correct_answers}/{results.total_questions}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Average Time</p>
                  <p className="text-lg font-medium text-white flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(currentPlayer.average_time_seconds)}
                  </p>
                </div>
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center p-6 rounded-xl border-2 border-gray-600 bg-gray-700/50">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-400 mr-2" />
                <h3 className="text-xl font-bold text-white">{opponent.username}</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(opponent.score, results.max_score)}`}>
                    {opponent.score}/{results.max_score}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Correct Answers</p>
                  <p className="text-xl font-semibold text-white">
                    {opponent.correct_answers}/{results.total_questions}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Average Time</p>
                  <p className="text-lg font-medium text-white flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(opponent.average_time_seconds)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Battle Summary */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm">Total Questions</p>
                <p className="text-xl font-semibold text-white">{results.total_questions}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Battle Duration</p>
                <p className="text-xl font-semibold text-white flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(results.battle_duration_seconds)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Winner Reason</p>
                <p className="text-lg font-medium text-blue-400">
                  {getWinnerReasonText(results.winner_reason)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
          >
            <Target className="h-5 w-5 mr-2" />
            Play Again
          </button>
          <button
            onClick={onBackToHub}
            className="border-2 border-gray-600 text-gray-300 px-8 py-3 rounded-xl font-semibold hover:border-gray-500 hover:bg-gray-800 transition-all flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleResultsScreen; 