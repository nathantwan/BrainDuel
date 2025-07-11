from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from uuid import UUID

class FolderVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class CreateFolderRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    university_name: Optional[str] = Field(None, max_length=100)
    course_code: Optional[str] = Field(None, max_length=20)
    is_public: bool = False

class FolderResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    university_name: Optional[str]
    course_code: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime
    user_id: str
    question_count: Optional[int] = 0

    class Config:
        from_attributes = True

class UpdateFolderRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    university_name: Optional[str] = Field(None, max_length=100)
    course_code: Optional[str] = Field(None, max_length=20)
    is_public: Optional[bool] = None

class FolderListResponse(BaseModel):
    folders: List[FolderResponse]
    total: int

    class Config:
        from_attributes = True

class QuestionOptionResponse(BaseModel):
    id: UUID
    option_letter: str
    option_text: str
    is_correct: bool

    class Config:
        from_attributes = True

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
        from_attributes = True
