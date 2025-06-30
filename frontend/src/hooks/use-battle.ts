import { useState, useEffect, useCallback } from 'react';
import { battleService } from '../services/battle';
import type { BattleQuestion, BattleResult } from '../types/battle';

export const useBattleGame = (battleId: string | null) => {
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<'loading' | 'playing' | 'completed' | 'error'>('loading');
  const [results, setResults] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!battleId) return;
    
    try {
      setGameStatus('loading');
      setError(null);
      const data = await battleService.getBattleQuestions(battleId);
      setQuestions(data);
      if (data.length > 0) {
        setTimeRemaining(data[0].time_limit);
        setGameStatus('playing');
      }
    } catch (err: any) {
      setError(err.message);
      setGameStatus('error');
    }
  }, [battleId]);

  const submitAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!battleId) return;

    try {
      await battleService.submitAnswer({
        battle_id: battleId,
        question_id: questionId,
        answer,
      });
      
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
      
      // Move to next question or complete game
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setTimeRemaining(questions[nextIndex].time_limit);
      } else {
        setGameStatus('completed');
        await fetchResults();
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [battleId, currentQuestionIndex, questions]);

  const fetchResults = useCallback(async () => {
    if (!battleId) return;
    
    try {
      const data = await battleService.getBattleResults(battleId);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [battleId]);

  const skipQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeRemaining(questions[nextIndex].time_limit);
    } else {
      setGameStatus('completed');
      fetchResults();
    }
  }, [currentQuestionIndex, questions, fetchResults]);

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          skipQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, timeRemaining, skipQuestion]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentQuestion = questions[currentQuestionIndex];

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    answers,
    timeRemaining,
    gameStatus,
    results,
    error,
    submitAnswer,
    skipQuestion,
    fetchResults,
  };
};