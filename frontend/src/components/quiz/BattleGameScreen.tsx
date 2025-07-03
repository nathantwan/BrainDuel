import React, { useState, useEffect } from 'react';
import { Clock, Trophy, User } from 'lucide-react';

interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  time_limit_seconds: number;
}

interface BattleGameScreenProps {
  battleId: string;
  questions: BattleQuestion[];
  onAnswerSubmit: (questionId: string, answer: string, timeTaken: number) => void;
  onBattleComplete?: (results: any) => void;
}

const BattleGameScreen: React.FC<BattleGameScreenProps> = ({
  battleId,
  questions,
  onAnswerSubmit,
  onBattleComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<{[key: string]: {answer: string, timeTaken: number}}>({});

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize timer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setTimeRemaining(currentQuestion.time_limit_seconds);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  }, [currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isAnswered) {
      // Time's up - auto-submit
      handleAnswerSubmit(null);
    }
  }, [timeRemaining, isAnswered]);

  const handleAnswerSubmit = (answer: string | null) => {
    if (isAnswered) return;
    
    const timeTaken = currentQuestion.time_limit_seconds - timeRemaining;
    const finalAnswer = answer || currentQuestion.options[0]; // Default to first option if no answer selected
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { answer: finalAnswer, timeTaken }
    }));
    
    setIsAnswered(true);
    
    // Submit answer
    onAnswerSubmit(currentQuestion.id, finalAnswer, timeTaken);
    
    // Move to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Battle complete
        if (onBattleComplete) {
          onBattleComplete({ answers, battleId });
        }
      }
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Battle Complete!</h2>
          <p className="text-gray-600">Calculating results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-500">
                Battle #{battleId.slice(0, 8)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-red-500" />
              <span className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
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
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${isAnswered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              >
                <span className="font-medium text-gray-900">{option}</span>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          {!isAnswered && (
            <div className="mt-6 text-center">
              <button
                onClick={() => handleAnswerSubmit(selectedAnswer)}
                disabled={!selectedAnswer}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Submit Answer
              </button>
            </div>
          )}

          {/* Answer Feedback */}
          {isAnswered && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-center text-gray-600">
                {selectedAnswer === currentQuestion.correct_answer 
                  ? "✅ Correct!" 
                  : `❌ Incorrect. The correct answer was: ${currentQuestion.correct_answer}`
                }
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                {currentQuestionIndex < questions.length - 1 
                  ? "Moving to next question..." 
                  : "Battle complete! Calculating results..."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleGameScreen; 