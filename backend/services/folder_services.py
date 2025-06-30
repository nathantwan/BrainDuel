from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from models import ClassFolder
from schemas import CreateFolderRequest, FolderResponse
from services.auth import get_current_user


async def create_folder(
    folder_data: CreateFolderRequest,
    db: Session,
    user_id: str
):
    """Create a new class folder"""
    folder = ClassFolder(
        owner_id=user_id,  
        name=folder_data.name,
        description=folder_data.description,
        course_code=folder_data.course_code,
        university_name=folder_data.university_name,
        is_public=folder_data.is_public
    )
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    return folder

async def get_public_folders(
    university: Optional[str],
    course: Optional[str],
    db: Session
):
    """Get public class folders"""
    query = db.query(ClassFolder).filter(ClassFolder.is_public == True)
    
    if university:
        query = query.filter(ClassFolder.university_name.ilike(f"%{university}%"))
    if course:
        query = query.filter(ClassFolder.name.ilike(f"%{course}%"))
    
    return query.all()

async def get_my_folders(
    db: Session,
    user_id: str
):
    """Get current user's folders"""
    return db.query(ClassFolder).filter(ClassFolder.owner_id == user_id).all()