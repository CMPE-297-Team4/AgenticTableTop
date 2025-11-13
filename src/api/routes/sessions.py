"""
Game Session management routes
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from api.models import PlayerActionRequest, PlayerActionResponse
from core.dm_agent import DungeonMasterAgent
from core.session import (
    add_narrative_event,
    create_empty_session_state,
    load_session_state,
    save_session_state,
)
from database.models import Campaign, GameSession, PlayerCharacter, User, get_db

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_session(
    campaign_id: int,
    session_name: str,
    character_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new game session"""
    # Verify campaign exists and belongs to user
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Verify all characters exist and belong to user
    characters = (
        db.query(PlayerCharacter)
        .filter(
            PlayerCharacter.id.in_(character_ids),
            PlayerCharacter.user_id == current_user.id,
        )
        .all()
    )

    if len(characters) != len(character_ids):
        raise HTTPException(status_code=400, detail="One or more characters not found")

    # Create session with empty state
    initial_state = create_empty_session_state()
    initial_state["session_start_time"] = datetime.utcnow().isoformat()

    # Load character data into state
    character_data = []
    for char in characters:
        char_json = json.loads(char.character_data) if char.character_data else {}
        character_data.append(
            {
                "id": char.id,
                "character_name": char.character_name,
                "data": char_json,
            }
        )
    initial_state["player_characters"] = character_data

    session = GameSession(
        user_id=current_user.id,
        campaign_id=campaign_id,
        session_name=session_name,
        current_act_index=0,
        current_quest_index=0,
        session_state=save_session_state(initial_state),
        player_characters=json.dumps(character_ids),
        is_active=True,
        last_played_at=datetime.utcnow(),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "session_name": session.session_name,
        "campaign_id": session.campaign_id,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }


@router.get("")
async def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all game sessions for the current user"""
    sessions = (
        db.query(GameSession)
        .filter(GameSession.user_id == current_user.id)
        .order_by(GameSession.last_played_at.desc())
        .all()
    )

    result = []
    for session in sessions:
        result.append(
            {
                "id": session.id,
                "session_name": session.session_name,
                "campaign_id": session.campaign_id,
                "current_act_index": session.current_act_index,
                "current_quest_index": session.current_quest_index,
                "is_active": session.is_active,
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "last_played_at": (
                    session.last_played_at.isoformat() if session.last_played_at else None
                ),
            }
        )

    return result


@router.get("/{session_id}")
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get session details including current state"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    state = load_session_state(session.session_state)

    return {
        "id": session.id,
        "session_name": session.session_name,
        "campaign_id": session.campaign_id,
        "current_act_index": session.current_act_index,
        "current_quest_index": session.current_quest_index,
        "is_active": session.is_active,
        "state": state,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "last_played_at": session.last_played_at.isoformat() if session.last_played_at else None,
    }


@router.post("/{session_id}/start")
async def start_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start or continue a game session"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update last played time
    session.last_played_at = datetime.utcnow()
    session.is_active = True
    db.commit()

    state = load_session_state(session.session_state)

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

    return {
        "session_id": session.id,
        "session_name": session.session_name,
        "campaign": campaign_data,
        "state": state,
    }


@router.post("/{session_id}/save")
async def save_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save the current session state"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load current state from request body (if provided) or keep existing
    # For now, we'll just update the timestamp
    state = load_session_state(session.session_state)
    session.session_state = save_session_state(state)
    session.updated_at = datetime.utcnow()
    session.last_played_at = datetime.utcnow()

    db.commit()

    return {"message": "Session saved successfully", "session_id": session.id}


@router.post("/{session_id}/action", response_model=PlayerActionResponse)
async def player_action(
    session_id: int,
    action: PlayerActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process a player action and return DM response"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load session state
    state = load_session_state(session.session_state)

    # Add player action to narrative history
    state = add_narrative_event(
        state,
        "player_action",
        f"Player {action.character_name} performs {action.action_type}: {action.description}",
        {"action": action.dict()},
    )

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    campaign_data = (
        json.loads(campaign.campaign_data) if campaign.campaign_data else {} if campaign else {}
    )

    # Find character data
    character_data = None
    for char in state.get("player_characters", []):
        if char.get("character_name") == action.character_name:
            character_data = char.get("data", {})
            break

    # Process action through DM agent
    dm_agent = DungeonMasterAgent(use_rag=True)
    dm_result = dm_agent.respond_to_action(
        action=action.dict(),
        campaign_data=campaign_data,
        quest=state.get("active_quest"),
        character_data=character_data,
        narrative_history=state.get("narrative_history", []),
    )

    dm_response = dm_result.get("narration", "The DM acknowledges your action.")

    # Apply state changes if any
    if "state_changes" in dm_result:
        state.update(dm_result["state_changes"])

    # Add DM response to narrative
    state = add_narrative_event(state, "dm_narration", dm_response)

    # Save updated state
    session.session_state = save_session_state(state)
    session.last_played_at = datetime.utcnow()
    db.commit()

    return PlayerActionResponse(
        result="success",
        dm_narration=dm_response,
        state_update=state,
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a game session"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()

    return None
