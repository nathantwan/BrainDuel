from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from uuid import UUID
import uuid
import json
import logging
import random
import string

from schemas import CreateBattleRequest, SubmitAnswerRequest, BattleResponse
from models import Battle, BattleAnswerResponse, Question, User, ClassFolder
from database import get_db
from .auth import get_current_user
from .websocket_manager import manager

logger = logging.getLogger(__name__)

# ==================== HELPER FUNCTIONS ====================
def validate_battle_uuid(battle_id: str) -> UUID:
    """Validate and convert battle_id to UUID"""
    try:
        return UUID(battle_id)
    except ValueError:
        raise HTTPException(400, "Invalid battle ID format")

def validate_uuid(uuid_str: str, field_name: str = "ID") -> UUID:
    """Validate and convert any UUID string to UUID object"""
    try:
        return UUID(uuid_str)
    except ValueError:
        raise HTTPException(400, f"Invalid {field_name} format")

def generate_room_code() -> str:
    """Generate a unique 6-character room code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=6))

def battle_to_dict(battle: Battle) -> dict:
    """Convert Battle model instance to dictionary"""
    return {
        "id": str(battle.id),
        "challenger_id": str(battle.challenger_id),
        "opponent_id": str(battle.opponent_id) if battle.opponent_id else None,
        "class_folder_id": str(battle.class_folder_id),
        "battle_status": battle.battle_status,
        "total_questions": battle.total_questions,
        "time_limit_seconds": battle.time_limit_seconds,
        "challenger_score": battle.challenger_score,
        "opponent_score": battle.opponent_score,
        "room_code": battle.room_code,
        "is_public": battle.is_public,
        "created_at": battle.created_at.isoformat(),
        "started_at": battle.started_at.isoformat() if battle.started_at else None,
        "completed_at": battle.completed_at.isoformat() if battle.completed_at else None
    }

def create_battle_response(battle: Battle, challenger: User, opponent: User = None, folder: ClassFolder = None) -> BattleResponse:
    """Create a standardized BattleResponse object"""
    return BattleResponse(
        id=str(battle.id),
        challenger_username=challenger.username,
        opponent_username=opponent.username if opponent else None,
        class_folder_name=folder.name if folder else "",
        battle_status=battle.battle_status,
        total_questions=battle.total_questions,
        time_limit_seconds=battle.time_limit_seconds,
        challenger_score=battle.challenger_score,
        opponent_score=battle.opponent_score,
        created_at=battle.created_at,
        room_code=battle.room_code,
        is_public=getattr(battle, 'is_public', False)
    )

def get_battle_with_validation(battle_id: str, current_user: User, db: Session, allow_pending: bool = False) -> Battle:
    """Get battle with common validation logic"""
    battle_uuid = validate_battle_uuid(battle_id)
    battle = db.query(Battle).filter(Battle.id == battle_uuid).first()
    
    if not battle:
        raise HTTPException(404, "Battle not found")
    
    # Check permissions
    is_participant = current_user.id in [battle.challenger_id, battle.opponent_id]
    
    if not is_participant:
        if not allow_pending or battle.battle_status != "pending":
            raise HTTPException(403, "You are not authorized to access this battle")
    
    return battle

async def send_battle_notification(battle: Battle, current_user: User, opponent: User, folder: ClassFolder, db: Session):
    """Handle battle notification logic (WebSocket only - no offline queuing)"""
    invite_message = {
        "type": "BATTLE_INVITATION",
        "battle": {
            "id": str(battle.id),
            "challenger_username": current_user.username,
            "class_folder_name": folder.name,
            "total_questions": battle.total_questions,
            "time_limit_seconds": battle.time_limit_seconds,
            "is_public": False
        }
    }
    
    try:
        message_sent = await manager.send_personal_message(invite_message, str(opponent.id))
        
        if message_sent:
            logger.info(f"Battle invite sent via WebSocket to {opponent.username}")
            return True
        else:
            logger.warning(f"User {opponent.username} is not online - cannot send invite")
            return False
            
    except Exception as e:
        logger.error(f"Error sending WebSocket message: {str(e)}")
        return False

# ==================== PENDING INVITE FUNCTIONS ====================
async def get_pending_battle_invitations(user_id: str, db: Session) -> List[dict]:
    """Get all pending battle invitations for a user (battles where they are the opponent)"""
    try:
        logger.info(f"Fetching pending battle invitations for user_id: {user_id}")
        
        # Find battles where the user is the opponent and status is pending
        pending_battles = db.query(Battle).filter(
            Battle.opponent_id == user_id,
            Battle.battle_status == "pending"
        ).all()
        
        logger.info(f"Found {len(pending_battles)} pending battle invitations")
        
        result = []
        for battle in pending_battles:
            try:
                # Get challenger and folder info
                challenger = db.query(User).filter(User.id == battle.challenger_id).first()
                folder = db.query(ClassFolder).filter(ClassFolder.id == battle.class_folder_id).first()
                
                if not challenger or not folder:
                    logger.warning(f"Missing challenger or folder for battle {battle.id}")
                    continue
                
                invitation = {
                    "id": str(battle.id),  # Use battle ID as invitation ID
                    "battle_id": str(battle.id),
                    "invite_data": {
                        "type": "BATTLE_INVITATION",
                        "battle": {
                            "id": str(battle.id),
                            "challenger_username": challenger.username,
                            "class_folder_name": folder.name,
                            "total_questions": battle.total_questions,
                            "time_limit_seconds": battle.time_limit_seconds,
                            "is_public": False
                        }
                    },
                    "created_at": battle.created_at.isoformat(),
                    "expires_at": None  # Battles don't expire
                }
                
                result.append(invitation)
                
            except Exception as e:
                logger.error(f"Error processing battle invitation {battle.id}: {str(e)}")
                continue
                
        return result
        
    except Exception as e:
        logger.error(f"Error getting pending battle invitations for user {user_id}: {str(e)}")
        return []

# Removed: queue_pending_invite - no longer needed with real-time invites

# Removed: get_pending_invites - replaced with get_pending_battle_invitations
# Removed: mark_invite_as_read, send_queued_invites_on_connect, cleanup_expired_invites - no longer needed

# ==================== MAIN BATTLE FUNCTIONS ====================
async def create_battle(battle_request: CreateBattleRequest, current_user: User, db: Session) -> BattleResponse:
    """Create a new battle (either private or public) with smart invite handling"""
    try:
        logger.info(f"Creating battle for user {current_user.username}")
        
        opponent = None
        room_code = None
        is_public = getattr(battle_request, 'is_public', False)

        # Handle private battle logic
        if battle_request.opponent_username:
            opponent = db.query(User).filter(User.username == battle_request.opponent_username).first()
            
            if not opponent:
                raise HTTPException(404, "Opponent not found")
            
            if opponent.id == current_user.id:
                raise HTTPException(400, "Cannot battle yourself")
            
            # Check if opponent is online
            is_opponent_online = manager.is_user_connected(str(opponent.id))
            if not is_opponent_online:
                raise HTTPException(400, "Opponent is not online. You can only invite users who are currently active.")
            
            is_public = False
        else:
            # Public battle
            is_public = True
            room_code = generate_room_code()
            while db.query(Battle).filter(Battle.room_code == room_code).first():
                room_code = generate_room_code()

        # Verify class folder
        folder_id = validate_uuid(battle_request.class_folder_id, "folder ID")
        folder = db.query(ClassFolder).filter(ClassFolder.id == folder_id).first()
        
        if not folder:
            raise HTTPException(404, "Class folder not found")
        
        if folder.question_count < battle_request.total_questions:
            raise HTTPException(400, f"Folder has {folder.question_count} questions, requested {battle_request.total_questions}")

        # Create battle
        battle = Battle(
            challenger_id=current_user.id,
            opponent_id=opponent.id if opponent else None,
            class_folder_id=folder_id,
            total_questions=battle_request.total_questions,
            time_limit_seconds=battle_request.time_limit_seconds,
            battle_status="pending",
            room_code=room_code,
            is_public=is_public
        )
        
        db.add(battle)
        db.commit()
        db.refresh(battle)

        # Handle notifications
        if opponent:
            await send_battle_notification(battle, current_user, opponent, folder, db)
        else:
            # Public battle broadcast
            try:
                await manager.broadcast({
                    "type": "PUBLIC_BATTLE_CREATED",
                    "room_code": room_code,
                    "battle": {
                        "id": str(battle.id),
                        "challenger_username": current_user.username,
                        "class_folder_name": folder.name,
                        "total_questions": battle.total_questions,
                        "time_limit_seconds": battle.time_limit_seconds,
                        "is_public": True
                    }
                })
            except Exception as e:
                logger.error(f"Error broadcasting public battle: {str(e)}")

        return create_battle_response(battle, current_user, opponent, folder)
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error in create_battle: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(500, "Internal server error")

async def accept_battle(battle_id: str, current_user: User, db: Session) -> dict:
    """Accept a battle invitation"""
    try:
        battle = get_battle_with_validation(battle_id, current_user, db, allow_pending=True)

        if battle.battle_status != "pending":
            raise HTTPException(400, "Battle already accepted or completed")

        if battle.opponent_id and battle.opponent_id != current_user.id:
            raise HTTPException(403, "You are not the invited opponent")

        if battle.challenger_id == current_user.id:
            raise HTTPException(400, "Cannot accept your own battle")

        # Update battle
        battle.battle_status = "active"
        battle.opponent_id = current_user.id
        battle.started_at = datetime.utcnow()
        
        db.commit()
        db.refresh(battle)

        # Notify challenger
        await manager.send_personal_message({
            "type": "BATTLE_ACCEPTED",
            "battle": battle_to_dict(battle)
        }, str(battle.challenger_id))

        # Notify opponent that battle has started
        await manager.send_personal_message({
            "type": "BATTLE_STARTED",
            "battle": battle_to_dict(battle)
        }, str(current_user.id))

        return {"status": "joined", "battle": battle_to_dict(battle)}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error accepting battle: {str(e)}", exc_info=True)
        raise HTTPException(500, "Internal server error")

async def submit_answer(answer_request: SubmitAnswerRequest, current_user: User, db: Session):
    """Submit an answer for a battle question"""
    try:
        logger.info(f"Submitting answer: battle_id={answer_request.battle_id}, question_id={answer_request.question_id}, user_answer={answer_request.user_answer}, time_taken={answer_request.time_taken_seconds}")
        battle = get_battle_with_validation(answer_request.battle_id, current_user, db)
        
        if battle.battle_status != "active":
            raise HTTPException(400, "Battle is not active")
        
        # Get question
        question_uuid = validate_battle_uuid(answer_request.question_id)
        question = db.query(Question).filter(Question.id == question_uuid).first()
        
        if not question:
            raise HTTPException(404, "Question not found")
        
        # Check for existing response
        existing_response = db.query(BattleAnswerResponse).filter(
            BattleAnswerResponse.battle_id == validate_battle_uuid(answer_request.battle_id),
            BattleAnswerResponse.question_id == question_uuid,
            BattleAnswerResponse.user_id == current_user.id
        ).first()
        
        if existing_response:
            raise HTTPException(400, "You already answered this question")
        
        # Calculate score
        is_correct = answer_request.user_answer.strip().lower() == question.correct_answer.strip().lower()
        points_earned = 0
        
        if is_correct:
            base_points = question.points_value
            speed_bonus = max(0, (battle.time_limit_seconds - answer_request.time_taken_seconds) / battle.time_limit_seconds * 0.5)
            points_earned = int(base_points * (1 + speed_bonus))
        
        # Save response
        battle_response = BattleAnswerResponse(
            battle_id=validate_battle_uuid(answer_request.battle_id),
            question_id=question_uuid,
            user_id=current_user.id,
            user_answer=answer_request.user_answer,
            is_correct=is_correct,
            points_earned=points_earned,
            time_taken_seconds=answer_request.time_taken_seconds
        )
        
        db.add(battle_response)
        
        # Update scores
        if current_user.id == battle.challenger_id:
            battle.challenger_score += points_earned
        else:
            battle.opponent_score += points_earned
        
        db.commit()
        
        # Notify opponent
        opponent_id = battle.opponent_id if current_user.id == battle.challenger_id else battle.challenger_id
        await manager.send_personal_message({
            "type": "opponent_answered",
            "battle_id": answer_request.battle_id,
            "question_id": answer_request.question_id,
            "is_correct": is_correct,
            "points_earned": points_earned
        }, str(opponent_id))
        
        # Check completion
        await check_battle_completion(answer_request.battle_id, db)
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "explanation": question.explanation if is_correct else None
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

async def get_my_battles(current_user: User, db: Session) -> List[BattleResponse]:
    """Get all battles for current user"""
    battles = db.query(Battle).options(
        joinedload(Battle.challenger),
        joinedload(Battle.opponent),
        joinedload(Battle.class_folder)
    ).filter(
        (Battle.challenger_id == current_user.id) | (Battle.opponent_id == current_user.id)
    ).order_by(Battle.created_at.desc()).all()
    
    return [create_battle_response(battle, battle.challenger, battle.opponent, battle.class_folder) 
            for battle in battles]

async def get_battle_questions(battle_id: str, current_user: User, db: Session):
    """Get questions for a specific battle"""
    battle = get_battle_with_validation(battle_id, current_user, db)
    
    questions = db.query(Question).options(
        joinedload(Question.options)
    ).filter(
        Question.class_folder_id == battle.class_folder_id
    ).all()
    
    # Random selection with battle ID as seed for consistency
    random.seed(str(battle.id))
    selected = random.sample(questions, min(battle.total_questions, len(questions)))
    
    return {
        "battle_id": battle_id,
        "questions": [
            {
                "id": str(q.id), 
                "question": q.question_text,
                "options": [opt.option_text for opt in q.options],
                "correct_answer": q.correct_answer,
                "time_limit_seconds": battle.time_limit_seconds
            } 
            for q in selected
        ]
    }

async def get_battle_results(battle_id: str, current_user: User, db: Session):
    """Get detailed battle results"""
    battle = get_battle_with_validation(battle_id, current_user, db)
    
    challenger = db.query(User).filter(User.id == battle.challenger_id).first()
    opponent = db.query(User).filter(User.id == battle.opponent_id).first()
    
    challenger_answers = db.query(BattleAnswerResponse).filter(
        BattleAnswerResponse.battle_id == battle.id,
        BattleAnswerResponse.user_id == battle.challenger_id
    ).all()
    
    opponent_answers = db.query(BattleAnswerResponse).filter(
        BattleAnswerResponse.battle_id == battle.id,
        BattleAnswerResponse.user_id == battle.opponent_id
    ).all()
    
    return {
        "battle_id": battle_id,
        "battle_status": battle.battle_status,
        "challenger": {
            "username": challenger.username,
            "score": battle.challenger_score,
            "correct_answers": len([a for a in challenger_answers if a.is_correct]),
            "total_answers": len(challenger_answers)
        },
        "opponent": {
            "username": opponent.username,
            "score": battle.opponent_score,
            "correct_answers": len([a for a in opponent_answers if a.is_correct]),
            "total_answers": len(opponent_answers)
        },
        "winner_id": str(battle.winner_id) if battle.winner_id else None,
        "completed_at": battle.completed_at
    }

async def get_battle_by_id(battle_id: str, current_user: User, db: Session) -> BattleResponse:
    """Get a specific battle by ID"""
    battle = db.query(Battle).options(
        joinedload(Battle.challenger),
        joinedload(Battle.opponent),
        joinedload(Battle.class_folder)
    ).filter(Battle.id == validate_battle_uuid(battle_id)).first()

    if not battle:
        raise HTTPException(404, "Battle not found")

    if current_user.id not in [battle.challenger_id, battle.opponent_id]:
        raise HTTPException(403, "You are not a participant in this battle")

    return create_battle_response(battle, battle.challenger, battle.opponent, battle.class_folder)

async def check_battle_completion(battle_id: str, db: Session):
    """Check if battle is complete and update status"""
    battle = db.query(Battle).filter(Battle.id == validate_battle_uuid(battle_id)).first()
    if not battle or battle.battle_status != "active":
        return
    
    # Count answers
    challenger_answers = db.query(BattleAnswerResponse).filter(
        BattleAnswerResponse.battle_id == battle.id,
        BattleAnswerResponse.user_id == battle.challenger_id
    ).count()
    
    opponent_answers = db.query(BattleAnswerResponse).filter(
        BattleAnswerResponse.battle_id == battle.id,
        BattleAnswerResponse.user_id == battle.opponent_id
    ).count()
    
    # Check completion
    if challenger_answers >= battle.total_questions and opponent_answers >= battle.total_questions:
        battle.battle_status = "completed"
        battle.completed_at = datetime.utcnow()
        
        # Determine winner
        if battle.challenger_score > battle.opponent_score:
            battle.winner_id = battle.challenger_id
        elif battle.opponent_score > battle.challenger_score:
            battle.winner_id = battle.opponent_id
        
        db.commit()
        
        # Notify players
        await manager.broadcast_to_battle({
            "type": "battle_completed",
            "battle_id": str(battle.id),
            "challenger_score": battle.challenger_score,
            "opponent_score": battle.opponent_score,
            "winner_id": str(battle.winner_id) if battle.winner_id else None
        }, [str(battle.challenger_id), str(battle.opponent_id)])