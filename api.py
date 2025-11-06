"""
FastAPI Backend for AgenticTableTop
Provides REST API endpoints for the UI to interact with D&D content generation
"""

import os
import traceback
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

# Load environment variables from .env file
load_dotenv()

from utils.agents import (
    background_story, 
    generate_game_plan, 
    generate_quests_for_act, 
    generate_monsters_for_combat_quests,
    generate_monsters_for_quest,
)
from utils.character_generator import generate_npc_portrait
from utils.combat_system import CombatEncounter, create_combatant_from_monster, create_player_combatant, simulate_attack
from utils.tools import get_monster_stat_block
from utils.llm_cache import (
    cache_response,
    cleanup_expired_cache,
    clear_llm_cache,
    get_cache_stats,
    get_cached_response,
)
from utils.model import initialize_llm
from utils.state import GameStatus
from utils.pinecone_service import pinecone_service
from utils.database import Campaign, NPCImage, SessionLocal, User, get_db, init_db
from utils.auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)

# Constants
DEFAULT_CAMPAIGN_TITLE = "Untitled Campaign"

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

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


class CampaignRequest(BaseModel):
    """Request model for campaign generation"""

    outline: Optional[str] = "I want a background story for a new Dungeons & Dragons campaign."
    model_type: Optional[str] = "openai"  # or "gemini"
    save_to_pinecone: Optional[bool] = False  # Whether to save to Pinecone
    user_id: Optional[str] = None  # User ID for Pinecone storage
    tags: Optional[List[str]] = []  # Tags for Pinecone storage
    force_new: Optional[bool] = False  # Force new generation, bypass cache


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
class NPCImageRequest(BaseModel):
    """Request model for NPC image generation"""

    npc_name: str
    npc_description: str  # race, class, background, role
    quest_context: Optional[str] = None  # additional context
    campaign_id: Optional[str] = None  # optional - link to campaign


class UserRegister(BaseModel):
    """Request model for user registration"""

    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Request model for user login"""

    username: str
    password: str


class Token(BaseModel):
    """Response model for authentication token"""

    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


class UserResponse(BaseModel):
    """Response model for user information"""

    id: int
    username: str
    email: str
    is_active: bool


class NPCImageResponse(BaseModel):
    """Response model for NPC image generation"""

    npc_name: str
    image_base64: str
    prompt_used: str


class MonsterGenerationRequest(BaseModel):
    """Request model for monster generation"""

    quest_name: str
    quest_description: str
    quest_type: str
    difficulty: str = "Medium"
    locations: List[str] = []
    objectives: List[str] = []
    quest_context: Optional[str] = None


class MonsterResponse(BaseModel):
    """Response model for monster generation"""

    quest_name: str
    monsters: List[Dict[str, Any]]


class CombatRequest(BaseModel):
    """Request model for combat simulation"""

    player_name: str
    player_max_hp: int
    player_armor_class: int
    player_dexterity_modifier: int
    monster_name: str
    monster_data: Dict[str, Any]


class CombatResponse(BaseModel):
    """Response model for combat simulation"""

    combat_log: List[str]
    result: str
    player_hp: int
    monster_hp: int
    round: int
    current_turn: str


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to AgenticTableTop API", "docs": "/docs", "health": "/health"}


# Authentication helper functions
async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    # Convert string user_id to int
    try:
        user_id: int = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if token is None:
        return None
    try:
        payload = decode_access_token(token)
        if payload is None:
            return None
        
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        
        # Convert string user_id to int
        try:
            user_id: int = int(user_id_str)
        except (ValueError, TypeError):
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AgenticTableTop API", "version": "1.0.0"}


@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        is_active=new_user.is_active,
    )


@app.post("/api/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Login and get access token"""
    # Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Create access token (sub must be a string)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
    )


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
async def generate_campaign(
    request: CampaignRequest,
    background_tasks: BackgroundTasks,
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
                print(f"Returning cached campaign for user {user_id_str}: {request.outline[:50]}...")
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
        
        # Generate campaign ID (use Pinecone ID if saved, otherwise generate UUID)
        campaign_id = None
        
        # Always save to database for user
        import json
        campaign_db = Campaign(
            user_id=current_user.id,
            title=campaign_response.title,
            background=campaign_response.background,
            theme=campaign_response.theme,
            campaign_data=json.dumps(campaign_response.dict())
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
                    tags=request.tags or []
                )
                print(f"Campaign also saved to Pinecone with ID: {pinecone_id}")
            except Exception as e:
                print(f"Warning: Failed to save campaign to Pinecone: {e}")
                # Don't fail the request if Pinecone save fails
        
        # Use database campaign_id for image storage
        campaign_id = str(campaign_db.id)
        
        # Automatically generate NPC images in the background
        # Extract all unique NPC names from quests
        all_npcs = set()
        for quest_list in transformed_quests.values():
            for quest in quest_list:
                npcs = quest.get("npcs", [])
                for npc in npcs:
                    # Clean NPC name (remove parenthetical descriptions)
                    npc_name = npc.split("(")[0].strip() if "(" in npc else npc.strip()
                    if npc_name:
                        all_npcs.add(npc_name)
        
        # Generate images for all NPCs in background (don't block response)
        if all_npcs:
            print(f"🎨 Auto-generating images for {len(all_npcs)} NPCs: {', '.join(list(all_npcs)[:5])}{'...' if len(all_npcs) > 5 else ''}")
            
            # Add background task to generate NPC images
            background_tasks.add_task(
                generate_npc_images_sync,
                npc_names=list(all_npcs),
                campaign_id=campaign_id,
                campaign_data=campaign_response.dict(),
                user_id=current_user.id if current_user else None
            )
        
        return campaign_response
    except Exception as e:
        print(f"Error generating campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign: {str(e)}")


def generate_npc_images_sync(
    npc_names: List[str],
    campaign_id: str,
    campaign_data: Dict[str, Any],
    user_id: Optional[int],
):
    """
    Synchronously generate images for NPCs found in the campaign.
    This runs as a background task and doesn't block the campaign generation response.
    """
    try:
        from utils.character_generator import generate_npc_portrait
        from utils.database import SessionLocal
        
        # Create a new database session for background task
        db = SessionLocal()
        
        try:
            # Extract NPC descriptions from campaign data if available
            npc_descriptions = {}
            for quest_list in campaign_data.get("quests", {}).values():
                for quest in quest_list:
                    quest_npcs = quest.get("npcs", [])
                    for npc_entry in quest_npcs:
                        # Parse "Name (description)" format
                        if "(" in npc_entry and ")" in npc_entry:
                            name = npc_entry.split("(")[0].strip()
                            desc = npc_entry.split("(")[1].split(")")[0].strip()
                            npc_descriptions[name] = desc
                        else:
                            name = npc_entry.strip()
                            if name and name not in npc_descriptions:
                                npc_descriptions[name] = "A character from the campaign"
            
            # Generate images for each NPC
            for npc_name in npc_names:
                try:
                    # Check if image already exists in database
                    existing = db.query(NPCImage).filter(
                        NPCImage.npc_name == npc_name,
                        NPCImage.campaign_id == campaign_id
                    ).first()
                    
                    if existing:
                        print(f"  ✓ Image already exists for {npc_name}")
                        continue
                    
                    # Get description or use default
                    npc_description = npc_descriptions.get(
                        npc_name,
                        f"A character named {npc_name} from the campaign"
                    )
                    
                    # Generate image
                    print(f"  🎨 Generating image for {npc_name}...")
                    result = generate_npc_portrait(
                        npc_name=npc_name,
                        npc_description=npc_description,
                        quest_context=f"Character from campaign: {campaign_data.get('title', 'Untitled')}"
                    )
                    
                    if "error" in result:
                        print(f"  ⚠️  Failed to generate image for {npc_name}: {result['error']}")
                        continue
                    
                    # Save to database
                    new_image = NPCImage(
                        user_id=user_id,
                        campaign_id=campaign_id,
                        npc_name=npc_name,
                        npc_description=npc_description,
                        quest_context=f"Auto-generated for campaign: {campaign_data.get('title', 'Untitled')}",
                        image_base64=result["image_base64"],
                        prompt_used=result.get("prompt_used", ""),
                    )
                    db.add(new_image)
                    db.commit()
                    print(f"  ✅ Saved image for {npc_name} (ID: {new_image.id})")
                    
                    # Small delay to avoid rate limiting
                    import time
                    time.sleep(0.5)
                    
                except Exception as e:
                    print(f"  ⚠️  Error generating image for {npc_name}: {str(e)}")
                    db.rollback()
                    continue
            
            print(f"🎨 Finished auto-generating NPC images for campaign {campaign_id}")
            
        finally:
            db.close()
        
    except Exception as e:
        print(f"⚠️  Error in background NPC image generation: {str(e)}")
        import traceback
        traceback.print_exc()


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


@app.post("/api/save-campaign")
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
        import json
        
        # Save to database
        campaign_db = Campaign(
            user_id=current_user.id,
            title=request.campaign_data.title,
            background=request.campaign_data.background,
            theme=request.campaign_data.theme,
            campaign_data=json.dumps(request.campaign_data.dict())
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
                    tags=request.tags or []
                )
                print(f"Campaign also saved to Pinecone with ID: {pinecone_id}")
            except Exception as e:
                print(f"Warning: Failed to save to Pinecone: {e}")
        
        return {
            "success": True,
            "campaign_id": campaign_id,
            "message": "Campaign saved successfully"
        }
    except Exception as e:
        print(f"Error saving campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to save campaign: {str(e)}")


@app.get("/api/user/campaigns", response_model=List[Dict[str, Any]])
async def list_user_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all campaigns for the current user
    """
    try:
        campaigns = db.query(Campaign).filter(
            Campaign.user_id == current_user.id
        ).order_by(Campaign.created_at.desc()).all()
        
        return [
            {
                "id": camp.id,
                "title": camp.title,
                "theme": camp.theme,
                "background": camp.background[:200] + "..." if camp.background and len(camp.background) > 200 else camp.background,
                "created_at": camp.created_at.isoformat() if camp.created_at else None,
                "updated_at": camp.updated_at.isoformat() if camp.updated_at else None,
            }
            for camp in campaigns
        ]
    except Exception as e:
        print(f"Error listing campaigns: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to list campaigns: {str(e)}")


@app.get("/api/user/campaigns/{campaign_id}")
async def get_user_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific campaign by ID (only if owned by user)
    """
    try:
        import json
        
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Parse campaign data
        campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}
        
        return campaign_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving campaign: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign: {str(e)}")


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
@app.post("/api/generate-npc-image", response_model=NPCImageResponse)
async def generate_npc_image(
    request: NPCImageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a portrait image for an NPC using OpenAI's image generation API

    This endpoint:
    1. Checks database for existing image (by NPC name and description)
    2. If found, returns stored image
    3. If not found, generates new image using DALL-E 3
    4. Saves new image to database
    5. Returns base64-encoded image

    Useful for DMs who want visual representations of NPCs in their campaigns
    """
    try:
        # First, check database for existing image
        query = db.query(NPCImage).filter(NPCImage.npc_name == request.npc_name)
        
        # If user is authenticated, prefer their images
        if current_user:
            query = query.filter(NPCImage.user_id == current_user.id)
        
        # If campaign_id provided, filter by it
        if request.campaign_id:
            query = query.filter(NPCImage.campaign_id == request.campaign_id)
        
        # Try to find matching image (by name and similar description)
        existing_image = query.first()
        
        if existing_image:
            print(f"Returning stored NPC image from database for: {request.npc_name}")
            return NPCImageResponse(
                npc_name=existing_image.npc_name,
                image_base64=existing_image.image_base64,
                prompt_used=existing_image.prompt_used or "",
            )
        
        # Check if caching is enabled (fallback to LLM cache)
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"
        cache_key = (
            f"npc_image:{request.npc_name}:{request.npc_description}:{request.quest_context or ''}"
        )

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "npc_image")
            if cached_response:
                print(f"Returning cached NPC image for: {request.npc_name}")
                # Save cached image to database for future use
                new_image = NPCImage(
                    user_id=current_user.id if current_user else None,
                    campaign_id=request.campaign_id,
                    npc_name=request.npc_name,
                    npc_description=request.npc_description,
                    quest_context=request.quest_context,
                    image_base64=cached_response["image_base64"],
                    prompt_used=cached_response.get("prompt_used", ""),
                )
                db.add(new_image)
                db.commit()
                return NPCImageResponse(**cached_response)

        print(f"Generating new NPC image for: {request.npc_name}")

        result = generate_npc_portrait(
            npc_name=request.npc_name,
            npc_description=request.npc_description,
            quest_context=request.quest_context,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # Save to database
        new_image = NPCImage(
            user_id=current_user.id if current_user else None,
            campaign_id=request.campaign_id,
            npc_name=result["npc_name"],
            npc_description=request.npc_description,
            quest_context=request.quest_context,
            image_base64=result["image_base64"],
            prompt_used=result.get("prompt_used", ""),
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        
        print(f"Saved NPC image to database (ID: {new_image.id})")

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, {
                "npc_name": result["npc_name"],
                "image_base64": result["image_base64"],
                "prompt_used": result.get("prompt_used", ""),
            }, "npc_image")

        return NPCImageResponse(
            npc_name=result["npc_name"],
            image_base64=result["image_base64"],
            prompt_used=result.get("prompt_used", ""),
        )

    except Exception as e:
        print(f"Error generating NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate NPC image: {str(e)}")


@app.get("/api/npc-images", response_model=List[Dict[str, Any]])
async def list_npc_images(
    campaign_id: Optional[str] = None,
    npc_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    List NPC images from database
    
    Returns stored NPC images filtered by:
    - campaign_id (optional)
    - npc_name (optional)
    - user_id (if authenticated)
    """
    try:
        query = db.query(NPCImage)
        
        # Filter by user if authenticated
        if current_user:
            query = query.filter(NPCImage.user_id == current_user.id)
        
        # Filter by campaign if provided
        if campaign_id:
            query = query.filter(NPCImage.campaign_id == campaign_id)
        
        # Filter by NPC name if provided
        if npc_name:
            query = query.filter(NPCImage.npc_name.ilike(f"%{npc_name}%"))
        
        images = query.order_by(NPCImage.created_at.desc()).all()
        
        return [
            {
                "id": img.id,
                "npc_name": img.npc_name,
                "npc_description": img.npc_description,
                "quest_context": img.quest_context,
                "campaign_id": img.campaign_id,
                "created_at": img.created_at.isoformat() if img.created_at else None,
                "has_image": bool(img.image_base64),
            }
            for img in images
        ]
    except Exception as e:
        print(f"Error listing NPC images: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to list NPC images: {str(e)}")


@app.get("/api/npc-images/{npc_name}", response_model=NPCImageResponse)
async def get_npc_image(
    npc_name: str,
    campaign_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get a specific NPC image by name
    
    Returns the stored image if found in database
    """
    try:
        query = db.query(NPCImage).filter(NPCImage.npc_name == npc_name)
        
        # If user is authenticated, prefer their images
        if current_user:
            query = query.filter(NPCImage.user_id == current_user.id)
        
        # If campaign_id provided, filter by it
        if campaign_id:
            query = query.filter(NPCImage.campaign_id == campaign_id)
        
        image = query.first()
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"NPC image not found for: {npc_name}",
            )
        
        return NPCImageResponse(
            npc_name=image.npc_name,
            image_base64=image.image_base64,
            prompt_used=image.prompt_used or "",
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to retrieve NPC image: {str(e)}")


@app.delete("/api/npc-images/{image_id}")
async def delete_npc_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an NPC image
    
    Only the owner can delete their images
    """
    try:
        image = db.query(NPCImage).filter(NPCImage.id == image_id).first()
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NPC image not found",
            )
        
        # Check if user owns this image
        if image.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this image",
            )
        
        db.delete(image)
        db.commit()
        
        return {"success": True, "message": "NPC image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to delete NPC image: {str(e)}")


@app.post("/api/generate-monsters", response_model=MonsterResponse)
async def generate_monsters(request: MonsterGenerationRequest):
    """
    Generate monsters for a specific combat quest
    """
    try:
        # Check if caching is enabled
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"

        # Create cache key from request
        cache_key = f"monsters:{request.quest_name}:{request.difficulty}"

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "monsters")
            if cached_response:
                print(f"Returning cached monsters for: {request.quest_name}")
                return MonsterResponse(**cached_response)

        print(f"Generating new monsters for: {request.quest_name}")

        # Initialize LLM
        model = initialize_llm()

        # Create quest dictionary
        quest = {
            "quest_name": request.quest_name,
            "description": request.quest_description,
            "quest_type": request.quest_type,
            "difficulty": request.difficulty,
            "locations": request.locations,
            "objectives": request.objectives
        }

        # Generate monsters
        monsters = generate_monsters_for_quest(model, quest, request.quest_context)

        # Create response
        response_data = {
            "quest_name": request.quest_name,
            "monsters": monsters
        }

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, response_data, "monsters")
            print(f"Cached monster response for: {request.quest_name}")

        return MonsterResponse(**response_data)

    except Exception as e:
        print(f"Error generating monsters: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate monsters: {str(e)}")


@app.post("/api/simulate-combat", response_model=CombatResponse)
async def simulate_combat(request: CombatRequest):
    """
    Simulate a combat encounter between a player and a monster
    """
    try:
        print(f"Simulating combat: {request.player_name} vs {request.monster_name}")

        # Create player combatant
        player = create_player_combatant(
            name=request.player_name,
            max_hp=request.player_max_hp,
            armor_class=request.player_armor_class,
            dexterity_modifier=request.player_dexterity_modifier
        )

        # Create monster combatant
        monster = create_combatant_from_monster(request.monster_data, request.monster_name)

        # Create combat encounter
        encounter = CombatEncounter([player, monster])
        encounter.start_combat()

        # Simulate a few rounds of combat
        max_rounds = 10
        round_count = 0

        while not encounter.is_combat_over() and round_count < max_rounds:
            current_combatant = encounter.get_current_combatant()
            
            if current_combatant == player:
                # Player attacks monster
                # For now, use a simple attack (1d20 + 3, 1d8 + 1 damage)
                attack_result = simulate_attack(player, monster, 3, "1d8", 1)
                encounter.add_combat_log(attack_result["message"])
            else:
                # Monster attacks player
                # Use monster's first action if available
                actions = request.monster_data.get("actions", [])
                if actions:
                    action = actions[0]
                    attack_bonus = action.get("attack_bonus", 0)
                    damage_dice = action.get("damage", "1d6")
                    damage_bonus = 0  # Could extract from damage string
                    
                    attack_result = simulate_attack(monster, player, attack_bonus, damage_dice, damage_bonus)
                    encounter.add_combat_log(attack_result["message"])
                else:
                    # Fallback attack
                    attack_result = simulate_attack(monster, player, 3, "1d6", 0)
                    encounter.add_combat_log(attack_result["message"])

            encounter.next_turn()
            round_count += 1

        # Get final result
        result = encounter.get_combat_result()
        current_combatant = encounter.get_current_combatant()
        current_turn_name = current_combatant.name if current_combatant else "Unknown"

        return CombatResponse(
            combat_log=encounter.combat_log,
            result=result,
            player_hp=player.current_hp,
            monster_hp=monster.current_hp,
            round=encounter.round,
            current_turn=current_turn_name
        )

    except Exception as e:
        print(f"Error simulating combat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to simulate combat: {str(e)}")


@app.post("/api/monster-stat-block/{monster_name}")
async def get_monster_stat_block_endpoint(
    monster_name: str,
    request_body: Dict[str, Any]
):
    """
    Get a formatted stat block for a monster
    """
    try:
        monster_data = request_body.get("monster_data", {})
        stat_block = get_monster_stat_block(monster_data)
        return {"monster_name": monster_name, "stat_block": stat_block}
    except Exception as e:
        print(f"Error generating stat block: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate stat block: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    print("Starting AgenticTableTop API...")
    print("API Documentation: http://localhost:8000/docs")
    print("Interactive API: http://localhost:8000/redoc")
    # Note: reload=True requires running as module (uvicorn api:app --reload)
    # For direct execution, we disable reload for stability
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
