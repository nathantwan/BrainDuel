import uvicorn
import os
from decouple import config

if __name__ == "__main__":
    # Get configuration from environment
    host = config('HOST', default='0.0.0.0')
    port = int(config('PORT', default=8000))
    reload = config('RELOAD', default=True, cast=bool)
    
    print("🚀 Starting Brain Duel Backend Server...")
    print(f"📍 Server will be available at: http://{host}:{port}")
    print(f"📚 API Documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
        access_log=True
    )
