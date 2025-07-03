from fastapi import WebSocket
from typing import Dict, List
import json
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str, db: Session = None):
        """Connect user and deliver any pending invites"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
        
        # Deliver pending invites if database session provided
        if db:
            await self.deliver_pending_invites(user_id, db)

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_id: str) -> bool:
        """Send message to a specific user and return success status"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                # Handle both dict and string messages
                if isinstance(message, dict):
                    await websocket.send_text(json.dumps(message))
                else:
                    await websocket.send_text(message)
                logger.info(f"Message sent to user {user_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {str(e)}")
                # Remove disconnected websocket
                self.disconnect(user_id)
                return False
        else:
            logger.warning(f"User {user_id} not connected - cannot send message")
            return False

    async def deliver_pending_invites(self, user_id: str, db: Session):
        """Deliver all pending invites when user connects"""
        try:
            # Import here to avoid circular imports
            from models import PendingInvite
            
            # Get all unread pending invites for this user
            pending_invites = db.query(PendingInvite).filter(
                PendingInvite.user_id == user_id,
                PendingInvite.is_read == False
            ).all()
            
            if not pending_invites:
                return
                
            logger.info(f"Delivering {len(pending_invites)} pending invites to user {user_id}")
            
            # Send each pending invite
            delivered_count = 0
            for invite in pending_invites:
                try:
                    success = await self.send_personal_message(invite.invite_data, user_id)
                    if success:
                        # Mark as read
                        invite.is_read = True
                        delivered_count += 1
                except Exception as e:
                    logger.error(f"Failed to deliver pending invite {invite.id}: {str(e)}")
            
            # Commit the read status updates
            if delivered_count > 0:
                db.commit()
                logger.info(f"Successfully delivered {delivered_count} pending invites to user {user_id}")
                
        except Exception as e:
            logger.error(f"Error delivering pending invites to user {user_id}: {str(e)}")
            db.rollback()

    async def broadcast_to_others(self, sender_user_id: str, message: dict):
        """Broadcast message to all connected users except the sender"""
        sent_count = 0
        for user_id, websocket in list(self.active_connections.items()):
            if user_id != sender_user_id:  # Don't send to sender
                try:
                    await websocket.send_text(json.dumps(message))
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to broadcast to user {user_id}: {str(e)}")
                    # Remove disconnected websockets
                    self.disconnect(user_id)
        logger.info(f"Broadcast sent to {sent_count} users (excluding sender {sender_user_id})")

    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        sent_count = 0
        for user_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_text(json.dumps(message))
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to broadcast to user {user_id}: {str(e)}")
                # Remove disconnected websockets
                self.disconnect(user_id)
        logger.info(f"Broadcast sent to {sent_count} users")

    async def broadcast_to_battle(self, message: dict, user_ids: List[str]):
        """Broadcast message to specific battle participants"""
        sent_count = 0
        for user_id in user_ids:
            if user_id in self.active_connections:
                try:
                    websocket = self.active_connections[user_id]
                    # Handle both dict and string messages
                    if isinstance(message, dict):
                        await websocket.send_text(json.dumps(message))
                    else:
                        await websocket.send_text(message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send battle message to user {user_id}: {str(e)}")
                    self.disconnect(user_id)
            else:
                logger.warning(f"Battle participant {user_id} not connected")
        logger.info(f"Battle message sent to {sent_count}/{len(user_ids)} participants")

    def get_connected_users(self) -> List[str]:
        """Get list of currently connected user IDs"""
        return list(self.active_connections.keys())

    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user is currently connected"""
        return user_id in self.active_connections

    async def cleanup_stale_connections(self):
        """Remove connections that are no longer active"""
        stale_connections = []
        for user_id, websocket in self.active_connections.items():
            try:
                # Try to ping the connection
                await websocket.ping()
            except Exception:
                stale_connections.append(user_id)
        
        for user_id in stale_connections:
            self.disconnect(user_id)
        
        if stale_connections:
            logger.info(f"Cleaned up {len(stale_connections)} stale connections")

manager = ConnectionManager()