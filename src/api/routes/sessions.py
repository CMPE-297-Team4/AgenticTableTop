"""
Game Session management routes
"""

import json
import secrets
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from api.models import CreateSessionRequest, PlayerActionRequest, PlayerActionResponse
from core.dm_agent import DungeonMasterAgent
from core.session import (
    add_narrative_event,
    create_empty_session_state,
    initialize_turn_order,
    load_session_state,
    next_turn,
    save_session_state,
    set_active_quest,
)
from database.models import Campaign, GameSession, PlayerCharacter, User, get_db
from tools.logger import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def generate_invite_code(length: int = 8) -> str:
    """Generate a unique invite code"""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new game session"""
    # Verify campaign exists and belongs to user
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == request.campaign_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Verify all characters exist and belong to user
    characters = (
        db.query(PlayerCharacter)
        .filter(
            PlayerCharacter.id.in_(request.character_ids),
            PlayerCharacter.user_id == current_user.id,
        )
        .all()
    )

    if len(characters) != len(request.character_ids):
        raise HTTPException(status_code=400, detail="One or more characters not found")

    # Create session with empty state
    initial_state = create_empty_session_state()
    initial_state["session_start_time"] = datetime.utcnow().isoformat()

    # Load character data into state
    character_data = []
    for char in characters:
        char_json = json.loads(char.character_data) if char.character_data else {}
        # Include image data in character data
        if char.image_base64:
            if "portrait" not in char_json:
                char_json["portrait"] = {}
            char_json["portrait"]["image_base64"] = char.image_base64
        character_data.append(
            {
                "id": char.id,
                "character_name": char.character_name,
                "data": char_json,
                "image_base64": char.image_base64,  # Also include at top level for easy access
            }
        )
    initial_state["player_characters"] = character_data

    # Initialize turn order (DM first, then players)
    initial_state = initialize_turn_order(initial_state)

    # Generate unique invite code
    invite_code = generate_invite_code()
    # Ensure uniqueness (retry if collision)
    max_retries = 10
    for _ in range(max_retries):
        existing = db.query(GameSession).filter(GameSession.invite_code == invite_code).first()
        if not existing:
            break
        invite_code = generate_invite_code()
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique invite code")

    session = GameSession(
        user_id=current_user.id,
        campaign_id=request.campaign_id,
        session_name=request.session_name,
        invite_code=invite_code,
        current_act_index=0,
        current_quest_index=0,
        session_state=save_session_state(initial_state),
        player_characters=json.dumps(request.character_ids),
        is_active=True,
        last_played_at=datetime.utcnow(),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    logger.info(
        "Game session created",
        extra={
            "extra_fields": {
                "session_id": session.id,
                "session_name": session.session_name,
                "invite_code": invite_code,
                "user_id": current_user.id,
            }
        },
    )

    return {
        "id": session.id,
        "session_name": session.session_name,
        "campaign_id": session.campaign_id,
        "invite_code": invite_code,
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
                "invite_code": session.invite_code,
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


@router.get("/invite/{invite_code}")
async def get_session_by_invite(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get session details by invite code"""
    session = db.query(GameSession).filter(GameSession.invite_code == invite_code.upper()).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or invite code invalid")

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    logger.info(
        "Session accessed via invite code",
        extra={
            "extra_fields": {
                "session_id": session.id,
                "invite_code": invite_code,
                "user_id": current_user.id,
            }
        },
    )

    return {
        "id": session.id,
        "session_name": session.session_name,
        "campaign_id": session.campaign_id,
        "campaign_title": campaign.title if campaign else None,
        "invite_code": session.invite_code,
        "is_active": session.is_active,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }


@router.post("/invite/{invite_code}/join")
async def join_session_by_invite(
    invite_code: str,
    character_id: int = Query(..., description="Character ID to join with"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a game session using an invite code"""
    session = db.query(GameSession).filter(GameSession.invite_code == invite_code.upper()).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found or invite code invalid")

    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session is not active")

    # Verify character exists and belongs to user
    character = (
        db.query(PlayerCharacter)
        .filter(
            PlayerCharacter.id == character_id,
            PlayerCharacter.user_id == current_user.id,
        )
        .first()
    )

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Load session state
    state = load_session_state(session.session_state)

    # Check if character is already in the session
    existing_character_ids = (
        json.loads(session.player_characters) if session.player_characters else []
    )
    if character_id in existing_character_ids:
        raise HTTPException(status_code=400, detail="Character is already in this session")

    # Add character to session
    char_json = json.loads(character.character_data) if character.character_data else {}
    # Include image data in character data
    if character.image_base64:
        if "portrait" not in char_json:
            char_json["portrait"] = {}
        char_json["portrait"]["image_base64"] = character.image_base64
    character_data = {
        "id": character.id,
        "character_name": character.character_name,
        "data": char_json,
        "image_base64": character.image_base64,  # Also include at top level for easy access
    }
    state["player_characters"].append(character_data)

    # Update turn order to include new player
    state = initialize_turn_order(state)

    # Update player_characters list
    existing_character_ids.append(character_id)
    session.player_characters = json.dumps(existing_character_ids)
    session.session_state = save_session_state(state)
    db.commit()

    logger.info(
        "Player joined session via invite",
        extra={
            "extra_fields": {
                "session_id": session.id,
                "invite_code": invite_code,
                "character_id": character_id,
                "user_id": current_user.id,
            }
        },
    )

    return {
        "message": "Successfully joined session",
        "session_id": session.id,
        "session_name": session.session_name,
    }


@router.get("/{session_id}")
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get session details including current state"""
    # Allow session owner OR any user with a character in the session
    session = db.query(GameSession).filter(GameSession.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if user owns the session or has a character in it
    user_owns_session = session.user_id == current_user.id
    user_has_character = False

    if not user_owns_session:
        # Check if user has a character in this session
        character_ids = json.loads(session.player_characters) if session.player_characters else []
        if character_ids:
            user_characters = (
                db.query(PlayerCharacter)
                .filter(
                    PlayerCharacter.id.in_(character_ids),
                    PlayerCharacter.user_id == current_user.id,
                )
                .all()
            )
            user_has_character = len(user_characters) > 0

    if not user_owns_session and not user_has_character:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this session. Join via invite code first.",
        )

    state = load_session_state(session.session_state)

    # Refresh character images from database if needed
    character_ids = json.loads(session.player_characters) if session.player_characters else []
    if character_ids:
        characters = db.query(PlayerCharacter).filter(PlayerCharacter.id.in_(character_ids)).all()
        # Update character images in state
        for char in characters:
            for pc in state.get("player_characters", []):
                if pc.get("id") == char.id:
                    # Update image_base64 if available
                    if char.image_base64:
                        pc["image_base64"] = char.image_base64
                        if "data" in pc and isinstance(pc["data"], dict):
                            if "portrait" not in pc["data"]:
                                pc["data"]["portrait"] = {}
                            pc["data"]["portrait"]["image_base64"] = char.image_base64

    return {
        "id": session.id,
        "session_name": session.session_name,
        "campaign_id": session.campaign_id,
        "invite_code": session.invite_code,
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
    """Start or continue a game session with auto-generated narration"""
    # Allow session owner OR any user with a character in the session
    session = db.query(GameSession).filter(GameSession.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if user owns the session or has a character in it
    user_owns_session = session.user_id == current_user.id
    user_has_character = False

    if not user_owns_session:
        # Check if user has a character in this session
        character_ids = json.loads(session.player_characters) if session.player_characters else []
        if character_ids:
            user_characters = (
                db.query(PlayerCharacter)
                .filter(
                    PlayerCharacter.id.in_(character_ids),
                    PlayerCharacter.user_id == current_user.id,
                )
                .all()
            )
            user_has_character = len(user_characters) > 0

    if not user_owns_session and not user_has_character:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this session. Join via invite code first.",
        )

    # Update last played time
    session.last_played_at = datetime.utcnow()
    session.is_active = True
    db.commit()

    state = load_session_state(session.session_state)

    # Refresh character images from database if needed
    character_ids = json.loads(session.player_characters) if session.player_characters else []
    if character_ids:
        characters = db.query(PlayerCharacter).filter(PlayerCharacter.id.in_(character_ids)).all()
        # Update character images in state
        for char in characters:
            for pc in state.get("player_characters", []):
                if pc.get("id") == char.id:
                    # Update image_base64 if available
                    if char.image_base64:
                        pc["image_base64"] = char.image_base64
                        if "data" in pc and isinstance(pc["data"], dict):
                            if "portrait" not in pc["data"]:
                                pc["data"]["portrait"] = {}
                            pc["data"]["portrait"]["image_base64"] = char.image_base64

    # Load campaign data
    campaign = db.query(Campaign).filter(Campaign.id == session.campaign_id).first()
    campaign_data = json.loads(campaign.campaign_data) if campaign.campaign_data else {}

    # Auto-start game if not started yet OR if there's no narration in history
    initial_narration = None
    narrative_history = state.get("narrative_history", [])
    has_dm_narration = any(
        event.get("type") == "dm_narration" or event.get("event_type") == "dm_narration"
        for event in narrative_history
    )

    if not state.get("game_started", False) or not has_dm_narration:
        # Get first act and first quest
        acts = campaign_data.get("acts", [])
        if acts and len(acts) > 0:
            first_act = acts[0]
            act_title = first_act.get("act_title", "")

            # Get first quest from first act
            quests = campaign_data.get("quests", {})
            act_quests = quests.get(act_title, [])

            if act_quests and len(act_quests) > 0:
                first_quest = act_quests[0]

                # Set active quest
                state = set_active_quest(state, first_quest)
                state["current_act_index"] = 0
                state["current_quest_index"] = 0

                # Initialize turn order if not already done
                if not state.get("turn_order") or len(state.get("turn_order", [])) <= 1:
                    state = initialize_turn_order(state)

                # Check for cached narration first (FAST PATH)
                cached_narration = state.get("cached_scene_narration")
                cached_quest_id = state.get("cached_narration_quest_id")
                current_quest_id = first_quest.get("name") if first_quest else None

                if (
                    cached_narration
                    and cached_quest_id == current_quest_id
                    and cached_narration.get("narration")
                ):
                    # Use cached narration (instant!)
                    logger.info(
                        "Using cached narration for initial scene",
                        extra={
                            "extra_fields": {
                                "session_id": session.id,
                                "quest_id": current_quest_id,
                            }
                        },
                    )
                    initial_narration = cached_narration

                    # Add to narrative history if not already there
                    if initial_narration and "narration" in initial_narration:
                        has_cached_in_history = any(
                            event.get("type") == "dm_narration"
                            and event.get("content") == initial_narration.get("narration")
                            for event in narrative_history
                        )
                        if not has_cached_in_history:
                            state = add_narrative_event(
                                state,
                                "dm_narration",
                                initial_narration.get("narration", ""),
                            )
                else:
                    # Generate new narration (SLOW PATH - only if no cache)
                    from core.dm_agent import DungeonMasterAgent

                    dm_agent = DungeonMasterAgent(use_rag=True)

                    try:
                        initial_narration = dm_agent.narrate_scene_with_voice(
                            campaign_data=campaign_data,
                            quest=first_quest,
                            narrative_history=narrative_history,
                            location=first_quest.get("location", None),
                            voice="fable",  # Mystical storytelling voice
                        )

                        # Cache the narration for future loads
                        state["cached_scene_narration"] = initial_narration
                        state["cached_narration_quest_id"] = current_quest_id

                        # Add to narrative history
                        if initial_narration and "narration" in initial_narration:
                            state = add_narrative_event(
                                state,
                                "dm_narration",
                                initial_narration.get("narration", ""),
                            )

                        logger.info(
                            "Generated initial narration",
                            extra={
                                "extra_fields": {
                                    "session_id": session.id,
                                    "has_narration": bool(
                                        initial_narration and initial_narration.get("narration")
                                    ),
                                }
                            },
                        )
                    except Exception as e:
                        logger.error(
                            "Failed to generate initial narration",
                            extra={
                                "extra_fields": {
                                    "session_id": session.id,
                                    "error": str(e),
                                    "error_type": type(e).__name__,
                                }
                            },
                        )
                        # Use fallback narration
                        initial_narration = {
                            "narration": "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead.",
                            "environmental_details": [],
                            "mood": "mysterious",
                        }

                # Mark game as started
                state["game_started"] = True

                # After DM's initial narration, advance turn to first player
                # This allows players to start taking actions immediately
                if state.get("turn_order") and len(state.get("turn_order", [])) > 1:
                    state = next_turn(state)

                # Save updated state
                session.session_state = save_session_state(state)
                db.commit()

    return {
        "session_id": session.id,
        "session_name": session.session_name,
        "campaign": campaign_data,
        "state": state,
        "initial_narration": initial_narration,  # Include narration with voice
    }


@router.post("/{session_id}/advance-turn")
async def advance_turn(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Advance to the next turn in the turn order"""
    session = (
        db.query(GameSession)
        .filter(GameSession.id == session_id, GameSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load session state
    state = load_session_state(session.session_state)

    # Advance to next turn
    state = next_turn(state)

    # Save updated state
    session.session_state = save_session_state(state)
    db.commit()

    logger.info(
        "Turn advanced",
        extra={
            "extra_fields": {
                "session_id": session.id,
                "previous_turn": state.get("turn_order", [])[
                    (state.get("current_turn_index", 0) - 1) % len(state.get("turn_order", ["DM"]))
                ],
                "current_turn": state.get("current_turn", "DM"),
                "turn_order": state.get("turn_order", []),
            }
        },
    )

    return {
        "message": "Turn advanced successfully",
        "current_turn": state.get("current_turn", "DM"),
        "state": state,
    }


@router.post("/{session_id}/save")
async def save_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save the current session state"""
    # Allow session owner OR any user with a character in the session
    session = db.query(GameSession).filter(GameSession.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if user owns the session or has a character in it
    user_owns_session = session.user_id == current_user.id
    user_has_character = False

    if not user_owns_session:
        # Check if user has a character in this session
        character_ids = json.loads(session.player_characters) if session.player_characters else []
        if character_ids:
            user_characters = (
                db.query(PlayerCharacter)
                .filter(
                    PlayerCharacter.id.in_(character_ids),
                    PlayerCharacter.user_id == current_user.id,
                )
                .all()
            )
            user_has_character = len(user_characters) > 0

    if not user_owns_session and not user_has_character:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this session. Join via invite code first.",
        )

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

    # Check if it's this player's turn
    current_turn = state.get("current_turn", "DM")
    if current_turn != action.character_name:
        raise HTTPException(
            status_code=400,
            detail=f"It's not {action.character_name}'s turn. Current turn: {current_turn}",
        )

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
    dm_result = dm_agent.respond_to_action_with_voice(
        action=action.dict(),
        campaign_data=campaign_data,
        quest=state.get("active_quest"),
        character_data=character_data,
        narrative_history=state.get("narrative_history", []),
        # Voice will be auto-selected based on campaign theme
    )

    dm_response = dm_result.get("narration", "The DM acknowledges your action.")

    # Add dice roll to narrative history if one was made
    if dm_result.get("requires_roll", False) and dm_result.get("roll_details"):
        roll_details = dm_result["roll_details"]
        roll_type = dm_result.get("roll_type", "unknown")
        dice_rolled = roll_details.get("dice_rolled", "d20")
        roll_result = roll_details.get("roll_result", 0)
        total = roll_details.get("total", roll_result)

        roll_description = f"DM rolled {dice_rolled}: {roll_result}"
        if roll_details.get("modifier", 0) != 0:
            roll_description += f" + {roll_details.get('modifier')} = {total}"
        if roll_details.get("dc", 0) > 0:
            success = roll_details.get("success", False)
            roll_description += (
                f" vs DC {roll_details.get('dc')} ({'Success' if success else 'Failure'})"
            )

        state = add_narrative_event(
            state,
            "dm_dice_roll",
            roll_description,
            {"roll_type": roll_type, "roll_details": roll_details},
        )

    # Apply state changes if any
    if "state_changes" in dm_result:
        state.update(dm_result["state_changes"])

    # Add DM response to narrative
    state = add_narrative_event(state, "dm_narration", dm_response)

    # Move to next turn after player action
    state = next_turn(state)

    # Save updated state
    session.session_state = save_session_state(state)
    session.last_played_at = datetime.utcnow()
    db.commit()

    # Extract audio data if available
    audio_data = dm_result.get("audio_data")

    return PlayerActionResponse(
        result="success",
        dm_narration=dm_response,
        state_update=state,
        audio_data=audio_data,
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
