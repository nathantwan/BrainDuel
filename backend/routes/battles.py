from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import json
import logging
from models import Battle, User, ClassFolder
from database import get_db
from schemas import CreateBattleRequest, SubmitAnswerRequest, BattleResponse
from services import (
    get_current_user,
    create_battle,
    accept_battle,
    submit_answer,
    get_my_battles,
    get_battle_questions,
    get_battle_results,
    get_battle_by_id,
    generate_room_code,
    send_queued_invites_on_connect,
    get_pending_invites,
    mark_invite_as_read,
    manager
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/battles", tags=["battles"])

# ==================== HELPER FUNCTIONS ====================
def validate_uuid(value: str, field_name: str = "ID") -> uuid.UUID:
    """Validate UUID format and return UUID object"""
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(400, f"Invalid {field_name} format")

def validate_room_code(room_code: str) -> None:
    """Validate room code format"""
    if len(room_code) != 6 or not room_code.isalnum():
        raise HTTPException(400, "Room code must be 6 alphanumeric characters")

async def handle_service_call(service_func, *args, **kwargs):
    """Generic error handler for service calls"""
    try:
        return await service_func(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"{service_func.__name__} error: {str(e)}", exc_info=True)
        raise HTTPException(500, "Internal server error")

# ==================== BATTLE CREATION ====================
@router.post("/create", response_model=BattleResponse)
async def create_battle_route(
    battle_request: CreateBattleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new battle (public or private)"""
    return await handle_service_call(
        create_battle,
        battle_request=battle_request,
        current_user=current_user,
        db=db
    )

# ==================== BATTLE JOINING ====================
@router.post("/join/{room_code}")
async def join_battle_with_code(
    room_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a public battle using room code"""
    validate_room_code(room_code)
    
    battle = db.query(Battle).filter(
        Battle.room_code == room_code,
        Battle.battle_status == "pending"
    ).first()
    
    if not battle:
        raise HTTPException(404, "Invalid code or battle already started")
    if battle.challenger_id == current_user.id:
        raise HTTPException(400, "Cannot join your own battle")
    
    return await handle_service_call(accept_battle, str(battle.id), current_user, db)

# ==================== BATTLE ACTIONS ====================
@router.post("/submit-answer")
async def submit_answer_route(
    answer_request: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer in an active battle"""
    return await handle_service_call(submit_answer, answer_request, current_user, db)

@router.post("/{battle_id}/accept")
async def accept_battle_invite(
    battle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a battle invitation"""
    validate_uuid(battle_id, "battle ID")
    return await handle_service_call(accept_battle, battle_id, current_user, db)

@router.post("/{battle_id}/decline")
async def decline_battle_invite(
    battle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline a battle invitation"""
    battle_uuid = validate_uuid(battle_id, "battle ID")
    
    try:
        battle = db.query(Battle).filter(Battle.id == battle_uuid).first()
        if not battle:
            raise HTTPException(404, "Battle not found")
        
        battle.battle_status = "declined"
        db.commit()
        
        await manager.send_personal_message({
            "type": "BATTLE_DECLINED",
            "battle_id": battle_id,
            "declined_by": current_user.username
        }, str(battle.challenger_id))
        
        return {"status": "declined"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

# ==================== BATTLE DATA ====================
@router.get("/my-battles", response_model=List[BattleResponse])
async def get_my_battles_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all battles for current user"""
    return await handle_service_call(get_my_battles, current_user, db)

@router.get("/questions/{battle_id}")
async def get_battle_questions_route(
    battle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get questions for a specific battle"""
    validate_uuid(battle_id, "battle ID")
    return await handle_service_call(get_battle_questions, battle_id, current_user, db)

@router.get("/results/{battle_id}")
async def get_battle_results_route(
    battle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get results for a completed battle"""
    validate_uuid(battle_id, "battle ID")
    return await handle_service_call(get_battle_results, battle_id, current_user, db)

@router.get("/{battle_id}", response_model=BattleResponse)
async def get_battle_by_id_route(
    battle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get battle details by ID"""
    validate_uuid(battle_id, "battle ID")
    
    battle = await handle_service_call(get_battle_by_id, battle_id, current_user, db)
    if not battle:
        raise HTTPException(404, "Battle not found")
    return battle

# ==================== BATTLE INVITES ====================
@router.get("/pending-invites")
async def get_user_pending_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending invites for the current user"""
    invites = await handle_service_call(get_pending_invites, str(current_user.id), db)
    return {"invites": invites}

@router.delete("/invites/{invite_id}")
async def dismiss_invite(
    invite_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dismiss a pending invite"""
    validate_uuid(invite_id, "invite ID")
    await handle_service_call(mark_invite_as_read, invite_id, str(current_user.id), db)
    return {"message": "Invite dismissed"}

# ==================== WEBSOCKET HANDLER ====================
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str,
    db: Session = Depends(get_db)
):
    """Handle real-time battle updates"""
    await manager.connect(websocket, user_id)
    await send_queued_invites_on_connect(user_id, db)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_websocket_message(websocket, user_id, message)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(user_id)

async def handle_websocket_message(websocket: WebSocket, user_id: str, message: dict):
    """Handle different types of WebSocket messages"""
    message_type = message.get("type")
    
    if message_type == "ping":
        await websocket.send_json({"type": "pong"})
        
    elif message_type == "ACCEPT_BATTLE":
        battle_id = message.get("battleId")
        if battle_id:
            logger.info(f"User {user_id} accepted battle {battle_id}")
            
    elif message_type == "DECLINE_BATTLE":
        battle_id = message.get("battleId")
        if battle_id:
            logger.info(f"User {user_id} declined battle {battle_id}")
            await manager.send_personal_message(
                {"type": "BATTLE_DECLINED", "battleId": battle_id},
                message.get("challengerId", "")
            )
            
    elif message_type == "BATTLE_UPDATE":
        await manager.broadcast_to_battle(
            message,
            message.get("participants", [])
        )
        
    else:
        logger.warning(f"Unknown message type: {message_type}")