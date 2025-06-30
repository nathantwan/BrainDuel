from database import Base
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, UniqueConstraint, CheckConstraint, func, Numeric, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
class ClassFolder(Base):
    __tablename__ = 'class_folders'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "Calculus I", "Organic Chemistry"
    description = Column(Text)
    course_code = Column(String(50))  # e.g., "MATH 101", "CHEM 2420"
    university_name = Column(String(255))  # e.g., "Harvard University", "MIT"
    is_public = Column(Boolean, default=False)
    question_count = Column(Integer, default=0)
    total_downloads = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="class_folders")
    temp_notes = relationship("TempNote", back_populates="class_folder", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="class_folder", cascade="all, delete-orphan")
    battles = relationship("Battle", back_populates="class_folder")
    user_stats = relationship("UserFolderStats", back_populates="class_folder", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('owner_id', 'name', name='unique_user_folder_name'),
    )
class Question(Base):
    __tablename__ = 'questions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_folder_id = Column(UUID(as_uuid=True), ForeignKey('class_folders.id', ondelete='CASCADE'), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # 'multiple_choice', 'true_false', 'short_answer', 'essay'
    difficulty_level = Column(String(20), default='medium')  # 'easy', 'medium', 'hard'
    topic = Column(String(255))  # extracted topic/subject area
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text)  # why this answer is correct
    points_value = Column(Integer, default=10)  # base points for this question
    times_used = Column(Integer, default=0)
    success_rate = Column(Numeric(5, 2), default=0.00)  # percentage of correct answers
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    class_folder = relationship("ClassFolder", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    battle_answer_responses = relationship("BattleAnswerResponse", back_populates="question")
class QuestionOption(Base):
    __tablename__ = 'question_options'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    option_letter = Column(String(1), nullable=False)  # A, B, C, D
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    
    # Relationships
    question = relationship("Question", back_populates="options")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('question_id', 'option_letter', name='unique_question_option'),
    )
class TempNote(Base):
    __tablename__ = 'temp_notes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    class_folder_id = Column(UUID(as_uuid=True), ForeignKey('class_folders.id', ondelete='CASCADE'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))  # pdf, txt, docx, etc.
    content = Column(Text, nullable=False)  # extracted text content
    file_size = Column(Integer)  # in bytes
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), server_default=text("NOW() + INTERVAL '24 hours'"))
    
    # Relationships
    user = relationship("User", back_populates="temp_notes")
    class_folder = relationship("ClassFolder", back_populates="temp_notes")
