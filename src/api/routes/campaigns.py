"""
Campaign generation and management routes
"""

import json
import os
import traceback
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from api.models import CampaignRequest, CampaignResponse, SaveCampaignRequest, StoryResponse
from core.agents import background_story, generate_game_plan, generate_quests_for_act
from core.model import initialize_llm
from core.state import GameStatus
from database.models import Campaign, User, get_db
from services.cache import cache_response, get_cached_response
from services.pinecone import pinecone_service

router = APIRouter(prefix="/api", tags=["campaigns"])

# Constants
DEFAULT_CAMPAIGN_TITLE = "Untitled Campaign"


@router.post("/generate-campaign", response_model=CampaignResponse)
async def generate_campaign(
    request: CampaignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
        # Include user_id in cache key so each user has their own cache
        user_id_str = str(current_user.id) if current_user else "anonymous"
        cache_key = f"campaign:{user_id_str}:{request.outline}:{request.model_type}"

        # Try to get cached response (only if not forcing new generation)
        if cache_enabled and not request.force_new:
            cached_response = get_cached_response(cache_key, "campaign")
            if cached_response:
                print(
                    f"Returning cached campaign for user {user_id_str}: {request.outline[:50]}..."
                )
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

        campaign_response = CampaignResponse(
            title=state.get("title", DEFAULT_CAMPAIGN_TITLE),
            background=state.get("background_story", ""),
            theme=state.get("key_themes", [""])[0] if state.get("key_themes") else "",
            acts=transformed_acts,
            quests=transformed_quests,
            total_acts=len(state.get("acts", [])),
            total_quests=total_quests,
        )

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, campaign_response.dict(), "campaign")
            print(f"Cached campaign response for: {request.outline[:50]}...")

        # Always save to database for user
        campaign_db = Campaign(
            user_id=current_user.id,
            title=campaign_response.title,
            background=campaign_response.background,
            theme=campaign_response.theme,
            campaign_data=json.dumps(campaign_response.dict()),
        )
        db.add(campaign_db)
        db.commit()
        db.refresh(campaign_db)
        campaign_id = str(campaign_db.id)
        print(f"Campaign saved to database with ID: {campaign_id}")

        # Optionally save to Pinecone if requested
        if request.save_to_pinecone:
            try:
                pinecone_id = pinecone_service.store_campaign(
                    campaign_data=campaign_response.dict(),
                    user_id=request.user_id or str(current_user.id),
                    tags=request.tags or [],
                )
                print(f"Campaign also saved to Pinecone with ID: {pinecone_id}")
            except Exception as e:
                print(f"Warning: Failed to save campaign to Pinecone: {e}")

        return campaign_response
    except Exception as e:
        error_str = str(e)
        print(f"Error generating campaign: {error_str}")
        print(traceback.format_exc())

        # Check for OpenAI quota/rate limit errors
        if (
            "quota" in error_str.lower()
            or "insufficient_quota" in error_str.lower()
            or "429" in error_str
        ):
            gemini_available = os.getenv("GEMINI_API_KEY", "")
            error_detail = (
                "OpenAI API quota exceeded. Please check your billing and usage limits at "
                "https://platform.openai.com/usage. "
            )
            if gemini_available:
                error_detail += (
                    "Alternatively, you can switch to Gemini by setting MODEL_TYPE=GEMINI in src/core/model.py "
                    "and ensuring GEMINI_API_KEY is set in your .env file."
                )
            else:
                error_detail += (
                    "To use Gemini as an alternative, add GEMINI_API_KEY to your .env file and set "
                    "MODEL_TYPE=GEMINI in src/core/model.py"
                )
            raise HTTPException(status_code=402, detail=error_detail)

        # Check for rate limit errors (429)
        if "rate limit" in error_str.lower() or "429" in error_str:
            raise HTTPException(
                status_code=429,
                detail=(
                    "API rate limit exceeded. Please wait a moment and try again. "
                    "If this persists, check your API usage limits."
                ),
            )

        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {error_str}")


@router.post("/generate-story", response_model=StoryResponse)
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


@router.post("/generate-game-plan")
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

        response_data = {
            "title": state.get("title", DEFAULT_CAMPAIGN_TITLE),
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


@router.post("/save-campaign")
async def save_campaign(
    request: SaveCampaignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a generated campaign to database and optionally Pinecone

    This endpoint stores the campaign data for future retrieval
    """
    try:
        # Save to database
        campaign_db = Campaign(
            user_id=current_user.id,
            title=request.campaign_data.title,
            background=request.campaign_data.background,
            theme=request.campaign_data.theme,
            campaign_data=json.dumps(request.campaign_data.dict()),
        )
        db.add(campaign_db)
        db.commit()
        db.refresh(campaign_db)

        campaign_id = str(campaign_db.id)

        # Optionally save to Pinecone if requested
        if request.user_id or request.tags:
            try:
                pinecone_id = pinecone_service.store_campaign(
                    campaign_data=request.campaign_data.dict(),
                    user_id=request.user_id or str(current_user.id),
                    tags=request.tags or [],
                )
                print(f"Campaign also saved to Pinecone with ID: {pinecone_id}")
            except Exception as e:
                print(f"Warning: Failed to save to Pinecone: {e}")

        return {
            "success": True,
            "campaign_id": campaign_id,
            "message": "Campaign saved successfully",
        }
    except Exception as e:
        print(f"Error saving campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to save campaign: {str(e)}")


@router.get("/user/campaigns", response_model=List[Dict[str, Any]])
async def list_user_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all campaigns for the current user
    """
    try:
        campaigns = (
            db.query(Campaign)
            .filter(Campaign.user_id == current_user.id)
            .order_by(Campaign.created_at.desc())
            .all()
        )

        return [
            {
                "id": camp.id,
                "title": camp.title,
                "theme": camp.theme,
                "background": (
                    camp.background[:200] + "..."
                    if camp.background and len(camp.background) > 200
                    else camp.background
                ),
                "created_at": camp.created_at.isoformat() if camp.created_at else None,
                "updated_at": camp.updated_at.isoformat() if camp.updated_at else None,
            }
            for camp in campaigns
        ]
    except Exception as e:
        print(f"Error listing campaigns: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to list campaigns: {str(e)}")


@router.get("/user/campaigns/{campaign_id}")
async def get_user_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific campaign by ID for the current user
    """
    try:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
            .first()
        )

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        # Parse campaign data from JSON
        campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

        return {
            "id": campaign.id,
            "title": campaign.title,
            "background": campaign.background,
            "theme": campaign.theme,
            "campaign_data": campaign_data,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign: {str(e)}")


@router.get("/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    """
    Retrieve a specific campaign by ID

    This endpoint fetches campaign metadata from Pinecone
    """
    try:
        campaign = pinecone_service.get_campaign_by_id(campaign_id)

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        return campaign
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign: {str(e)}")


@router.delete("/campaign/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """
    Delete a campaign from Pinecone

    This endpoint removes campaign data from vector storage
    """
    try:
        success = pinecone_service.delete_campaign(campaign_id)

        if not success:
            raise HTTPException(status_code=404, detail="Campaign not found")

        return {"success": True, "message": "Campaign deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to delete campaign: {str(e)}")
