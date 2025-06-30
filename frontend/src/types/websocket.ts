// types/websocket.ts
import type { Battle, BattleQuestion, BattleResult } from './battle';

// Server -> Client Messages
export type IncomingMessage = 
  | {
      type: 'BATTLE_INVITATION';
      battle: Battle;
    }
  | {
      type: 'PUBLIC_BATTLE_CREATED';
      room_code: string;
      battle: Battle;
    }
  | {
      type: 'BATTLE_STARTED';
      battle_id: string;
      questions?: BattleQuestion[]; // Optional since questions may be fetched via HTTP
    }
  | {
      type: 'OPPONENT_JOINED';
      battle_id: string;
      user_id: string;
    }
  | {
      type: 'OPPONENT_ANSWERED';
      battle_id: string;
      question_id: string;
      is_correct: boolean;
      points_earned: number;
    }
  | {
      type: 'BATTLE_COMPLETED';
      battle_id: string;
      winner_id?: string;
      scores: {
        challenger: number;
        opponent: number;
      };
      completed_at: string;
      questions: BattleQuestion[];
      responses: {
        user_id: string;
        question_id: string;
        user_answer: string;
        is_correct: boolean;
        points_earned: number;
        time_taken_seconds: number;
      }[];
    }
  | {
      type: 'ERROR';
      message: string;
      code: string;
    };

// Client -> Server Messages
export type OutgoingMessage =
  | {
      type: 'ACCEPT_BATTLE';
      battle_id: string;
      user_id: string;
    }
  | {
      type: 'DECLINE_BATTLE';
      battle_id: string;
      user_id: string;
    }
  | {
      type: 'JOIN_BATTLE';
      room_code: string;
      user_id: string;
    }
  | {
      type: 'SUBMIT_ANSWER';
      battle_id: string;
      question_id: string;
      user_answer: string;
      time_taken_seconds: number;
    }
  | {
      type: 'REQUEST_QUESTIONS';
      battle_id: string;
    }
  | {
      type: 'PING';
    };

// Combined type for general handlers
export type WebSocketMessage = IncomingMessage | OutgoingMessage;