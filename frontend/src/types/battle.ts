export interface Battle {
  id: string;
  challenger_username: string;
  opponent_username?: string;
  class_folder_name: string;
  battle_status: 'pending' | 'active' | 'completed' | 'declined';
  total_questions: number;
  time_limit_seconds: number;
  challenger_score?: number;
  opponent_score?: number;
  created_at: string;
  room_code?: string;
  is_public: boolean;
}

export interface CreateBattleRequest {
  class_folder_id: string;
  total_questions: number;
  time_limit_seconds: number;
  is_public: boolean;
}

export interface SubmitAnswerRequest {
  battle_id: string;
  question_id: string;
  user_answer: string;
  time_taken_seconds: number;
}

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  time_limit_seconds: number;
}

export interface BattleResult {
  battle_id: string;
  winner_id?: string;
  challenger_score: number;
  opponent_score: number;
  total_questions: number;
  completed_at: string;
}

export interface BattleStatus {
  battle_id: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  challenger_id: string;
  opponent_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  winner_id: string | null;
}



export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
