"""
FastAPI server setup and configuration
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.models import init_db

# Initialize database on startup
init_db()

app = FastAPI(
    title="AgenticTableTop API",
    description="AI-powered D&D Campaign Generator API",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to AgenticTableTop API", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AgenticTableTop API"}


# Include all route modules
from api.routes import auth, cache, campaigns, monsters, npcs, search  # noqa: E402

app.include_router(auth.router)
app.include_router(cache.router)
app.include_router(campaigns.router)
app.include_router(monsters.router)
app.include_router(npcs.router)
app.include_router(search.router)
