from database import Base
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, UniqueConstraint, CheckConstraint, func, Numeric, text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from datetime import datetime

class Battle(Base):
    __tablename__ = 'battles'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenger_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    opponent_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    class_folder_id = Column(UUID(as_uuid=True), ForeignKey('class_folders.id'), nullable=False)
    battle_status = Column(String(20), default='pending')  # 'pending', 'active', 'completed', 'cancelled'
    total_questions = Column(Integer, default=10)
    time_limit_seconds = Column(Integer, default=300)  # 5 minutes default
    challenger_score = Column(Integer, default=0)
    opponent_score = Column(Integer, default=0)
    winner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    challenger = relationship("User", foreign_keys=[challenger_id], back_populates="challenger_battles")
    opponent = relationship("User", foreign_keys=[opponent_id], back_populates="opponent_battles")
    winner = relationship("User", foreign_keys=[winner_id])
    class_folder = relationship("ClassFolder", back_populates="battles")
    responses = relationship("BattleAnswerResponse", back_populates="battle", cascade="all, delete-orphan")
    room_code = Column(String(6), unique=True, nullable=True)  # Nullable for backward compatibility
    is_public = Column(Boolean, default=False)  # True = anyone can join with code
    pending_invites = relationship("PendingInvite", back_populates="battle", cascade="all, delete-orphan")
    
    # Modify the constraint to allow null opponent_id
    __table_args__ = (
        CheckConstraint(
            '(opponent_id IS NULL) OR (challenger_id != opponent_id)', 
            name='different_battle_participants'
        ),
    )
class BattleAnswerResponse(Base):
    __tablename__ = 'battle_answer_responses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battle_id = Column(UUID(as_uuid=True), ForeignKey('battles.id', ondelete='CASCADE'), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey('questions.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    points_earned = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, nullable=False)  # time spent on this question
    answered_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    battle = relationship("Battle", back_populates="responses")
    question = relationship("Question", back_populates="battle_answer_responses")
    user = relationship("User", back_populates="battle_answer_responses")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('battle_id', 'question_id', 'user_id', name='unique_battle_question_response'),
    )

class PendingInvite(Base):
    __tablename__ = "pending_invites"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    battle_id = Column(UUID(as_uuid=True), ForeignKey('battles.id'), nullable=False)
    invite_data = Column(Text, nullable=False)  # JSON string containing invite details
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    expires_at = Column(DateTime)  # Optional: auto-expire old invites
    
    # Relationships
    user = relationship("User", back_populates="pending_invites")
    battle = relationship("Battle", back_populates="pending_invites")
    
    def __repr__(self):
        return f"<PendingInvite(id={self.id}, user_id={self.user_id}, battle_id={self.battle_id})>"