"""
FastAPI Backend for AgenticTableTop
Provides REST API endpoints for the UI to interact with D&D content generation
"""

import os
import traceback
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.agents import background_story, generate_game_plan, generate_quests_for_act
from utils.character_generator import generate_npc_portrait
from utils.llm_cache import (
    cache_response,
    cleanup_expired_cache,
    clear_llm_cache,
    get_cache_stats,
    get_cached_response,
)
from utils.model import initialize_llm
from utils.state import GameStatus

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


class CampaignRequest(BaseModel):
    """Request model for campaign generation"""

    outline: Optional[str] = "I want a background story for a new Dungeons & Dragons campaign."
    model_type: Optional[str] = "openai"  # or "gemini"


class CampaignResponse(BaseModel):
    """Response model for campaign generation"""

    title: str
    background: str
    theme: str
    acts: List[Dict[str, Any]]
    quests: Dict[str, List[Dict[str, Any]]]
    total_acts: int
    total_quests: int


class StoryResponse(BaseModel):
    """Response model for story generation only"""

    title: str
    background: str
    theme: str


class NPCImageRequest(BaseModel):
    """Request model for NPC image generation"""

    npc_name: str
    npc_description: str  # race, class, background, role
    quest_context: Optional[str] = None  # additional context


class NPCImageResponse(BaseModel):
    """Response model for NPC image generation"""

    npc_name: str
    image_base64: str
    prompt_used: str


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to AgenticTableTop API", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AgenticTableTop API", "version": "1.0.0"}


@app.get("/api/cache/stats")
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


@app.post("/api/cache/clear")
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


@app.post("/api/cache/cleanup")
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


@app.post("/api/generate-campaign", response_model=CampaignResponse)
async def generate_campaign(request: CampaignRequest):
    """
    Generate a complete D&D campaign with background story, acts, and quests

    This endpoint:
    1. Generates a background story
    2. Creates a multi-act game plan
    3. Generates 3-5 quests for each act

    Returns complete campaign data ready for gameplay
    """
    try:
        # Check if caching is enabled
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"

        # Create cache key from request
        cache_key = f"campaign:{request.outline}:{request.model_type}"

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "campaign")
            if cached_response:
                print(f"Returning cached campaign for: {request.outline[:50]}...")
                return CampaignResponse(**cached_response)

        print(f"Generating new campaign for: {request.outline[:50]}...")

        # Initialize LLM
        model = initialize_llm()
        state = GameStatus()

        # Generate background story
        background_story(model, state)

        # Generate game plan (acts)
        generate_game_plan(model, state)

        # Generate quests for each act
        for i in range(len(state["acts"])):
            generate_quests_for_act(model, state, i)

        # Calculate totals
        total_quests = sum(len(quests) for quests in state.get("quests", {}).values())

        # Transform acts to match frontend interface
        transformed_acts = []
        for act in state.get("acts", []):
            transformed_act = {
                "title": act.get("act_title", ""),
                "summary": act.get("act_summary", ""),
                "goal": act.get("narrative_goal", ""),
                "stakes": act.get("stakes", ""),
                "locations": act.get("key_locations", []),
                "entry_condition": act.get("entry_requirements", ""),
                "exit_condition": act.get("exit_conditions", ""),
                "primary_conflict": act.get("primary_conflict", ""),
                "mechanics": act.get("mechanics_or_features_introduced", []),
                "handoff_notes": act.get("handoff_notes_for_next_stage", []),
            }
            transformed_acts.append(transformed_act)

        # Transform quests to match frontend interface
        transformed_quests = {}
        for act_title, quests in state.get("quests", {}).items():
            transformed_quest_list = []
            for quest in quests:
                transformed_quest = {
                    "name": quest.get("quest_name", ""),
                    "type": quest.get("quest_type", ""),
                    "description": quest.get("description", ""),
                    "objectives": quest.get("objectives", []),
                    "difficulty": quest.get("difficulty", ""),
                    "estimated_time": quest.get("estimated_sessions", ""),
                    "npcs": quest.get("key_npcs", []),
                    "locations": quest.get("locations", []),
                    "rewards": quest.get("rewards", ""),
                    "prerequisites": quest.get("prerequisites", ""),
                    "outcomes": quest.get("outcomes", ""),
                }
                transformed_quest_list.append(transformed_quest)
            transformed_quests[act_title] = transformed_quest_list

        # Create response
        response_data = {
            "title": state.get("title", "Untitled Campaign"),
            "background": state.get("background_story", ""),
            "theme": state.get("key_themes", [""])[0] if state.get("key_themes") else "",
            "acts": transformed_acts,
            "quests": transformed_quests,
            "total_acts": len(state.get("acts", [])),
            "total_quests": total_quests,
        }

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, response_data, "campaign")
            print(f"Cached campaign response for: {request.outline[:50]}...")

        return CampaignResponse(**response_data)
    except Exception as e:
        print(f"Error generating campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {str(e)}")


@app.post("/api/generate-story", response_model=StoryResponse)
async def generate_story_only(request: CampaignRequest):
    """
    Generate only the background story for a D&D campaign

    Faster than full campaign generation - useful for quick previews
    """
    try:
        # Check if caching is enabled
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"

        # Create cache key from request
        cache_key = f"story:{request.outline}:{request.model_type}"

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "story")
            if cached_response:
                print(f"Returning cached story for: {request.outline[:50]}...")
                return StoryResponse(**cached_response)

        print(f"Generating new story for: {request.outline[:50]}...")

        model = initialize_llm()
        state = GameStatus()

        # Generate only the background story
        background_story(model, state)

        # Create response
        response_data = {
            "title": state.get("title", "Untitled Campaign"),
            "background": state.get("background_story", ""),
            "theme": state.get("key_themes", [""])[0] if state.get("key_themes") else "",
        }

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, response_data, "story")
            print(f"Cached story response for: {request.outline[:50]}...")

        return StoryResponse(**response_data)
    except Exception as e:
        print(f"Error generating story: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate story: {str(e)}")


@app.post("/api/generate-game-plan")
async def generate_game_plan_only(request: CampaignRequest):
    """
    Generate background story + game plan (acts) without quests

    Medium speed option - generates story structure without detailed quests
    """
    try:
        # Check if caching is enabled
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"

        # Create cache key from request
        cache_key = f"gameplan:{request.outline}:{request.model_type}"

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "gameplan")
            if cached_response:
                print(f"Returning cached game plan for: {request.outline[:50]}...")
                return cached_response

        print(f"Generating new game plan for: {request.outline[:50]}...")

        model = initialize_llm()
        state = GameStatus()

        # Generate story and game plan
        background_story(model, state)
        generate_game_plan(model, state)

        # Transform acts to match frontend interface
        transformed_acts = []
        for act in state.get("acts", []):
            transformed_act = {
                "title": act.get("act_title", ""),
                "summary": act.get("act_summary", ""),
                "goal": act.get("narrative_goal", ""),
                "stakes": act.get("stakes", ""),
                "locations": act.get("key_locations", []),
                "entry_condition": act.get("entry_requirements", ""),
                "exit_condition": act.get("exit_conditions", ""),
                "primary_conflict": act.get("primary_conflict", ""),
                "mechanics": act.get("mechanics_or_features_introduced", []),
                "handoff_notes": act.get("handoff_notes_for_next_stage", []),
            }
            transformed_acts.append(transformed_act)

        # Create response
        response_data = {
            "title": state.get("title", "Untitled Campaign"),
            "background": state.get("background_story", ""),
            "theme": state.get("key_themes", [""])[0] if state.get("key_themes") else "",
            "acts": transformed_acts,
            "total_acts": len(state.get("acts", [])),
        }

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, response_data, "gameplan")
            print(f"Cached game plan response for: {request.outline[:50]}...")

        return response_data
    except Exception as e:
        print(f"Error generating game plan: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate game plan: {str(e)}")


@app.post("/api/generate-npc-image", response_model=NPCImageResponse)
async def generate_npc_image(request: NPCImageRequest):
    """
    Generate a portrait image for an NPC using OpenAI's image generation API

    This endpoint:
    1. Takes NPC name and description
    2. Generates a portrait prompt using GPT
    3. Creates an image using DALL-E 3
    4. Returns base64-encoded image

    Useful for DMs who want visual representations of NPCs in their campaigns
    """
    try:
        # Check if caching is enabled
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"

        # Create cache key from request
        cache_key = (
            f"npc_image:{request.npc_name}:{request.npc_description}:{request.quest_context or ''}"
        )

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "npc_image")
            if cached_response:
                print(f"Returning cached NPC image for: {request.npc_name}")
                return NPCImageResponse(**cached_response)

        print(f"Generating new NPC image for: {request.npc_name}")

        result = generate_npc_portrait(
            npc_name=request.npc_name,
            npc_description=request.npc_description,
            quest_context=request.quest_context,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # Create response
        response_data = {
            "npc_name": result["npc_name"],
            "image_base64": result["image_base64"],
            "prompt_used": result["prompt_used"],
        }

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, response_data, "npc_image")
            print(f"Cached NPC image response for: {request.npc_name}")

        return NPCImageResponse(**response_data)

    except Exception as e:
        print(f"Error generating NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate NPC image: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    print("Starting AgenticTableTop API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Interactive API: http://localhost:8000/redoc")
    # Note: reload=True requires running as module (uvicorn api:app --reload)
    # For direct execution, we disable reload for stability
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
