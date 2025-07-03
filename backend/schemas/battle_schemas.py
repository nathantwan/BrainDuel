from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID

class CreateBattleRequest(BaseModel):
    # Make opponent optional for room-code system
    opponent_username: Optional[str] = Field(
        None,
        description="Leave empty for public battles (use room codes)"
    )
    class_folder_id: str
    total_questions: int
    time_limit_seconds: int
    is_public: bool = Field(
        False, 
        description="True=anyone can join with room code, False=private battle"
    )

class BattleResponse(BaseModel):
    id: str
    challenger_username: str
    opponent_username: Optional[str]  # Now optional
    class_folder_name: str
    battle_status: str
    total_questions: int
    time_limit_seconds: int
    challenger_score: Optional[int] = None
    opponent_score: Optional[int] = None
    created_at: datetime
    
    # New fields
    room_code: Optional[str] = Field(
        None,
        description="Present only for public battles",
        min_length=6,
        max_length=6
    )
    is_public: bool = False

class SubmitAnswerRequest(BaseModel):
    battle_id: str
    question_id: str
    user_answer: str
    time_taken_seconds: int

# New schema for joining battles
class JoinBattleRequest(BaseModel):
    room_code: str = Field(..., min_length=6, max_length=6)
    
class PendingInvite(BaseModel):
    id: str
    user_id: str
    battle_id: str
    invite_data: dict
    created_at: datetime
    is_read: bool