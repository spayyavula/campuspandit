"""
Simple FastAPI app for Azure deployment testing
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CampusPandit API",
    description="AI-Powered Online Tutoring Platform Backend",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://campuspandit.com",
        "https://www.campuspandit.com",
        "https://campuspandit.ai",
        "https://www.campuspandit.ai",
        "https://ambitious-river-04fdcd510.azurestaticapps.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Temporary auth endpoints for testing
@app.post("/api/v1/auth/signup")
async def signup():
    """Temporary signup endpoint"""
    return {
        "message": "Signup endpoint - Full auth system coming soon",
        "status": "under_construction"
    }

@app.post("/api/v1/auth/login")
async def login():
    """Temporary login endpoint"""
    return {
        "message": "Login endpoint - Full auth system coming soon",
        "status": "under_construction"
    }

# Vercel ASGI handler
from mangum import Mangum
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
