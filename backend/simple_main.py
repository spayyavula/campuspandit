"""
Simple FastAPI app for Azure deployment testing
"""
from fastapi import FastAPI

app = FastAPI(
    title="CampusPandit API",
    description="AI-Powered Online Tutoring Platform Backend",
    version="1.0.0"
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to CampusPandit API",
        "version": "1.0.0",
        "status": "running",
        "always_on": True
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": "production",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
