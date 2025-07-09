from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from database import get_db, create_tables
from models import User, ClassFolder# Import your models
# from routes import notes, folders, auth, battles  # Import your routes
from routes import folders, notes, battles, auth, dashboard  # Import your routes
# Lifespan manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Brain Duel API...")
    create_tables()  # Create database tables
    print("✅ Database tables created")
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
    allow_origins=["http://localhost:3000"],  # Add your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Brain Duel API is running! 🧠⚔️"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
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
