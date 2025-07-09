from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class UserStatsResponse(BaseModel):
    total_notes: int
    total_battles: int
    win_rate: float
    current_streak: int
    total_wins: int
    total_losses: int
    average_score: float
    best_score: int
    total_questions_answered: int
    correct_answers: int
    accuracy: float

class RecentActivityResponse(BaseModel):
    id: str
    type: str  # 'battle_victory', 'battle_defeat', 'notes_uploaded', 'battle_started'
    title: str
    description: str
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None 