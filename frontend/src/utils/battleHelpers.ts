import type { BattleResponse, BattleResults } from '../types/battle'

export function getBattleStatus(battle: BattleResponse): {
  status: string;
  canAccept: boolean;
  canStart: boolean;
  canCancel: boolean;
} {
  switch (battle.status) {
    case 'pending':
      return {
        status: 'Waiting for opponent',
        canAccept: !battle.opponent_id,
        canStart: false,
        canCancel: true
      }
    case 'active':
      return {
        status: 'In progress',
        canAccept: false,
        canStart: true,
        canCancel: false
      }
    case 'completed':
      return {
        status: 'Completed',
        canAccept: false,
        canStart: false,
        canCancel: false
      }
    default:
      return {
        status: 'Unknown',
        canAccept: false,
        canStart: false,
        canCancel: false
      }
  }
}

export function formatTimeRemaining(timeLimit: number, startTime: string): string {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const elapsed = now - start
  const remaining = Math.max(0, (timeLimit * 1000) - elapsed)
  
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function calculateScore(answers: any[], totalQuestions: number): {
  score: number;
  percentage: number;
  correctAnswers: number;
} {
  const correctAnswers = answers.filter(answer => answer.is_correct).length
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  
  return {
    score: correctAnswers,
    percentage: Math.round(percentage * 100) / 100,
    correctAnswers
  }
}

export function getBattleWinner(results: BattleResults): {
  winnerId: string | null;
  isDraw: boolean;
  winnerScore: number;
  loserScore: number;
} {
  const { creator_score, opponent_score } = results
  
  if (creator_score === opponent_score) {
    return {
      winnerId: null,
      isDraw: true,
      winnerScore: creator_score,
      loserScore: opponent_score
    }
  }
  
  const winnerId: string | null = creator_score > opponent_score 
  ? results.battle_id 
  : results.winner_id ?? null

  
  return {
    winnerId,
    isDraw: false,
    winnerScore: Math.max(creator_score, opponent_score),
    loserScore: Math.min(creator_score, opponent_score)
  }
}