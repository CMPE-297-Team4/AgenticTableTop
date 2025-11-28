"""
Gameplay State Machine and Manager

Manages the overall gameplay flow, state transitions, and coordination between
DM agent, monster agents, and player actions.
"""

from enum import Enum
from typing import Any, Dict, Optional

from core.dm_agent import DungeonMasterAgent
from core.session import GameSessionState


class GameplayState(Enum):
    """Gameplay state types"""

    EXPLORATION = "exploration"  # Free exploration, no active encounter
    COMBAT = "combat"  # In active combat
    DIALOGUE = "dialogue"  # In dialogue/negotiation
    QUEST_COMPLETE = "quest_complete"  # Quest just completed
    CUTSCENE = "cutscene"  # DM narration/cutscene


class GameplayManager:
    """Manages gameplay flow and state transitions"""

    def __init__(self, session_state: GameSessionState, campaign_data: Dict[str, Any]):
        """
        Initialize gameplay manager.

        Args:
            session_state: Current game session state
            campaign_data: Full campaign data
        """
        self.state = session_state
        self.campaign_data = campaign_data
        self.dm_agent = DungeonMasterAgent(use_rag=True)
        self.current_state = self._determine_current_state()

    def _determine_current_state(self) -> GameplayState:
        """Determine current gameplay state from session state"""
        if self.state.get("in_combat", False):
            return GameplayState.COMBAT
        elif self.state.get("current_encounter") == "dialogue":
            return GameplayState.DIALOGUE
        elif self.state.get("quest_complete", False):
            return GameplayState.QUEST_COMPLETE
        else:
            return GameplayState.EXPLORATION

    def transition_to_combat(self, combat_state: Dict[str, Any]) -> GameplayState:
        """Transition to combat state"""
        from core.session import set_combat_state

        self.state = set_combat_state(self.state, combat_state)
        self.current_state = GameplayState.COMBAT
        return self.current_state

    def transition_to_exploration(self) -> GameplayState:
        """Transition to exploration state"""
        from core.session import clear_combat_state

        self.state = clear_combat_state(self.state)
        self.current_state = GameplayState.EXPLORATION
        return self.current_state

    def transition_to_dialogue(
        self, npc_name: str, dialogue_context: Dict[str, Any]
    ) -> GameplayState:
        """Transition to dialogue state"""
        self.state["current_encounter"] = "dialogue"
        self.state["dialogue_npc"] = npc_name
        self.state["dialogue_context"] = dialogue_context
        self.current_state = GameplayState.DIALOGUE
        return self.current_state

    def get_current_scene_narration(self, location: Optional[str] = None) -> Dict[str, Any]:
        """Get current scene narration from DM"""
        quest = self.state.get("active_quest")
        narrative_history = self.state.get("narrative_history", [])

        return self.dm_agent.narrate_scene(
            campaign_data=self.campaign_data,
            quest=quest,
            narrative_history=narrative_history,
            location=location,
        )

    def process_player_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a player action and return result.

        Args:
            action: Player action details

        Returns:
            Dict with result, narration, and state updates
        """
        # Find character data
        character_data = None
        for char in self.state.get("player_characters", []):
            if char.get("character_name") == action.get("character_name"):
                character_data = char.get("data", {})
                break

        # Get DM response
        quest = self.state.get("active_quest")
        narrative_history = self.state.get("narrative_history", [])

        dm_result = self.dm_agent.respond_to_action(
            action=action,
            campaign_data=self.campaign_data,
            quest=quest,
            character_data=character_data,
            narrative_history=narrative_history,
        )

        # Apply state changes
        if "state_changes" in dm_result:
            self.state.update(dm_result["state_changes"])

        return dm_result

    def check_quest_completion(self) -> Dict[str, Any]:
        """Check if current quest is complete"""
        quest = self.state.get("active_quest")
        completed_objectives = self.state.get("completed_objectives", [])
        narrative_history = self.state.get("narrative_history", [])

        if not quest:
            return {
                "quest_complete": False,
                "narration": "No active quest",
            }

        result = self.dm_agent.check_quest_progression(
            quest=quest,
            completed_objectives=completed_objectives,
            campaign_data=self.campaign_data,
            narrative_history=narrative_history,
        )

        if result.get("quest_complete", False):
            self.state["quest_complete"] = True
            self.current_state = GameplayState.QUEST_COMPLETE

        return result

    def get_state(self) -> GameplayState:
        """Get current gameplay state"""
        return self.current_state

    def get_session_state(self) -> GameSessionState:
        """Get current session state"""
        return self.state
