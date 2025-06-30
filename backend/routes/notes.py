from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timedelta

from models import TempNote, ClassFolder, Question
from services.note_processor import NoteProcessor
from services.question_generator import QuestionGenerator
from database import get_db
from services import upload_notes, generate_questions, cleanup_expired_notes

router = APIRouter(prefix="/notes", tags=["notes"])

# route to upload notes to a class folder for processing
@router.post("/upload/{folder_id}")
async def upload_notes_route(
    folder_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
   return await upload_notes(folder_id, files, db)

# route to generate questions from uploaded notes in a class folder
@router.post("/generate-questions/{folder_id}")
async def generate_questions_route(
    folder_id: str,
    question_count: int = 10,
    difficulty: str = "medium",
    db: Session = Depends(get_db)
): 
    return await generate_questions(folder_id, question_count, difficulty, db)

# route to cleanup expired notes from the database
@router.delete("/cleanup-expired")
async def cleanup_expired_notes_route(
    db: Session = Depends(get_db)
):
    return await cleanup_expired_notes(db)

@router.get("/questions/review")
async def review_questions_route(
    folder: str,  # This will capture the query parameter
    db: Session = Depends(get_db)
):
    # Your logic to fetch questions for review
    questions = db.query(Question).filter(
        Question.folder_id == folder
    ).all()
    return questions