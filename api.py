"""
FastAPI Backend for AgenticTableTop
Provides REST API endpoints for the UI to interact with D&D content generation
"""

import traceback
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

from utils.agents import background_story, generate_game_plan, generate_quests_for_act
from utils.model import initialize_llm
from utils.state import GameStatus
from utils.pinecone_service import pinecone_service

# Constants
DEFAULT_CAMPAIGN_TITLE = "Untitled Campaign"

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
    save_to_pinecone: Optional[bool] = False  # Whether to save to Pinecone
    user_id: Optional[str] = None  # User ID for Pinecone storage
    tags: Optional[List[str]] = []  # Tags for Pinecone storage


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


class SaveCampaignRequest(BaseModel):
    """Request model for saving campaign to Pinecone"""
    
    campaign_data: CampaignResponse
    user_id: Optional[str] = None
    tags: Optional[List[str]] = []


class SearchRequest(BaseModel):
    """Request model for searching campaigns"""
    
    query: str
    user_id: Optional[str] = None
    limit: Optional[int] = 10


class SearchResponse(BaseModel):
    """Response model for search results"""
    
    results: List[Dict[str, Any]]
    total: int


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to AgenticTableTop API", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AgenticTableTop API", "version": "1.0.0"}


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
        
        # Save to Pinecone if requested
        if request.save_to_pinecone:
            try:
                campaign_id = pinecone_service.store_campaign(
                    campaign_data=campaign_response.dict(),
                    user_id=request.user_id,
                    tags=request.tags or []
                )
                print(f"Campaign saved to Pinecone with ID: {campaign_id}")
            except Exception as e:
                print(f"Warning: Failed to save campaign to Pinecone: {e}")
                # Don't fail the request if Pinecone save fails
        
        return campaign_response
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
        model = initialize_llm()
        state = GameStatus()

        # Generate only the background story
        background_story(model, state)

        return StoryResponse(
            title=state.get("title", DEFAULT_CAMPAIGN_TITLE),
            background=state.get("background_story", ""),
            theme=state.get("key_themes", [""])[0] if state.get("key_themes") else "",
        )
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

        return {
            "title": state.get("title", DEFAULT_CAMPAIGN_TITLE),
            "background": state.get("background_story", ""),
            "theme": state.get("key_themes", [""])[0] if state.get("key_themes") else "",
            "acts": transformed_acts,
            "total_acts": len(state.get("acts", [])),
        }
    except Exception as e:
        print(f"Error generating game plan: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate game plan: {str(e)}")


@app.post("/api/save-campaign")
async def save_campaign(request: SaveCampaignRequest):
    """
    Save a generated campaign to Pinecone vector database
    
    This endpoint stores the campaign data for future retrieval and similarity search
    """
    try:
        campaign_id = pinecone_service.store_campaign(
            campaign_data=request.campaign_data.dict(),
            user_id=request.user_id
        )
        
        return {
            "success": True,
            "campaign_id": campaign_id,
            "message": "Campaign saved successfully"
        }
    except Exception as e:
        print(f"Error saving campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to save campaign: {str(e)}")


@app.post("/api/search-campaigns", response_model=SearchResponse)
async def search_campaigns(request: SearchRequest):
    """
    Search for campaigns using vector similarity
    
    This endpoint allows finding campaigns based on semantic similarity to the query
    """
    try:
        results = pinecone_service.search_campaigns(
            query=request.query,
            user_id=request.user_id,
            limit=request.limit
        )
        
        return SearchResponse(
            results=results,
            total=len(results)
        )
    except Exception as e:
        print(f"Error searching campaigns: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to search campaigns: {str(e)}")


@app.post("/api/search-quests", response_model=SearchResponse)
async def search_quests(request: SearchRequest):
    """
    Search for quests using vector similarity
    
    This endpoint allows finding quests based on semantic similarity to the query
    """
    try:
        results = pinecone_service.search_quests(
            query=request.query,
            limit=request.limit
        )
        
        return SearchResponse(
            results=results,
            total=len(results)
        )
    except Exception as e:
        print(f"Error searching quests: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to search quests: {str(e)}")


@app.get("/api/campaign/{campaign_id}")
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


@app.delete("/api/campaign/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """
    Delete a campaign and all related data
    
    This endpoint removes the campaign and its quests from Pinecone
    """
    try:
        success = pinecone_service.delete_campaign(campaign_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete campaign")
        
        return {
            "success": True,
            "message": "Campaign deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to delete campaign: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    print("Starting AgenticTableTop API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Interactive API: http://localhost:8000/redoc")
    # Note: reload=True requires running as module (uvicorn api:app --reload)
    # For direct execution, we disable reload for stability
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
