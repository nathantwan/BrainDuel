# models/__init__.py
from .user import User, UserAchievement, UserFolderStats
from .education import ClassFolder, Question, QuestionOption, TempNote
from .battle import Battle, BattleAnswerResponse, PendingInvite

# Make Base available for migrations
from .user import Base

__all__ = [
    'Base', 'User', 'UserAchievement', 'UserFolderStats',
    'ClassFolder', 'Question', 'QuestionOption', 'TempNote',
    'Battle', 'BattleAnswerResponse', 'PendingInvite'
]