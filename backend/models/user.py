
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from database import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    profile_picture_url = Column(Text)
    total_points = Column(Integer, default=0)
    battles_won = Column(Integer, default=0)
    battles_lost = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    class_folders = relationship("ClassFolder", back_populates="owner", cascade="all, delete-orphan")
    temp_notes = relationship("TempNote", back_populates="user", cascade="all, delete-orphan")
    challenger_battles = relationship("Battle", foreign_keys="Battle.challenger_id", back_populates="challenger")
    opponent_battles = relationship("Battle", foreign_keys="Battle.opponent_id", back_populates="opponent")
    battle_answer_responses = relationship("BattleAnswerResponse", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    folder_stats = relationship("UserFolderStats", back_populates="user", cascade="all, delete-orphan")
    pending_invites = relationship("PendingInvite", back_populates="user", cascade="all, delete-orphan")


class UserAchievement(Base):
    __tablename__ = 'user_achievements'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    achievement_type = Column(String(50), nullable=False)  # 'streak', 'speed_demon', 'scholar', etc.
    achievement_name = Column(String(100), nullable=False)
    description = Column(Text)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="achievements")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'achievement_type', 'achievement_name', name='unique_user_achievement'),
    )
class UserFolderStats(Base):
    __tablename__ = 'user_folder_stats'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    class_folder_id = Column(UUID(as_uuid=True), ForeignKey('class_folders.id', ondelete='CASCADE'), nullable=False)
    questions_answered = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    total_points_earned = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    average_time_per_question = Column(Numeric(8, 2), default=0.00)  # in seconds
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="folder_stats")
    class_folder = relationship("ClassFolder", back_populates="user_stats")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'class_folder_id', name='unique_user_folder_stats'),
    )