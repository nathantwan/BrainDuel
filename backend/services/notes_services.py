import uuid
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List
from models import TempNote, ClassFolder, Question, QuestionOption
from .note_processor import NoteProcessor
from services.question_generator import QuestionGenerator
from database import get_db
from datetime import datetime, timedelta
async def upload_notes(
    folder_id: str,
    files: List[UploadFile],
    db: Session
):
    """Upload notes to a class folder for processing"""
    try:
        # Validate UUID format first
        try:
            folder_uuid = uuid.UUID(folder_id)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid folder ID format: {folder_id}")
        
        # Check if folder exists
        folder = db.query(ClassFolder).filter(ClassFolder.id == folder_uuid).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Class folder not found")
        
        processor = NoteProcessor()
        uploaded_notes = []
        
        for file in files:
            try:
                # Process and extract text
                content = await processor.process_file(file)
                
                # Get file size safely
                file_size = getattr(file, 'size', None)
                if file_size is None:
                    # Calculate size from content if not available
                    file_content = await file.read()
                    file_size = len(file_content)
                    # Reset file pointer
                    await file.seek(0)
                
                # Store in temp_notes
                temp_note = TempNote(
                    user_id=folder.owner_id,
                    class_folder_id=folder_uuid,
                    file_name=file.filename,
                    file_type=file.content_type,
                    content=content,
                    file_size=file_size
                )
                db.add(temp_note)
                uploaded_notes.append({
                    "filename": file.filename,
                    "size": file_size,
                    "type": file.content_type
                })
                
            except Exception as file_error:
                print(f"Error processing file {file.filename}: {file_error}")
                raise HTTPException(status_code=400, detail=f"Failed to process file {file.filename}: {str(file_error)}")
        
        db.commit()
        return {
            "message": f"Uploaded {len(files)} files successfully",
            "files": uploaded_notes,
            "folder_id": folder_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Upload service error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Test endpoint to create a folder for testing
async def create_test_folder(db: Session):
    """Create a test folder for development"""
    test_folder = ClassFolder(
        id=uuid.uuid4(),
        name="Test Folder",
        description="Test folder for API testing",
        owner_id=uuid.uuid4(),  # Mock user ID
        question_count=0
    )
    db.add(test_folder)
    db.commit()
    return {
        "folder_id": str(test_folder.id),
        "message": "Test folder created"
    }
    
async def generate_questions(
    folder_id: str,
    question_count: int,
    difficulty: str,
    db: Session
):
    """Generate questions from uploaded notes and delete the notes"""
    try:
        folder_uuid = uuid.UUID(folder_id)
        
        # Get all temp notes for this folder
        temp_notes = db.query(TempNote).filter(
            TempNote.class_folder_id == folder_uuid
        ).all()
        
        if not temp_notes:
            raise HTTPException(status_code=404, detail="No notes found to process")
        
        # Combine all note content
        combined_content = "\n\n".join([note.content for note in temp_notes])
        
        # Generate questions using AI
        generator = QuestionGenerator()
        generated_questions = await generator.generate_questions(
            content=combined_content,
            count=question_count,
            difficulty=difficulty
        )
        
        # Save questions to database
        saved_questions = []
        for q_data in generated_questions:
            question = Question(
                class_folder_id=folder_uuid,
                question_text=q_data["question"],
                question_type=q_data["type"],
                difficulty_level=difficulty,
                topic=q_data.get("topic"),
                correct_answer=q_data["correct_answer"],
                explanation=q_data.get("explanation"),
                points_value=q_data.get("points", 10)
            )
            db.add(question)
            db.flush()  # Get the question ID
            
            # Create options for all question types to make them compatible with battles
            if q_data["type"] == "multiple_choice" and "options" in q_data:
                # Multiple choice questions now have options as an array
                options = q_data["options"]
                if isinstance(options, list):
                    # Handle array format (new format)
                    for i, option_text in enumerate(options):
                        option_letter = chr(65 + i)  # A, B, C, D
                        is_correct = option_text == q_data["correct_answer"]
                        option = QuestionOption(
                            question_id=question.id,
                            option_letter=option_letter,
                            option_text=option_text,
                            is_correct=is_correct
                        )
                        db.add(option)
                elif isinstance(options, dict):
                    # Handle dict format (old format for backward compatibility)
                    for option_letter, option_text in options.items():
                        is_correct = option_letter == q_data["correct_answer"]
                        option = QuestionOption(
                            question_id=question.id,
                            option_letter=option_letter,
                            option_text=option_text,
                            is_correct=is_correct
                        )
                        db.add(option)
            elif q_data["type"] == "true_false":
                # Convert true/false to multiple choice with True/False options
                true_option = QuestionOption(
                    question_id=question.id,
                    option_letter="A",
                    option_text="True",
                    is_correct=(q_data["correct_answer"].lower() == "true")
                )
                false_option = QuestionOption(
                    question_id=question.id,
                    option_letter="B",
                    option_text="False",
                    is_correct=(q_data["correct_answer"].lower() == "false")
                )
                db.add(true_option)
                db.add(false_option)
            elif q_data["type"] == "short_answer":
                # Convert short answer to multiple choice with better options
                correct_answer = q_data["correct_answer"]
                # Create more meaningful options based on the correct answer
                options = [
                    correct_answer,
                    f"Not {correct_answer}",
                    "None of the above",
                    "All of the above"
                ]
                for i, option_text in enumerate(options):
                    option = QuestionOption(
                        question_id=question.id,
                        option_letter=chr(65 + i),  # A, B, C, D
                        option_text=option_text,
                        is_correct=(i == 0)  # First option (correct answer) is correct
                    )
                    db.add(option)
            
            saved_questions.append(question)
        
        # Update folder question count
        folder = db.query(ClassFolder).filter(ClassFolder.id == folder_uuid).first()
        folder.question_count += len(generated_questions)
        
        # Delete temp notes
        for note in temp_notes:
            db.delete(note)
        
        db.commit()
        
        return {
            "message": f"Generated {len(generated_questions)} questions successfully",
            "questions_generated": len(generated_questions),
            "folder_id": folder_id,
            "notes_processed": len(temp_notes)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def cleanup_expired_notes(
    db: Session
):
    """Clean up expired temporary notes"""
    expired_notes = db.query(TempNote).filter(
        TempNote.expires_at < datetime.utcnow()
    ).all()
    
    for note in expired_notes:
        db.delete(note)
    
    db.commit()
    return {"deleted": len(expired_notes)}