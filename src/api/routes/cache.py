"""
Cache management routes
"""

import os

from fastapi import APIRouter

from services.cache import cleanup_expired_cache, clear_llm_cache, get_cache_stats

router = APIRouter(prefix="/api/cache", tags=["cache"])


@router.get("/stats")
async def get_cache_statistics():
    """Get LLM cache statistics for debugging"""
    try:
        stats = get_cache_stats()
        return {
            "status": "ok",
            "cache_enabled": os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true",
            "cache_stats": stats,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/clear")
async def clear_cache():
    """Clear all LLM cache (useful for development)"""
    try:
        cleared_count = clear_llm_cache()
        return {
            "status": "ok",
            "message": f"Cleared {cleared_count} cache files",
            "cleared_count": cleared_count,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/cleanup")
async def cleanup_cache():
    """Remove expired cache entries"""
    try:
        cleaned_count = cleanup_expired_cache()
        return {
            "status": "ok",
            "message": f"Cleaned up {cleaned_count} expired cache files",
            "cleaned_count": cleaned_count,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
