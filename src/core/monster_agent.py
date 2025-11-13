"""
AI Monster Agent

This module implements AI agents that control monsters, making decisions for:
- Combat actions (attacks, spells, movement, tactics)
- Non-combat behavior (dialogue, reactions, interactions)
"""

import json
from typing import Any, Dict

from core.model import initialize_llm
from core.monster_prompts import COMBAT_DECISION_PROMPT, NON_COMBAT_BEHAVIOR_PROMPT


class MonsterAgent:
    """AI agent for controlling monster behavior"""

    def __init__(self):
        """Initialize the monster agent"""
        self.model = initialize_llm()

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

        # Build prompt
        prompt = COMBAT_DECISION_PROMPT.format(
            monster_name=monster_name,
            monster_type=monster_type,
            alignment=alignment,
            size=size,
            armor_class=armor_class,
            current_hp=current_hp,
            max_hp=max_hp,
            speed=speed,
            strength=strength,
            dexterity=dexterity,
            constitution=constitution,
            intelligence=intelligence,
            wisdom=wisdom,
            charisma=charisma,
            round=combat_context.get("round", 1),
            initiative_order=", ".join(combat_context.get("initiative_order", [])),
            enemies=", ".join(combat_context.get("enemies", [])),
            allies=", ".join(combat_context.get("allies", [])),
            situation=combat_context.get("situation", "Combat in progress"),
            available_actions=", ".join(available_actions),
        )

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

        # Build prompt
        prompt = NON_COMBAT_BEHAVIOR_PROMPT.format(
            monster_name=monster_name,
            monster_type=monster_type,
            alignment=alignment,
            intelligence=intelligence,
            personality=personality,
            situation=situation.get("context", "Unknown situation"),
            player_actions=", ".join(situation.get("player_actions", [])),
            goals=situation.get("goals", "Unknown"),
        )

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
