export interface Battle {
  id: string;
  challenger_id: string;
  opponent_id?: string;
  challenger_username: string;
  opponent_username?: string;
  battle_status: 'pending' | 'active' | 'completed' | 'declined';
  battle_type: 'public' | 'private';
  room_code?: string;
  class_folder_id: string;
  questions_count: number;
  time_limit: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBattleRequest {
  battle_type: 'public' | 'private';
  opponent_username?: string;
  class_folder_id: string;
  questions_count: number;
  time_limit: number;
}

export interface SubmitAnswerRequest {
  battle_id: string;
  question_id: string;
  answer: string;
}

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  time_limit: number;
}

export interface BattleResult {
  battle_id: string;
  winner_id?: string;
  challenger_score: number;
  opponent_score: number;
  total_questions: number;
  completed_at: string;
}

export interface PendingInvite {
  id: string;
  battle_id: string;
  challenger_username: string;
  class_folder_name: string;
  questions_count: number;
  time_limit: number;
  created_at: string;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
