from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Test app is working!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8000))
    
    print(f"Starting test app on {host}:{port}")
    uvicorn.run(app, host=host, port=port) 