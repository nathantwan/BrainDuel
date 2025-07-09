#!/usr/bin/env python3
"""
Script to clear all battle-related data from the database.
This will delete all battles, battle responses, and pending invites.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models.battle import Battle, BattleAnswerResponse, PendingInvite
from sqlalchemy import text

def clear_battle_data():
    """Clear all battle-related data from the database"""
    db = SessionLocal()
    
    try:
        print("🗑️  Clearing battle data...")
        
        # Clear battle answer responses first (due to foreign key constraints)
        print("  - Clearing battle answer responses...")
        response_count = db.query(BattleAnswerResponse).count()
        db.query(BattleAnswerResponse).delete()
        print(f"    Deleted {response_count} battle answer responses")
        
        # Clear pending invites
        print("  - Clearing pending invites...")
        invite_count = db.query(PendingInvite).count()
        db.query(PendingInvite).delete()
        print(f"    Deleted {invite_count} pending invites")
        
        # Clear battles
        print("  - Clearing battles...")
        battle_count = db.query(Battle).count()
        db.query(Battle).delete()
        print(f"    Deleted {battle_count} battles")
        
        # Commit the changes
        db.commit()
        
        print(f"✅ Successfully cleared all battle data!")
        print(f"   - {battle_count} battles deleted")
        print(f"   - {response_count} battle responses deleted")
        print(f"   - {invite_count} pending invites deleted")
        
    except Exception as e:
        print(f"❌ Error clearing battle data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_clear():
    """Verify that all battle data has been cleared"""
    db = SessionLocal()
    
    try:
        battle_count = db.query(Battle).count()
        response_count = db.query(BattleAnswerResponse).count()
        invite_count = db.query(PendingInvite).count()
        
        print("\n🔍 Verification:")
        print(f"   - Battles remaining: {battle_count}")
        print(f"   - Battle responses remaining: {response_count}")
        print(f"   - Pending invites remaining: {invite_count}")
        
        if battle_count == 0 and response_count == 0 and invite_count == 0:
            print("✅ All battle data successfully cleared!")
        else:
            print("⚠️  Some battle data still remains")
            
    except Exception as e:
        print(f"❌ Error verifying clear: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 BrainDuel Battle Data Clearer")
    print("=" * 40)
    
    # Ask for confirmation
    response = input("Are you sure you want to clear ALL battle data? This cannot be undone! (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        clear_battle_data()
        verify_clear()
    else:
        print("❌ Operation cancelled") 