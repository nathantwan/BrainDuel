import { LucideIcon } from 'lucide-react';
import type { BattleQuestion, BattleResult, CreateBattleRequest } from './battle';

// Battle State Types
export type BattleState = 'waiting' | 'loading' | 'playing' | 'completed';

// Input Field Types
export interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: LucideIcon;
  error?: string;
  hasPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

// Alert Message Types
export interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
}

// Battle Game Screen Types
export interface BattleGameScreenProps {
  battleId: string;
  questions: BattleQuestion[];
  onAnswerSubmit: (questionId: string, answer: string) => void;
  onBattleComplete?: (results: BattleResults) => void;
  onOpponentAnswered?: OpponentAnsweredMessage | null;
  onQuestionCompleted?: QuestionCompletedMessage | null;
  onQuestionStart?: () => void;
  onTimerPause?: () => void;
  onTimerResume?: () => void;
  getCurrentTime?: () => number;
  currentScore?: number;
  opponentScore?: number;
}

export interface BattleResults {
  answers: {[key: string]: {answer: string, timeTaken: number}};
  battleId: string;
  [key: string]: unknown;
}

export interface OpponentAnsweredMessage {
  question_id: string;
  opponent_answer: string;
  opponent_time_taken: number;
}

export interface QuestionCompletedMessage {
  question_id: string;
  correct_answer: string;
  challenger_score: number;
  opponent_score: number;
}

// Battle Waiting Screen Types
export interface BattleWaitingScreenProps {
  battleId: string;
  opponentUsername?: string;
  roomCode?: string;
  isPublic?: boolean;
  onCancel?: () => void;
  wsConnected?: boolean;
}

// Battle Results Screen Types
export interface BattleResultsScreenProps {
  results: BattleResult;
  onPlayAgain?: () => void;
  onBackToHub?: () => void;
}

// Create Battle Tab Types
export interface CreateBattleTabProps {
  onCreateBattle: (battleData: CreateBattleRequest) => Promise<any>;
  loading: boolean;
}

// Join Battle Tab Types
export interface JoinBattleTabProps {
  joinBattle: (roomCode: string) => Promise<any>;
  loading: boolean;
} 