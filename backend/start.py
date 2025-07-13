#!/usr/bin/env python3
import os
import sys

print("🚀 Brain Duel Backend Startup Script")
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

print("\n🎯 Starting server...")
if __name__ == "__main__":
    import uvicorn
    from decouple import config
    
    host = config('HOST', default='0.0.0.0')
    port = int(config('PORT', default=8000))
    
    print(f"📍 Server will be available at: http://{host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Disable reload in production
        log_level="info"
    ) 