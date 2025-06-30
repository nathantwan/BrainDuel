from pydantic import BaseModel, EmailStr
from uuid import UUID
class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
