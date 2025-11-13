"""
AI Dungeon Master Agent

This module implements the AI Dungeon Master agent that:
- Narrates scenes and environments
- Responds to player actions
- Manages quest progression
- Provides combat narration
- Uses RAG for campaign knowledge retrieval
"""

import json
from typing import Any, Dict, List, Optional

from core.dm_prompts import (
    ACTION_RESPONSE_PROMPT,
    COMBAT_NARRATION_PROMPT,
    QUEST_PROGRESSION_PROMPT,
    SCENE_NARRATION_PROMPT,
)
from core.model import initialize_llm

# Optional RAG service import
try:
    from services.rag import get_rag_service

    _rag_available = True
except ImportError:
    get_rag_service = None  # type: ignore
    _rag_available = False


class DungeonMasterAgent:
    """AI Dungeon Master agent for managing gameplay"""

    def __init__(self, use_rag: bool = True, rag_namespace: Optional[str] = None):
        """
        Initialize the DM agent.

        Args:
            use_rag: Whether to use RAG for campaign knowledge retrieval
            rag_namespace: Namespace for RAG knowledge base (defaults to campaign-rules)
        """
        self.model = initialize_llm()
        self.use_rag = use_rag
        self.rag_namespace = rag_namespace or "campaign-rules"
        self.rag_service = None

        if use_rag and _rag_available:
            try:
                self.rag_service = get_rag_service()
            except Exception as e:
                print(f"Warning: RAG service not available: {e}")
                self.use_rag = False
        elif use_rag and not _rag_available:
            print("Warning: RAG service dependencies not installed. RAG disabled.")
            self.use_rag = False

    def _get_campaign_context(
        self, campaign_data: Dict[str, Any], quest: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build campaign context string for prompts"""
        context = f"Campaign: {campaign_data.get('title', 'Unknown')}\n"
        context += f"Background: {campaign_data.get('background', '')}\n"
        context += f"Theme: {campaign_data.get('theme', '')}\n"

        if quest:
            context += f"\nCurrent Quest: {quest.get('quest_name', 'Unknown')}\n"
            context += f"Quest Type: {quest.get('quest_type', 'Unknown')}\n"
            context += f"Description: {quest.get('quest_description', '')}\n"
            context += f"Objectives: {', '.join(quest.get('objectives', []))}\n"

        # Add RAG context if available
        if self.use_rag and self.rag_service:
            try:
                query = f"{campaign_data.get('title', '')} {campaign_data.get('background', '')}"
                if quest:
                    query += f" {quest.get('quest_name', '')} {quest.get('quest_description', '')}"
                rag_context = self.rag_service.retrieve_context(
                    query=query, namespace=self.rag_namespace, top_k=3
                )
                context += f"\n\nAdditional Campaign Knowledge:\n{rag_context}\n"
            except Exception as e:
                print(f"Warning: RAG retrieval failed: {e}")

        return context

    def narrate_scene(
        self,
        campaign_data: Dict[str, Any],
        quest: Optional[Dict[str, Any]] = None,
        narrative_history: Optional[List[Dict[str, Any]]] = None,
        location: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate scene narration.

        Args:
            campaign_data: Full campaign data
            quest: Current quest (optional)
            narrative_history: Previous narrative events (optional)
            location: Specific location to describe (optional)

        Returns:
            Dict with narration, environmental_details, and mood
        """
        context = self._get_campaign_context(campaign_data, quest)

        # Build narrative history context
        history_context = ""
        if narrative_history:
            recent_events = narrative_history[-5:]  # Last 5 events
            history_context = "\nRecent Events:\n"
            for event in recent_events:
                history_context += f"- {event.get('type', 'unknown')}: {event.get('content', '')}\n"

        prompt = f"""{SCENE_NARRATION_PROMPT}

# Campaign Context
{context}

{history_context}

# Location
{location or "Current scene location"}

# Your Response
Generate a scene narration based on the campaign context and current quest.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            # Remove markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except json.JSONDecodeError:
            # Fallback: return plain text narration
            return {
                "narration": (
                    content if "content" in locals() else "The scene unfolds before you..."
                ),
                "environmental_details": [],
                "mood": "mysterious",
            }
        except Exception as e:
            return {
                "error": f"Failed to generate narration: {str(e)}",
                "narration": "The scene unfolds before you...",
                "environmental_details": [],
                "mood": "mysterious",
            }

    def respond_to_action(
        self,
        action: Dict[str, Any],
        campaign_data: Dict[str, Any],
        quest: Optional[Dict[str, Any]] = None,
        character_data: Optional[Dict[str, Any]] = None,
        narrative_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Respond to a player action.

        Args:
            action: Player action details (action_type, description, target, etc.)
            campaign_data: Full campaign data
            quest: Current quest (optional)
            character_data: Character performing the action (optional)
            narrative_history: Previous narrative events (optional)

        Returns:
            Dict with result, narration, roll requirements, and state changes
        """
        context = self._get_campaign_context(campaign_data, quest)

        # Build character context
        character_context = ""
        if character_data:
            character_context = f"\nCharacter: {character_data.get('character_name', 'Unknown')}\n"
            character_context += (
                f"Class/Level: {character_data.get('class_and_level', 'Unknown')}\n"
            )
            if "abilities" in character_data:
                character_context += f"Abilities: {json.dumps(character_data['abilities'])}\n"

        # Build action context
        action_context = f"""
Action Type: {action.get('action_type', 'Unknown')}
Description: {action.get('description', '')}
Target: {action.get('target', 'None')}
Parameters: {json.dumps(action.get('parameters', {}))}
"""

        prompt = f"""{ACTION_RESPONSE_PROMPT}

# Campaign Context
{context}

{character_context}

# Player Action
{action_context}

# Your Response
Determine the outcome of this action and provide appropriate narration.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except json.JSONDecodeError:
            # Fallback: return basic response
            return {
                "result": "success",
                "narration": content if "content" in locals() else "Your action is successful.",
                "requires_roll": False,
                "roll_type": "none",
                "state_changes": {},
            }
        except Exception as e:
            return {
                "error": f"Failed to process action: {str(e)}",
                "result": "failure",
                "narration": "Something goes wrong...",
                "requires_roll": False,
                "roll_type": "none",
                "state_changes": {},
            }

    def check_quest_progression(
        self,
        quest: Dict[str, Any],
        completed_objectives: List[str],
        campaign_data: Dict[str, Any],
        narrative_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Check quest progression and determine if objectives are complete.

        Args:
            quest: Current quest data
            completed_objectives: List of completed objective names
            campaign_data: Full campaign data
            narrative_history: Previous narrative events (optional)

        Returns:
            Dict with objectives_completed, quest_complete, narration, and next_quest
        """
        context = self._get_campaign_context(campaign_data, quest)

        objectives_context = f"""
Quest Objectives: {', '.join(quest.get('objectives', []))}
Completed Objectives: {', '.join(completed_objectives)}
"""

        prompt = f"""{QUEST_PROGRESSION_PROMPT}

# Campaign Context
{context}

# Quest Status
{objectives_context}

# Your Response
Determine if any objectives are complete and if the quest is finished.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except json.JSONDecodeError:
            # Fallback: check objectives manually
            all_objectives = quest.get("objectives", [])
            quest_complete = len(completed_objectives) >= len(all_objectives)

            return {
                "objectives_completed": completed_objectives,
                "quest_complete": quest_complete,
                "narration": (
                    "You continue your quest..." if not quest_complete else "Quest complete!"
                ),
                "next_quest": None,
            }
        except Exception as e:
            return {
                "error": f"Failed to check progression: {str(e)}",
                "objectives_completed": [],
                "quest_complete": False,
                "narration": "You continue your quest...",
                "next_quest": None,
            }

    def narrate_combat(
        self,
        action_description: str,
        attacker: str,
        target: str,
        damage: Optional[int] = None,
        campaign_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate combat narration.

        Args:
            action_description: Description of the combat action
            attacker: Name of the attacker
            target: Name of the target
            damage: Damage dealt (optional)
            campaign_data: Campaign data for context (optional)

        Returns:
            Dict with narration, damage_dealt, and status_effects
        """
        context = ""
        if campaign_data:
            context = f"Campaign: {campaign_data.get('title', 'Unknown')}\n"

        prompt = f"""{COMBAT_NARRATION_PROMPT}

# Campaign Context
{context}

# Combat Action
Attacker: {attacker}
Target: {target}
Action: {action_description}
Damage: {damage if damage is not None else 'Unknown'}

# Your Response
Narrate this combat action in an engaging, cinematic way.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except json.JSONDecodeError:
            # Fallback: return basic narration
            return {
                "narration": content if "content" in locals() else f"{attacker} attacks {target}!",
                "damage_dealt": damage,
                "status_effects": None,
            }
        except Exception as e:
            return {
                "error": f"Failed to generate combat narration: {str(e)}",
                "narration": f"{attacker} attacks {target}!",
                "damage_dealt": damage,
                "status_effects": None,
            }
