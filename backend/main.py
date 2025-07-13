import os
import sys
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

# Debug startup information
print("🚀 Brain Duel Backend Starting...")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")

# Check environment variables
print("\n📋 Environment Variables:")
env_vars = ['DATABASE_URL', 'SECRET_KEY', 'HOST', 'PORT']
for var in env_vars:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if 'password' in var.lower() or 'secret' in var.lower() or 'key' in var.lower():
            print(f"  {var}: {'*' * len(value)}")
        else:
            print(f"  {var}: {value}")
    else:
        print(f"  {var}: NOT SET")

try:
    from database import get_db, create_tables
    print("✅ Database module imported successfully")
except Exception as e:
    print(f"❌ Database module import failed: {e}")
    raise e

try:
    from models import User, ClassFolder
    print("✅ Models imported successfully")
except Exception as e:
    print(f"❌ Models import failed: {e}")
    raise e

try:
    from routes import folders, notes, battles, auth, dashboard
    print("✅ Routes imported successfully")
except Exception as e:
    print(f"❌ Routes import failed: {e}")
    raise e
# Lifespan manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Brain Duel API...")
    try:
        print("📊 Attempting to create database tables...")
        create_tables()  # Create database tables
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Error details: {str(e)}")
        # Don't raise the exception, just log it and continue
        print("⚠️  Continuing startup despite table creation error...")
    
    print("✅ FastAPI app startup completed")
    yield
    # Shutdown
    print("🛑 Shutting down Brain Duel API...")

# Create FastAPI app
app = FastAPI(
    title="Brain Duel API",
    description="AI-powered exam generator with battle features",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://brainduel.vercel.app",  # Production frontend
        "https://*.vercel.app",  # Any Vercel subdomain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Brain Duel API is running! 🧠⚔️"}

@app.get("/health")
async def health_check():
    try:
        # Simple health check without database dependency
        return {
            "status": "healthy",
            "message": "Brain Duel API is operational",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")

@app.get("/health/db")
async def health_check_db(db: Session = Depends(get_db)):
    try:
        # Test database connection
        result = db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "message": "All systems operational"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

# Include your route modules
app.include_router(folders.router)
app.include_router(notes.router)
app.include_router(battles.router)
app.include_router(auth.router)
app.include_router(dashboard.router)

# Test endpoint to verify models work
@app.get("/test-db")
async def test_database(db: Session = Depends(get_db)):
    try:
        # Count users and folders
        user_count = db.query(User).count()
        folder_count = db.query(ClassFolder).count()
        
        return {
            "users": user_count,
            "folders": folder_count,
            "message": "Database models working correctly"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
