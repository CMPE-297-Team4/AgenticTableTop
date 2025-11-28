"""
Dungeon Master Agent API routes
"""

import json
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from api.models import PlayerActionRequest
from core.dm_agent import DungeonMasterAgent
from core.session import add_narrative_event, load_session_state, next_turn, save_session_state
from database.models import Campaign, GameSession, User, get_db
from services.tts import generate_speech
from tools.utils import dice_roll

router = APIRouter(prefix="/api/dm", tags=["dungeon-master"])


@router.post("/narrate-scene")
async def narrate_scene(
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scene narration from DM agent - uses caching to avoid regeneration"""
    session_id = request.get("session_id")
    location = request.get("location")
    force_regenerate = request.get("force_regenerate", False)

    if not session_id:
        raise HTTPException(status_code=422, detail="session_id is required")

    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

    # Load session state
    from core.session import load_session_state, save_session_state

    state = load_session_state(session.session_state)
    quest = state.get("active_quest")
    narrative_history = state.get("narrative_history", [])

    # Check for cached narration
    cached_narration = state.get("cached_scene_narration")
    cached_quest_id = state.get("cached_narration_quest_id")
    current_quest_id = quest.get("name") if quest else None

    # Return cached narration if it exists and quest hasn't changed
    if (
        not force_regenerate
        and cached_narration
        and cached_quest_id == current_quest_id
        and cached_narration.get("narration")
    ):
        return cached_narration

    # Initialize DM agent
    dm_agent = DungeonMasterAgent(use_rag=True)

    # Generate narration with voice
    result = dm_agent.narrate_scene_with_voice(
        campaign_data=campaign_data,
        quest=quest,
        narrative_history=narrative_history,
        location=location,
        voice="fable",  # DM voice - mystical storytelling tone
    )

    # Cache the narration in session state
    state["cached_scene_narration"] = result
    state["cached_narration_quest_id"] = current_quest_id

    # Save updated state
    session.session_state = save_session_state(state)
    db.commit()

    return result


@router.post("/generate-audio")
async def generate_audio_for_text(
    request: Dict[str, Any] = Body(...),
):
    """Generate audio for a given text on-demand"""
    try:
        import base64

        from services.tts import generate_speech

        text = request.get("text", "")
        theme = request.get("theme", "")

        if not text:
            raise HTTPException(status_code=400, detail="Text is required")

        print(f"Generating audio on-demand for text: {text[:100]}...")
        print(f"Theme: {theme}")

        # Generate audio
        audio_data = generate_speech(text=text, theme=theme, add_modulation=True)

        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        print(f"✅ Generated audio: {len(audio_base64)} chars")

        return {"audio_data": audio_base64, "audio_format": "mp3"}
    except Exception as e:
        print(f"❌ Failed to generate audio: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")


@router.post("/respond-action")
async def respond_to_action(
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get DM response to a player action"""
    session_id = request.get("session_id")
    action_data = request.get("action")

    if not session_id:
        raise HTTPException(status_code=422, detail="session_id is required")
    if not action_data:
        raise HTTPException(status_code=422, detail="action is required")

    # Convert action dict to PlayerActionRequest
    action = PlayerActionRequest(**action_data)

    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

    # Load session state
    from core.session import load_session_state

    state = load_session_state(session.session_state)
    quest = state.get("active_quest")
    narrative_history = state.get("narrative_history", [])

    # Find character data
    character_data = None
    for char in state.get("player_characters", []):
        if char.get("character_name") == action.character_name:
            character_data = char.get("data", {})
            break

    # Initialize DM agent
    dm_agent = DungeonMasterAgent(use_rag=True)

    # Get response with voice
    result = dm_agent.respond_to_action_with_voice(
        action=action.dict(),
        campaign_data=campaign_data,
        quest=quest,
        character_data=character_data,
        narrative_history=narrative_history,
        voice="fable",  # DM voice - mystical storytelling tone
    )

    return result


@router.post("/advance-quest")
async def advance_quest(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check quest progression and advance if complete"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

    # Load session state
    from core.session import load_session_state

    state = load_session_state(session.session_state)
    quest = state.get("active_quest")
    completed_objectives = state.get("completed_objectives", [])
    narrative_history = state.get("narrative_history", [])

    if not quest:
        raise HTTPException(status_code=400, detail="No active quest")

    # Initialize DM agent
    dm_agent = DungeonMasterAgent(use_rag=True)

    # Check progression
    result = dm_agent.check_quest_progression(
        quest=quest,
        completed_objectives=completed_objectives,
        campaign_data=campaign_data,
        narrative_history=narrative_history,
    )

    return result


@router.post("/narrate-combat")
async def narrate_combat(
    session_id: int,
    action_description: str,
    attacker: str,
    target: str,
    damage: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get combat narration from DM agent"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    campaign_data = (
        json.loads(campaign.campaign_data) if campaign.campaign_data else {} if campaign else {}
    )

    # Initialize DM agent
    dm_agent = DungeonMasterAgent(use_rag=True)

    # Generate narration
    result = dm_agent.narrate_combat(
        action_description=action_description,
        attacker=attacker,
        target=target,
        damage=damage,
        campaign_data=campaign_data,
    )

    return result


@router.post("/narrate-scene/audio")
async def narrate_scene_audio(
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scene narration as audio (TTS)"""
    session_id = request.get("session_id")
    location = request.get("location")

    if not session_id:
        raise HTTPException(status_code=422, detail="session_id is required")

    # Get session and load data
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

    # Load session state
    from core.session import load_session_state

    state = load_session_state(session.session_state)
    quest = state.get("active_quest")
    narrative_history = state.get("narrative_history", [])

    # Initialize DM agent and get narration
    dm_agent = DungeonMasterAgent(use_rag=True)
    narration_result = dm_agent.narrate_scene_with_voice(
        campaign_data=campaign_data,
        quest=quest,
        narrative_history=narrative_history,
        location=location,
        voice="alloy",
    )

    narration_text = narration_result.get("narration", "The scene unfolds before you...")

    # Generate audio with mystical storytelling voice and slower speed
    try:
        # Get theme from campaign
        theme = (
            campaign.get("key_themes", [""])[0]
            if campaign.get("key_themes")
            else campaign.get("theme", "")
        )

        audio_data = generate_speech(
            narration_text,
            voice="fable",  # Will be overridden by theme
            theme=theme,
            add_modulation=True,
        )

        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": 'attachment; filename="narration.mp3"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")


@router.post("/{session_id}/roll-dice")
async def roll_dice(
    session_id: int,
    dice_type: str = "d20",  # e.g., "d20", "d6", "d100"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    DM rolls dice for the game.
    Only works when it's DM's turn.
    """
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    state = load_session_state(session.session_state)

    # Check if it's DM's turn
    current_turn = state.get("current_turn", "DM")
    if current_turn != "DM":
        raise HTTPException(
            status_code=400,
            detail=f"It's not the DM's turn. Current turn: {current_turn}",
        )

    # Parse dice type (e.g., "d20" -> 20)
    try:
        if dice_type.startswith("d") or dice_type.startswith("D"):
            dice_size = int(dice_type[1:])
        else:
            dice_size = int(dice_type)

        result = dice_roll(dice_size)
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=400, detail=f"Invalid dice type: {dice_type}. Use format 'd20', 'd6', etc."
        )

    # Add dice roll to narrative history
    state = add_narrative_event(
        state,
        "dm_dice_roll",
        f"DM rolls {dice_type}: {result}",
        {"dice_type": dice_type, "result": result},
    )

    # Move to next turn after DM action
    state = next_turn(state)

    # Save state
    session.session_state = save_session_state(state)
    db.commit()

    return {
        "dice_type": dice_type,
        "result": result,
        "current_turn": state.get("current_turn", "DM"),
        "state": state,
    }
