from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List
from uuid import UUID

from database import get_db
from models import User, Battle, BattleAnswerResponse, ClassFolder, TempNote
from services.auth import get_current_user
from schemas.dashboard import UserStatsResponse, RecentActivityResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user statistics for dashboard"""
    try:
        user_id = current_user.id
        
        # Get total notes (temp notes count)
        total_notes = db.query(TempNote).filter(
            TempNote.user_id == user_id
        ).count()
        
        # Get battle statistics
        user_battles = db.query(Battle).filter(
            (Battle.challenger_id == user_id) | (Battle.opponent_id == user_id),
            Battle.battle_status == "completed"
        ).all()
        
        total_battles = len(user_battles)
        
        # Calculate wins and losses
        wins = 0
        losses = 0
        total_score = 0
        best_score = 0
        
        for battle in user_battles:
            if battle.winner_id == user_id:
                wins += 1
            elif battle.winner_id is not None:  # Not a tie
                losses += 1
            
            # Get user's score for this battle
            user_score = battle.challenger_score if battle.challenger_id == user_id else battle.opponent_score
            total_score += user_score
            best_score = max(best_score, user_score)
        
        # Calculate win rate
        win_rate = round((wins / total_battles * 100) if total_battles > 0 else 0, 1)
        
        # Calculate current streak (consecutive wins)
        current_streak = 0
        recent_battles = sorted(user_battles, key=lambda x: x.completed_at, reverse=True)
        
        for battle in recent_battles:
            if battle.winner_id == user_id:
                current_streak += 1
            else:
                break
        
        # Get question statistics
        user_responses = db.query(BattleAnswerResponse).filter(
            BattleAnswerResponse.user_id == user_id
        ).all()
        
        total_questions_answered = len(user_responses)
        correct_answers = len([r for r in user_responses if r.is_correct])
        accuracy = round((correct_answers / total_questions_answered * 100) if total_questions_answered > 0 else 0, 1)
        
        # Calculate average score
        average_score = round(total_score / total_battles, 1) if total_battles > 0 else 0
        
        return UserStatsResponse(
            total_notes=total_notes,
            total_battles=total_battles,
            win_rate=win_rate,
            current_streak=current_streak,
            total_wins=wins,
            total_losses=losses,
            average_score=average_score,
            best_score=best_score,
            total_questions_answered=total_questions_answered,
            correct_answers=correct_answers,
            accuracy=accuracy
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user stats: {str(e)}")

@router.get("/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent user activity for dashboard"""
    try:
        user_id = current_user.id
        activities = []
        
        # Get recent battles (last 10)
        recent_battles = db.query(Battle).filter(
            (Battle.challenger_id == user_id) | (Battle.opponent_id == user_id),
            Battle.battle_status == "completed"
        ).order_by(desc(Battle.completed_at)).limit(10).all()
        
        for battle in recent_battles:
            # Get opponent username
            opponent_id = battle.opponent_id if battle.challenger_id == user_id else battle.challenger_id
            opponent = db.query(User).filter(User.id == opponent_id).first()
            opponent_username = opponent.username if opponent else "Unknown"
            
            # Get user's score
            user_score = battle.challenger_score if battle.challenger_id == user_id else battle.opponent_score
            
            if battle.winner_id == user_id:
                activities.append(RecentActivityResponse(
                    id=str(battle.id),
                    type="battle_victory",
                    title="Victory!",
                    description=f"Defeated {opponent_username} with {user_score} points",
                    timestamp=battle.completed_at.isoformat(),
                    metadata={
                        "opponent_username": opponent_username,
                        "score": user_score
                    }
                ))
            elif battle.winner_id is not None:  # Not a tie
                activities.append(RecentActivityResponse(
                    id=str(battle.id),
                    type="battle_defeat",
                    title="Defeat",
                    description=f"Lost to {opponent_username} with {user_score} points",
                    timestamp=battle.completed_at.isoformat(),
                    metadata={
                        "opponent_username": opponent_username,
                        "score": user_score
                    }
                ))
        
        # Get recent note uploads (last 5)
        recent_notes = db.query(TempNote).filter(
            TempNote.user_id == user_id
        ).order_by(desc(TempNote.uploaded_at)).limit(5).all()
        
        for note in recent_notes:
            # Get folder name
            folder = db.query(ClassFolder).filter(ClassFolder.id == note.class_folder_id).first()
            folder_name = folder.name if folder else "Unknown Folder"
            
            activities.append(RecentActivityResponse(
                id=str(note.id),
                type="notes_uploaded",
                title="Notes Uploaded",
                description=f"Added {note.file_name} to {folder_name}",
                timestamp=note.uploaded_at.isoformat(),
                metadata={
                    "folder_name": folder_name,
                    "file_name": note.file_name
                }
            ))
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Return top 10 most recent activities
        return activities[:10]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent activity: {str(e)}") 