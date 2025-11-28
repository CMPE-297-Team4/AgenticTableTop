"""
AI Monster Agent

This module implements AI agents that control monsters, making decisions for:
- Combat actions (attacks, spells, movement, tactics)
- Non-combat behavior (dialogue, reactions, interactions)
- Voice dialogue using TTS
- Uses RAG for D&D rules and tactics knowledge
"""

import json
from typing import Any, Dict, Optional

from core.model import initialize_llm
from core.monster_prompts import COMBAT_DECISION_PROMPT, NON_COMBAT_BEHAVIOR_PROMPT

# Optional TTS import
try:
    from services.tts import generate_speech

    _tts_available = True
except ImportError:
    generate_speech = None  # type: ignore
    _tts_available = False

# Optional RAG service import
try:
    from services.rag import get_rag_service

    _rag_available = True
except ImportError:
    get_rag_service = None  # type: ignore
    _rag_available = False


class MonsterAgent:
    """AI agent for controlling monster behavior"""

    def __init__(self, use_rag: bool = True, rag_namespace: Optional[str] = None):
        """
        Initialize the monster agent.

        Args:
            use_rag: Whether to use RAG for D&D rules and tactics knowledge
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

    def _get_combat_context(self, monster: Dict[str, Any], combat_context: Dict[str, Any]) -> str:
        """Build combat context string with RAG augmentation"""
        monster_type = monster.get("type", "Unknown")
        alignment = monster.get("alignment", "Unaligned")

        context = f"Monster: {monster.get('name', 'Unknown')}\n"
        context += f"Type: {monster_type}\n"
        context += f"Alignment: {alignment}\n"
        context += f"Combat Round: {combat_context.get('round', 1)}\n"
        context += f"Enemies: {', '.join(combat_context.get('enemies', []))}\n"
        context += f"Allies: {', '.join(combat_context.get('allies', []))}\n"
        context += f"Situation: {combat_context.get('situation', 'Combat in progress')}\n"

        # Add RAG context if available
        if self.use_rag and self.rag_service:
            try:
                query = f"D&D 5e combat tactics {monster_type} {alignment} combat decision"
                rag_context = self.rag_service.retrieve_context(
                    query=query, namespace=self.rag_namespace, top_k=3
                )
                context += f"\n\nAdditional Combat Knowledge:\n{rag_context}\n"
            except Exception as e:
                print(f"Warning: RAG retrieval failed: {e}")

        return context

    def _get_behavior_context(self, monster: Dict[str, Any], situation: Dict[str, Any]) -> str:
        """Build non-combat behavior context string with RAG augmentation"""
        monster_type = monster.get("type", "Unknown")
        alignment = monster.get("alignment", "Unaligned")

        context = f"Monster: {monster.get('name', 'Unknown')}\n"
        context += f"Type: {monster_type}\n"
        context += f"Alignment: {alignment}\n"
        context += f"Intelligence: {monster.get('abilities', {}).get('intelligence', 10)}\n"
        context += f"Personality: {monster.get('personality', monster.get('description', ''))}\n"
        context += f"Situation: {situation.get('context', 'Unknown situation')}\n"
        context += f"Player Actions: {', '.join(situation.get('player_actions', []))}\n"
        context += f"Goals: {situation.get('goals', 'Unknown')}\n"

        # Add RAG context if available
        if self.use_rag and self.rag_service:
            try:
                query = f"D&D 5e monster behavior {monster_type} {alignment} non-combat interaction"
                rag_context = self.rag_service.retrieve_context(
                    query=query, namespace=self.rag_namespace, top_k=3
                )
                context += f"\n\nAdditional Behavior Knowledge:\n{rag_context}\n"
            except Exception as e:
                print(f"Warning: RAG retrieval failed: {e}")

        return context

    def decide_combat_action(
        self,
        monster: Dict[str, Any],
        combat_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Decide what action a monster should take in combat.

        Args:
            monster: Monster stat block and current state
            combat_context: Current combat situation (round, enemies, allies, etc.)

        Returns:
            Dict with action, target, description, and reasoning
        """
        # Extract monster info
        monster_name = monster.get("name", "Unknown Monster")
        monster_type = monster.get("type", "Unknown")
        alignment = monster.get("alignment", "Unaligned")
        size = monster.get("size", "Medium")
        armor_class = monster.get("armor_class", 10)
        current_hp = monster.get("current_hp", monster.get("hit_points", 10))
        max_hp = monster.get("hit_points", 10)
        speed = monster.get("speed", "30 ft")

        # Extract abilities
        abilities = monster.get("abilities", {})
        strength = abilities.get("strength", 10)
        dexterity = abilities.get("dexterity", 10)
        constitution = abilities.get("constitution", 10)
        intelligence = abilities.get("intelligence", 10)
        wisdom = abilities.get("wisdom", 10)
        charisma = abilities.get("charisma", 10)

        # Build available actions
        available_actions = ["ATTACK", "MOVE", "DASH", "DODGE", "DISENGAGE"]
        if "spells" in monster or "spellcasting" in monster:
            available_actions.append("CAST_SPELL")
        if "special_abilities" in monster:
            available_actions.append("USE_ABILITY")

        # Build context with RAG augmentation
        context = self._get_combat_context(monster, combat_context)

        # Build prompt
        prompt = f"""{COMBAT_DECISION_PROMPT}

# Combat Context
{context}

# Monster Stats
Monster Name: {monster_name}
Type: {monster_type}
Alignment: {alignment}
Size: {size}
Armor Class: {armor_class}
Current HP: {current_hp}/{max_hp}
Speed: {speed}
Strength: {strength}
Dexterity: {dexterity}
Constitution: {constitution}
Intelligence: {intelligence}
Wisdom: {wisdom}
Charisma: {charisma}
Round: {combat_context.get("round", 1)}
Initiative Order: {", ".join(combat_context.get("initiative_order", []))}
Enemies: {", ".join(combat_context.get("enemies", []))}
Allies: {", ".join(combat_context.get("allies", []))}
Situation: {combat_context.get("situation", "Combat in progress")}
Available Actions: {", ".join(available_actions)}
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
            # Fallback: simple attack decision
            enemies = combat_context.get("enemies", [])
            target = enemies[0] if enemies else None

            return {
                "action": "ATTACK",
                "target": target,
                "description": f"{monster_name} attacks {target or 'the nearest enemy'}!",
                "reasoning": "Default attack action",
            }
        except Exception as e:
            return {
                "error": f"Failed to decide action: {str(e)}",
                "action": "ATTACK",
                "target": None,
                "description": f"{monster_name} attacks!",
                "reasoning": "Error fallback",
            }

    def decide_non_combat_behavior(
        self,
        monster: Dict[str, Any],
        situation: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Decide how a monster behaves in non-combat situations.

        Args:
            monster: Monster stat block
            situation: Current situation (player actions, context, etc.)

        Returns:
            Dict with behavior, response, dialogue, and reasoning
        """
        # Extract monster info
        monster_name = monster.get("name", "Unknown Monster")
        monster_type = monster.get("type", "Unknown")
        alignment = monster.get("alignment", "Unaligned")

        abilities = monster.get("abilities", {})
        intelligence = abilities.get("intelligence", 10)

        personality = monster.get("personality", monster.get("description", ""))

        # Build context with RAG augmentation
        context = self._get_behavior_context(monster, situation)

        # Build prompt
        prompt = f"""{NON_COMBAT_BEHAVIOR_PROMPT}

# Behavior Context
{context}

# Monster Info
Monster Name: {monster_name}
Type: {monster_type}
Alignment: {alignment}
Intelligence: {intelligence}
Personality: {personality}
Situation: {situation.get("context", "Unknown situation")}
Player Actions: {", ".join(situation.get("player_actions", []))}
Goals: {situation.get("goals", "Unknown")}
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
            # Fallback: defensive behavior
            return {
                "behavior": "DEFENSIVE",
                "response": f"{monster_name} watches warily.",
                "dialogue": None,
                "reasoning": "Default defensive behavior",
            }
        except Exception as e:
            return {
                "error": f"Failed to decide behavior: {str(e)}",
                "behavior": "OBSERVING",
                "response": f"{monster_name} observes the situation.",
                "dialogue": None,
                "reasoning": "Error fallback",
            }

    def decide_non_combat_behavior_with_voice(
        self,
        monster: Dict[str, Any],
        situation: Dict[str, Any],
        campaign_data: Optional[Dict[str, Any]] = None,
        voice: str = "onyx",  # Default to deeper voice for monsters
    ) -> Dict[str, Any]:
        """
        Decide how a monster behaves in non-combat situations with voice dialogue.

        Args:
            monster: Monster stat block
            situation: Current situation (player actions, context, etc.)
            campaign_data: Campaign data for theme-based voice selection
            voice: TTS voice to use (default: onyx for deeper monster voice)

        Returns:
            Dict with behavior, response, dialogue, reasoning, and audio_data
        """
        # Get text behavior first
        result = self.decide_non_combat_behavior(monster=monster, situation=situation)

        dialogue_text = result.get("dialogue", "")

        # Generate audio if TTS is available and there's dialogue
        if _tts_available and generate_speech and dialogue_text:
            try:
                # Get theme for voice selection (monsters should sound menacing/appropriate)
                theme = None
                if campaign_data:
                    theme = (
                        campaign_data.get("key_themes", [""])[0]
                        if campaign_data.get("key_themes")
                        else campaign_data.get("theme", "")
                    )

                audio_data = generate_speech(
                    text=dialogue_text, voice=voice, theme=theme, add_modulation=True
                )
                import base64

                result["audio_data"] = base64.b64encode(audio_data).decode("utf-8")
                result["audio_format"] = "mp3"
            except Exception as e:
                print(f"Warning: Failed to generate monster TTS audio: {e}")
                result["audio_error"] = str(e)

        return result
