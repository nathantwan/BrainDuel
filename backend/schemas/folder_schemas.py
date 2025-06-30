from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class CreateFolderRequest(BaseModel):
    name: str
    description: Optional[str] = None
    course_code: Optional[str] = None
    university_name: Optional[str] = None
    is_public: bool = False

class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    owner_id: UUID
    name: str
    description: Optional[str] = None
    course_code: Optional[str] = None
    university_name: Optional[str] = None
    question_count: int = 0
    is_public: bool
    created_at: datetime
    updated_at: datetime



class QuestionOptionResponse(BaseModel):
    id: UUID
    option_letter: str
    option_text: str
    is_correct: bool

    class Config:
        orm_mode = True


class QuestionResponse(BaseModel):
    id: UUID
    class_folder_id: UUID
    question_text: str
    question_type: str
    difficulty_level: str
    topic: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    points_value: int
    created_at: datetime
    options: Optional[List[QuestionOptionResponse]] = []  # Include options list

    class Config:
        orm_mode = True
