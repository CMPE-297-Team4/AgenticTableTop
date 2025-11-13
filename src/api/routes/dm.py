"""
Dungeon Master Agent API routes
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from api.models import PlayerActionRequest
from core.dm_agent import DungeonMasterAgent
from database.models import Campaign, GameSession, User, get_db
from services.tts import generate_speech

router = APIRouter(prefix="/api/dm", tags=["dungeon-master"])


@router.post("/narrate-scene")
async def narrate_scene(
    session_id: int,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scene narration from DM agent"""
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

    # Initialize DM agent
    dm_agent = DungeonMasterAgent(use_rag=True)

    # Generate narration
    result = dm_agent.narrate_scene(
        campaign_data=campaign_data,
        quest=quest,
        narrative_history=narrative_history,
        location=location,
    )

    return result


@router.post("/respond-action")
async def respond_to_action(
    session_id: int,
    action: PlayerActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get DM response to a player action"""
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

    # Get response
    result = dm_agent.respond_to_action(
        action=action.dict(),
        campaign_data=campaign_data,
        quest=quest,
        character_data=character_data,
        narrative_history=narrative_history,
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
    session_id: int,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scene narration as audio (TTS)"""
    # Get text narration first
    narration_result = await narrate_scene(session_id, location, db, current_user)

    narration_text = narration_result.get("narration", "The scene unfolds before you...")

    # Generate audio
    try:
        audio_data = generate_speech(narration_text)

        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": 'attachment; filename="narration.mp3"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")
