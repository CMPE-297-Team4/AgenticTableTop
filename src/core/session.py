"""
Game Session State Management

This module handles game session state, including current scene, quest progress,
combat state, and narrative history.
"""

import json
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict


class GameSessionState(TypedDict, total=False):
    """Game session state structure"""

    # Current progress
    current_act_index: int
    current_quest_index: int
    current_scene: Optional[str]  # Scene description or location
    current_encounter: Optional[str]  # Current encounter type (combat, dialogue, exploration)

    # Active quest information
    active_quest: Optional[Dict[str, Any]]  # Current quest details
    quest_objectives: List[str]  # Quest objectives and completion status
    completed_objectives: List[str]  # Completed objectives

    # Player information
    player_characters: List[Dict[str, Any]]  # Character data for players in session
    player_positions: Dict[str, str]  # Player positions/locations

    # Turn-based gameplay
    turn_order: List[str]  # List of character names in turn order (includes "DM")
    current_turn_index: int  # Index in turn_order for whose turn it is
    current_turn: str  # Character name or "DM" whose turn it is
    game_started: bool  # Whether the game has been started

    # Combat state (if in combat)
    combat_state: Optional[Dict[str, Any]]  # Combat encounter state
    in_combat: bool

    # Narrative history
    narrative_history: List[Dict[str, Any]]  # List of narrative events
    # Each entry: {"type": "dm_narration" | "player_action" | "combat_event", "content": str, "timestamp": str}

    # Session metadata
    session_start_time: Optional[str]
    last_action_time: Optional[str]
    total_play_time: Optional[int]  # Total play time in seconds


def create_empty_session_state() -> GameSessionState:
    """Create an empty session state"""
    return {
        "current_act_index": 0,
        "current_quest_index": 0,
        "current_scene": None,
        "current_encounter": None,
        "active_quest": None,
        "quest_objectives": [],
        "completed_objectives": [],
        "player_characters": [],
        "player_positions": {},
        "turn_order": ["DM"],  # DM always goes first
        "current_turn_index": 0,
        "current_turn": "DM",
        "game_started": False,
        "combat_state": None,
        "in_combat": False,
        "narrative_history": [],
        "session_start_time": None,
        "last_action_time": None,
        "total_play_time": 0,
    }


def load_session_state(state_json: Optional[str]) -> GameSessionState:
    """Load session state from JSON string"""
    if not state_json:
        return create_empty_session_state()

    try:
        state = json.loads(state_json)
        # Ensure all required fields exist
        default_state = create_empty_session_state()
        default_state.update(state)
        return default_state
    except (json.JSONDecodeError, TypeError):
        return create_empty_session_state()


def save_session_state(state: GameSessionState) -> str:
    """Save session state to JSON string"""
    return json.dumps(state, default=str)


def initialize_turn_order(state: GameSessionState) -> GameSessionState:
    """Initialize turn order with DM first, then players"""
    # DM always goes first
    turn_order = ["DM"]

    # Add all player characters to turn order
    for char in state.get("player_characters", []):
        char_name = char.get("character_name", "")
        if char_name and char_name not in turn_order:
            turn_order.append(char_name)

    state["turn_order"] = turn_order
    state["current_turn_index"] = 0
    state["current_turn"] = turn_order[0] if turn_order else "DM"

    return state


def next_turn(state: GameSessionState) -> GameSessionState:
    """Move to the next turn in the turn order"""
    turn_order = state.get("turn_order", ["DM"])
    if not turn_order:
        return state

    current_index = state.get("current_turn_index", 0)
    next_index = (current_index + 1) % len(turn_order)

    state["current_turn_index"] = next_index
    state["current_turn"] = turn_order[next_index]

    return state


def add_narrative_event(
    state: GameSessionState,
    event_type: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> GameSessionState:
    """Add a narrative event to the history"""
    from datetime import datetime, timedelta

    # Ensure unique timestamps by adding microseconds if needed
    timestamp = datetime.utcnow()

    # If there's a previous event, ensure this timestamp is after it
    if "narrative_history" in state and state["narrative_history"]:
        last_event = state["narrative_history"][-1]
        last_timestamp = datetime.fromisoformat(last_event["timestamp"].replace("Z", "+00:00"))
        if timestamp <= last_timestamp:
            # Add 1 microsecond to ensure chronological order
            timestamp = last_timestamp + timedelta(microseconds=1)

    event = {
        "type": event_type,  # "dm_narration", "player_action", "combat_event", etc.
        "content": content,
        "timestamp": timestamp.isoformat() + "Z",  # Add Z for UTC
    }

    if metadata:
        event["metadata"] = metadata

    if "narrative_history" not in state:
        state["narrative_history"] = []

    state["narrative_history"].append(event)

    print(f"📝 Added {event_type} event at {event['timestamp']}: {content[:50]}...")

    # Keep only last 100 events to prevent unbounded growth
    if len(state["narrative_history"]) > 100:
        state["narrative_history"] = state["narrative_history"][-100:]

    state["last_action_time"] = datetime.utcnow().isoformat()

    return state


def set_active_quest(state: GameSessionState, quest: Dict[str, Any]) -> GameSessionState:
    """Set the active quest and initialize objectives"""
    state["active_quest"] = quest
    state["quest_objectives"] = quest.get("objectives", [])
    state["completed_objectives"] = []
    return state


def complete_objective(state: GameSessionState, objective: str) -> GameSessionState:
    """Mark an objective as completed"""
    if objective in state.get("quest_objectives", []):
        if objective not in state.get("completed_objectives", []):
            if "completed_objectives" not in state:
                state["completed_objectives"] = []
            state["completed_objectives"].append(objective)
    return state


def advance_quest(state: GameSessionState) -> GameSessionState:
    """Advance to the next quest"""
    state["current_quest_index"] = state.get("current_quest_index", 0) + 1
    state["active_quest"] = None
    state["quest_objectives"] = []
    state["completed_objectives"] = []
    return state


def advance_act(state: GameSessionState) -> GameSessionState:
    """Advance to the next act"""
    state["current_act_index"] = state.get("current_act_index", 0) + 1
    state["current_quest_index"] = 0
    state["active_quest"] = None
    state["quest_objectives"] = []
    state["completed_objectives"] = []
    return state


def set_combat_state(state: GameSessionState, combat_state: Dict[str, Any]) -> GameSessionState:
    """Set the combat state"""
    state["combat_state"] = combat_state
    state["in_combat"] = True
    state["current_encounter"] = "combat"
    return state


def clear_combat_state(state: GameSessionState) -> GameSessionState:
    """Clear the combat state"""
    state["combat_state"] = None
    state["in_combat"] = False
    if state.get("current_encounter") == "combat":
        state["current_encounter"] = None
    return state
