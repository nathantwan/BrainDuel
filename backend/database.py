from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config
import os

# Get database URL from environment with fallback
try:
    DATABASE_URL = config('DATABASE_URL')
except:
    # Fallback to SQLite for development
    DATABASE_URL = "sqlite:///./brainduel.db"
    print("⚠️  No DATABASE_URL found, using SQLite fallback")

# Set other required environment variables with fallbacks
import os
if not os.getenv('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'your-secret-key-here-for-development'
if not os.getenv('ALGORITHM'):
    os.environ['ALGORITHM'] = 'HS256'
if not os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'):
    os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = '30'

# Create SQLAlchemy engine with better configuration
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,        # Check connection health before use
    pool_recycle=300,          # Recycle connections every 5 minutes
    pool_size=10,              # Number of connections to keep open
    max_overflow=20,           # Number of connections to create during overflow
    echo=False,                # Set to True only for debugging
    connect_args={
        "keepalives": 1,       # Enable TCP keepalive
        "keepalives_idle": 30, # TCP idle time before keepalive probe
        "keepalives_interval": 10, # Time between keepalive probes
        "keepalives_count": 5  # Number of keepalive probes before dropping
    } if DATABASE_URL.startswith('postgresql') else {}
)

# Configure session factory with additional parameters
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevents premature expiration of instances
)

# Create declarative base
Base = declarative_base()

# Dependency to get database session with proper error handling
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

# Improved table creation with existence check
def create_tables():
    try:
        with engine.begin() as connection:
            if not connection.dialect.has_table(connection, "users"):
                Base.metadata.create_all(bind=engine)
                print("✅ Tables created successfully")
            else:
                print("✅ Tables already exist")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise e

# Optional: Connection health check
def check_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False