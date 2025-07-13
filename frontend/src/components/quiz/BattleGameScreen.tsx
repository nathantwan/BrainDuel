import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Trophy, User } from 'lucide-react';
import type { BattleGameScreenProps } from '../../types/ui';

const BattleGameScreen: React.FC<BattleGameScreenProps> = ({
  battleId,
  questions,
  onAnswerSubmit,
  onBattleComplete,
  onOpponentAnswered,
  onQuestionCompleted,
  onQuestionStart,
  onTimerPause,
  onTimerResume,
  getCurrentTime,
  currentScore = 0,
  opponentScore = 0
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [bothAnswered, setBothAnswered] = useState(false);
  const [answers, setAnswers] = useState<{[key: string]: {answer: string, timeTaken: number}}>({});
  const [displayTime, setDisplayTime] = useState<number>(0);

  const currentQuestion = questions[currentQuestionIndex];

  // Update display time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (getCurrentTime) {
        setDisplayTime(getCurrentTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getCurrentTime]);

  // Reset state when question changes
  useEffect(() => {
    if (currentQuestion) {
      console.log('=== RESETTING UI STATE FOR QUESTION:', currentQuestionIndex + 1, '===');
      setSelectedAnswer(null);
      setIsAnswered(false);
      setOpponentAnswered(false);
      setBothAnswered(false);
      setDisplayTime(0);
      
      // Start timer for new question
      if (onQuestionStart) {
        onQuestionStart();
      }
    }
  }, [currentQuestion?.id, currentQuestionIndex, onQuestionStart]);

  const handleAnswerSubmit = useCallback((answer: string | null) => {
    if (isAnswered) {
      console.log('Answer submit blocked - already answered');
      return;
    }
    
    console.log('=== SUBMITTING ANSWER FROM UI ===');
    console.log('Selected answer:', answer);
    console.log('Question:', currentQuestionIndex + 1);
    
    const finalAnswer = answer || currentQuestion.options[0];
    const timeTaken = getCurrentTime ? getCurrentTime() : 0;
    
    // Update local answers state for display
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { answer: finalAnswer, timeTaken }
    }));
    
    // Mark as answered
    setIsAnswered(true);
    
    // Pause timer since we're now waiting for opponent
    if (onTimerPause) {
      onTimerPause();
    }
    
    // Submit answer to parent
    onAnswerSubmit(currentQuestion.id, finalAnswer);
    
  }, [currentQuestion, currentQuestionIndex, onAnswerSubmit, isAnswered, getCurrentTime, onTimerPause]);

  // Handle opponent answered message
  useEffect(() => {
    if (onOpponentAnswered) {
      console.log('Opponent answered message received:', onOpponentAnswered);
      console.log('Current question ID:', currentQuestion?.id);
      
      // Check if this is for the current question
      if (onOpponentAnswered.question_id === currentQuestion?.id) {
        console.log('Opponent answered for current question');
        setOpponentAnswered(true);
        
        // Only move to next question if we receive the question_completed message
        // Don't auto-advance based on opponent_answered alone
        console.log('Opponent answered - waiting for question_completed message');
      }
    }
  }, [onOpponentAnswered, currentQuestion?.id]);

  // Handle question completed message (primary method for synchronization)
  useEffect(() => {
    if (onQuestionCompleted) {
      console.log('Question completed message received:', onQuestionCompleted);
      console.log('Current question ID:', currentQuestion?.id);
      console.log('Question completed question ID:', onQuestionCompleted.question_id);
      
      // Check if this is for the current question
      if (onQuestionCompleted.question_id === currentQuestion?.id) {
        console.log('Question completed for current question');
        setBothAnswered(true);
        // Move to next question after delay
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            console.log('Moving to next question after completion:', currentQuestionIndex + 1);
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            console.log('Battle complete after question completion');
            // Battle complete
            if (onBattleComplete) {
              onBattleComplete({ answers, battleId });
            }
          }
        }, 2000);
      } else {
        console.log('Question completed message is for different question');
      }
    }
  }, [onQuestionCompleted, currentQuestion?.id, currentQuestionIndex, questions.length, onBattleComplete, answers, battleId]);

  // Debug effect for question completed prop changes
  useEffect(() => {
    console.log('=== QUESTION COMPLETED PROP CHANGED ===');
    console.log('onQuestionCompleted:', onQuestionCompleted);
    console.log('Current question ID:', currentQuestion?.id);
    if (onQuestionCompleted) {
      console.log('Question completed question ID:', onQuestionCompleted.question_id);
      console.log('Question IDs match:', onQuestionCompleted.question_id === currentQuestion?.id);
    }
  }, [onQuestionCompleted, currentQuestion?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Battle Complete!</h2>
          <p className="text-gray-300">Calculating results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-300">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-400">
                Battle #{battleId.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-lg font-bold text-white">
                {formatTime(displayTime)}
              </span>
              <span className="text-sm text-gray-400">
                (Your thinking time)
              </span>
            </div>
          </div>
          
          {/* Score Display */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">You:</span>
                <span className="text-lg font-bold text-blue-400">{currentScore}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Opponent:</span>
                <span className="text-lg font-bold text-red-400">{opponentScore}</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {currentScore > opponentScore ? 'You\'re leading!' : 
               opponentScore > currentScore ? 'Opponent is leading' : 
               'Tied!'}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">
            {currentQuestion.question}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isAnswered && setSelectedAnswer(option)}
                disabled={isAnswered}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-900 text-white'
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 bg-gray-800'
                } ${isAnswered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <span className="font-medium text-gray-100">{option}</span>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          {!isAnswered && (
            <div className="mt-6 text-center">
              <button
                onClick={() => handleAnswerSubmit(selectedAnswer)}
                disabled={!selectedAnswer}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Submit Answer
              </button>
            </div>
          )}

          {/* Answer Feedback */}
          {isAnswered && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <p className="text-center text-gray-200">
                {selectedAnswer === currentQuestion.correct_answer 
                  ? "✅ Correct!" 
                  : `❌ Incorrect. The correct answer was: ${currentQuestion.correct_answer}`
                }
              </p>
              
              {/* Show explanation when answer is wrong */}
              {selectedAnswer !== currentQuestion.correct_answer && currentQuestion.explanation && (
                <div className="mt-4 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                  <p className="text-sm font-medium text-blue-200 mb-1">Why this is the correct answer:</p>
                  <p className="text-sm text-blue-100">{currentQuestion.explanation}</p>
                </div>
              )}
              
              <p className="text-center text-sm text-gray-400 mt-2">
                {bothAnswered
                  ? (currentQuestionIndex < questions.length - 1 
                      ? "Moving to next question..." 
                      : "Battle complete! Calculating results...")
                  : "Waiting for opponent to answer..."
                }
              </p>
              {!bothAnswered && (
                <div className="mt-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  <span className="text-sm text-blue-400">Waiting for opponent...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">Progress</span>
            <span className="text-sm text-gray-400">{currentQuestionIndex + 1}/{questions.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
 
        {/* Player Status */}
        <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-blue-400 mr-2" />
                <span className="font-medium text-white">You</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                isAnswered ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
              }`}>
                {isAnswered ? 'Answered' : 'Answering...'}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-red-400 mr-2" />
                <span className="font-medium text-white">Opponent</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                opponentAnswered ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
              }`}>
                {opponentAnswered ? 'Answered' : 'Answering...'}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg text-xs mt-4">
          <h3 className="font-semibold mb-2 text-gray-200">Debug Info:</h3>
          <p className="text-gray-300"><strong>Current Question:</strong> {currentQuestionIndex + 1} (ID: {currentQuestion.id})</p>
          <p className="text-gray-300"><strong>User Answered:</strong> {isAnswered.toString()}</p>
          <p className="text-gray-300"><strong>Opponent Answered:</strong> {opponentAnswered.toString()}</p>
          <p className="text-gray-300"><strong>Both Answered:</strong> {bothAnswered.toString()}</p>
          <p className="text-gray-300"><strong>Display Time:</strong> {displayTime} seconds</p>
          <p className="text-gray-300"><strong>Selected Answer:</strong> {selectedAnswer || 'None'}</p>
        </div>
      </div>
    </div>
  );
};

export default BattleGameScreen;