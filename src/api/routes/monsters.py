"""
Monster generation and combat simulation routes
"""

import traceback
from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException

from api.models import CombatRequest, CombatResponse, MonsterGenerationRequest, MonsterResponse
from combat.system import (
    CombatEncounter,
    create_combatant_from_monster,
    create_player_combatant,
    simulate_attack,
)
from core.agents import generate_monsters_for_quest
from core.model import initialize_llm
from services.cache import cache_response, get_cached_response
from tools.utils import get_monster_stat_block

router = APIRouter(prefix="/api", tags=["monsters"])


@router.post("/generate-monsters", response_model=MonsterResponse)
async def generate_monsters(request: MonsterGenerationRequest):
    """
    Generate monsters for a specific combat quest
    """
    try:
        import os

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
            "objectives": request.objectives,
        }

        # Generate monsters
        monsters = generate_monsters_for_quest(model, quest, request.quest_context)

        # Create response
        response_data = {"quest_name": request.quest_name, "monsters": monsters}

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, response_data, "monsters")
            print(f"Cached monster response for: {request.quest_name}")

        return MonsterResponse(**response_data)

    except Exception as e:
        print(f"Error generating monsters: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate monsters: {str(e)}")


@router.post("/simulate-combat", response_model=CombatResponse)
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
            dexterity_modifier=request.player_dexterity_modifier,
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

                    attack_result = simulate_attack(
                        monster, player, attack_bonus, damage_dice, damage_bonus
                    )
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
            current_turn=current_turn_name,
        )

    except Exception as e:
        print(f"Error simulating combat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to simulate combat: {str(e)}")


@router.post("/monster-stat-block/{monster_name}")
async def get_monster_stat_block_endpoint(
    monster_name: str, monster_data: Dict[str, Any] = Body(...)
):
    """
    Get a formatted stat block for a monster

    Accepts monster data in request body as JSON
    """
    try:
        stat_block = get_monster_stat_block(monster_data)
        return {"monster_name": monster_name, "stat_block": stat_block}
    except Exception as e:
        print(f"Error generating stat block: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate stat block: {str(e)}")
