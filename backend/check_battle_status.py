#!/usr/bin/env python3
"""
Script to check the current status of battles and user statistics.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, Battle, BattleAnswerResponse, TempNote
from sqlalchemy import func

def check_battle_status():
    """Check the current status of battles and user statistics"""
    db = SessionLocal()
    
    try:
        print("🔍 Checking Battle Database Status")
        print("=" * 50)
        
        # Check total battles
        total_battles = db.query(Battle).count()
        print(f"Total battles in database: {total_battles}")
        
        # Check battles by status
        pending_battles = db.query(Battle).filter(Battle.battle_status == "pending").count()
        active_battles = db.query(Battle).filter(Battle.battle_status == "active").count()
        completed_battles = db.query(Battle).filter(Battle.battle_status == "completed").count()
        
        print(f"  - Pending: {pending_battles}")
        print(f"  - Active: {active_battles}")
        print(f"  - Completed: {completed_battles}")
        
        # Check battle responses
        total_responses = db.query(BattleAnswerResponse).count()
        print(f"\nTotal battle responses: {total_responses}")
        
        # Check users
        total_users = db.query(User).count()
        print(f"Total users: {total_users}")
        
        # Check notes
        total_notes = db.query(TempNote).count()
        print(f"Total notes: {total_notes}")
        
        # Show recent completed battles
        print(f"\n📊 Recent Completed Battles:")
        recent_battles = db.query(Battle).filter(
            Battle.battle_status == "completed"
        ).order_by(Battle.completed_at.desc()).limit(5).all()
        
        if recent_battles:
            for battle in recent_battles:
                challenger = db.query(User).filter(User.id == battle.challenger_id).first()
                opponent = db.query(User).filter(User.id == battle.opponent_id).first()
                winner = db.query(User).filter(User.id == battle.winner_id).first() if battle.winner_id else None
                
                print(f"  - Battle {battle.id}:")
                print(f"    Challenger: {challenger.username if challenger else 'Unknown'}")
                print(f"    Opponent: {opponent.username if opponent else 'Unknown'}")
                print(f"    Winner: {winner.username if winner else 'Tie'}")
                print(f"    Scores: {battle.challenger_score} vs {battle.opponent_score}")
                print(f"    Completed: {battle.completed_at}")
        else:
            print("  No completed battles found")
        
        # Check for any battles with responses but not completed
        print(f"\n⚠️  Battles with responses but not completed:")
        battles_with_responses = db.query(Battle).join(BattleAnswerResponse).filter(
            Battle.battle_status != "completed"
        ).distinct().all()
        
        if battles_with_responses:
            for battle in battles_with_responses:
                challenger_responses = db.query(BattleAnswerResponse).filter(
                    BattleAnswerResponse.battle_id == battle.id,
                    BattleAnswerResponse.user_id == battle.challenger_id
                ).count()
                
                opponent_responses = db.query(BattleAnswerResponse).filter(
                    BattleAnswerResponse.battle_id == battle.id,
                    BattleAnswerResponse.user_id == battle.opponent_id
                ).count()
                
                print(f"  - Battle {battle.id} ({battle.battle_status}):")
                print(f"    Challenger responses: {challenger_responses}")
                print(f"    Opponent responses: {opponent_responses}")
                print(f"    Total questions: {battle.total_questions}")
        else:
            print("  No incomplete battles with responses found")
            
    except Exception as e:
        print(f"❌ Error checking battle status: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    check_battle_status() 