"""
Search routes for campaigns and quests
"""

import traceback

from fastapi import APIRouter, HTTPException

from api.models import SearchRequest, SearchResponse
from services.pinecone import pinecone_service

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search-campaigns", response_model=SearchResponse)
async def search_campaigns(request: SearchRequest):
    """
    Search for campaigns using vector similarity

    This endpoint allows finding campaigns based on semantic similarity to the query
    """
    try:
        results = pinecone_service.search_campaigns(
            query=request.query, user_id=request.user_id, limit=request.limit
        )

        return SearchResponse(results=results, total=len(results))
    except Exception as e:
        print(f"Error searching campaigns: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to search campaigns: {str(e)}")


@router.post("/search-quests", response_model=SearchResponse)
async def search_quests(request: SearchRequest):
    """
    Search for quests using vector similarity

    This endpoint allows finding quests based on semantic similarity to the query
    """
    try:
        results = pinecone_service.search_quests(query=request.query, limit=request.limit)

        return SearchResponse(results=results, total=len(results))
    except Exception as e:
        print(f"Error searching quests: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to search quests: {str(e)}")
