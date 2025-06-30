from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
from database import get_db
from schemas import CreateFolderRequest, FolderResponse, QuestionResponse
from services import create_folder, get_public_folders, get_my_folders
from services.auth import get_current_user
from models import ClassFolder, User, Question

router = APIRouter(prefix="/folders", tags=["folders"])

# route to create class folder that holds generated questions
@router.post("/", response_model=FolderResponse)
async def create_class_folder(
    folder_data: CreateFolderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  
):
    """Create a new class folder"""
    try:

        folder = await create_folder(
            folder_data=folder_data,
            db=db,
            user_id=str(current_user.id)  
        )
        
        # Convert to Pydantic model for response
        return FolderResponse.from_orm(folder)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# route to get public class folders available to all users
@router.get("/public", response_model=List[FolderResponse])
async def get_public_class_folders(
    university: Optional[str] = Query(None, description="Filter by university"),
    course: Optional[str] = Query(None, description="Filter by course"),
    db: Session = Depends(get_db)
):
    """Get public class folders with optional filters"""
    try:

        folders = await get_public_folders(
            university=university,
            course=course,
            db=db
        )
        
        # Convert to list of Pydantic models
        return [FolderResponse.from_orm(folder) for folder in folders]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# route to get current user's class folders
@router.get("/my", response_model=List[FolderResponse])
async def get_my_class_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  
):
    """Get current user's folders"""
    try:

        folders = await get_my_folders(
            db=db,
            user_id=str(current_user.id) 
        )
        
        # Convert to list of Pydantic models
        return [FolderResponse.from_orm(folder) for folder in folders]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# route to get a specific folder by ID
@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder_by_id(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific folder by ID"""
    try:
        folder_uuid = uuid.UUID(folder_id)
        
        folder = db.query(ClassFolder).filter(ClassFolder.id == folder_uuid).first()
        
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Check if user has access (owner or public folder)
        if folder.owner_id != current_user.id and not folder.is_public:  # Direct UUID comparison
            raise HTTPException(status_code=403, detail="Access denied")
        
        return FolderResponse.from_orm(folder)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{folder_id}/questions", response_model=List[QuestionResponse])
async def get_questions_in_folder(
    folder_id: str,
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    question_type: Optional[str] = Query(None, description="Filter by question type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all questions in a specific folder with optional filters"""
    try:
        # Validate folder ID format
        folder_uuid = uuid.UUID(folder_id)
        
        # Check folder exists and user has access
        folder = db.query(ClassFolder).filter(ClassFolder.id == folder_uuid).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
            
        if folder.owner_id != current_user.id and not folder.is_public:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Base query
        query = db.query(Question).filter(Question.class_folder_id == folder_uuid)
        
        # Apply filters if provided
        if difficulty:
            query = query.filter(Question.difficulty_level == difficulty.lower())
        if question_type:
            query = query.filter(Question.question_type == question_type)
        
        questions = query.order_by(Question.created_at.desc()).all()
        
        return questions
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))