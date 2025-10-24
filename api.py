"""
FastAPI Backend for AgenticTableTop
Provides REST API endpoints for the UI to interact with D&D content generation
"""

import traceback
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.agents import background_story, generate_game_plan, generate_quests_for_act
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

        return CampaignResponse(
            title=state.get("title", "Untitled Campaign"),
            background=state.get("background_story", ""),
            theme=state.get("key_themes", [""])[0] if state.get("key_themes") else "",
            acts=transformed_acts,
            quests=transformed_quests,
            total_acts=len(state.get("acts", [])),
            total_quests=total_quests,
        )
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
            title=state.get("title", "Untitled Campaign"),
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
            "title": state.get("title", "Untitled Campaign"),
            "background": state.get("background_story", ""),
            "theme": state.get("key_themes", [""])[0] if state.get("key_themes") else "",
            "acts": transformed_acts,
            "total_acts": len(state.get("acts", [])),
        }
    except Exception as e:
        print(f"Error generating game plan: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate game plan: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    print("Starting AgenticTableTop API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Interactive API: http://localhost:8000/redoc")
    # Note: reload=True requires running as module (uvicorn api:app --reload)
    # For direct execution, we disable reload for stability
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
