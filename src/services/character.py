"""
Character/NPC portrait generation module.

This module provides functionality to generate character portraits using OpenAI's
image generation API, based on character descriptions and details.
Also handles full D&D 5e player character generation.
"""

import base64
import json
from pathlib import Path
from typing import Dict, Optional

from openai import OpenAI


def _slug(s: str) -> str:
    """Ensures the filename is safe for filesystems (no weird characters or emojis)."""
    return "".join(c if c.isalnum() or c in "-_." else "_" for c in s).strip("_")


def generate_npc_portrait(
    npc_name: str, npc_description: str, quest_context: Optional[str] = None
) -> Dict:
    """
    Generate a portrait for an NPC using OpenAI's image generation API.

    Args:
        npc_name: Name of the NPC
        npc_description: Description including race, class, background, role, appearance
        quest_context: Optional additional context about the quest or situation

    Returns:
        Dict containing:
        - image_base64: Base64 encoded image string
        - prompt_used: The prompt that was used for generation
        - error: Error message if generation failed
    """
    try:
        # Initialize OpenAI client
        client = OpenAI()

        # Create a character description for prompt generation
        character_details = {
            "character_name": npc_name,
            "race": "Unknown",  # Will be extracted from description if possible
            "class_and_level": "NPC",  # Default for NPCs
            "alignment": "Unknown",
            "background": npc_description,
        }

        # Try to extract basic info from description
        description_lower = npc_description.lower()
        if "human" in description_lower:
            character_details["race"] = "Human"
        elif "elf" in description_lower:
            character_details["race"] = "Elf"
        elif "dwarf" in description_lower:
            character_details["race"] = "Dwarf"
        elif "halfling" in description_lower:
            character_details["race"] = "Halfling"
        elif "orc" in description_lower:
            character_details["race"] = "Orc"
        elif "tiefling" in description_lower:
            character_details["race"] = "Tiefling"

        # Extract class if mentioned
        if "wizard" in description_lower or "mage" in description_lower:
            character_details["class_and_level"] = "Wizard"
        elif "fighter" in description_lower or "warrior" in description_lower:
            character_details["class_and_level"] = "Fighter"
        elif "rogue" in description_lower or "thief" in description_lower:
            character_details["class_and_level"] = "Rogue"
        elif "cleric" in description_lower or "priest" in description_lower:
            character_details["class_and_level"] = "Cleric"
        elif "ranger" in description_lower:
            character_details["class_and_level"] = "Ranger"
        elif "paladin" in description_lower:
            character_details["class_and_level"] = "Paladin"
        elif "bard" in description_lower:
            character_details["class_and_level"] = "Bard"
        elif "sorcerer" in description_lower:
            character_details["class_and_level"] = "Sorcerer"
        elif "warlock" in description_lower:
            character_details["class_and_level"] = "Warlock"
        elif "monk" in description_lower:
            character_details["class_and_level"] = "Monk"
        elif "barbarian" in description_lower:
            character_details["class_and_level"] = "Barbarian"
        elif "druid" in description_lower:
            character_details["class_and_level"] = "Druid"

        # Generate portrait prompt using GPT
        prompt_gen = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Write a concise, vivid portrait prompt for a fantasy art generator.",
                },
                {
                    "role": "system",
                    "content": "Style: painterly fantasy portrait; head-and-shoulders; neutral background that hints at their theme; avoid copyrighted names.",
                },
                {
                    "role": "user",
                    "content": (
                        "Compose a single-sentence portrait prompt using these details. "
                        "Include race, class, notable gear/themes, and an overall vibe.\n"
                        f"Character: {npc_name}\n"
                        f"Description: {npc_description}\n"
                        f"Context: {quest_context or 'General NPC'}\n"
                        f"Extracted details: {json.dumps({k: character_details.get(k) for k in ['character_name', 'class_and_level', 'race']})}"
                    ),
                },
            ],
        )

        portrait_prompt = prompt_gen.choices[0].message.content.strip()

        # Generate the portrait image
        result = client.images.generate(
            model="dall-e-3", prompt=portrait_prompt, size="1024x1024", response_format="b64_json"
        )

        image_b64 = result.data[0].b64_json

        return {"image_base64": image_b64, "prompt_used": portrait_prompt, "npc_name": npc_name}

    except Exception as e:
        return {"error": f"Failed to generate portrait: {str(e)}", "npc_name": npc_name}


# D&D 5e Character Schema (from notebook)
CHARACTER_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "character_name",
        "class_and_level",
        "background",
        "player_name",
        "race",
        "alignment",
        "experience_points",
        "abilities",
        "saving_throws",
        "skills",
        "proficiency_bonus",
        "passive_wisdom",
        "combat_stats",
        "attacks_and_spellcasting",
        "equipment",
        "other_proficiencies_and_languages",
        "features_and_traits",
        "personality_traits",
        "ideals",
        "bonds",
        "flaws",
        "notes",
        "portrait",
    ],
    "properties": {
        "character_name": {"type": "string"},
        "class_and_level": {"type": "string"},
        "background": {"type": "string"},
        "player_name": {"type": "string"},
        "race": {"type": "string"},
        "alignment": {"type": "string"},
        "experience_points": {"type": "integer"},
        "abilities": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "strength": {"type": "integer"},
                "dexterity": {"type": "integer"},
                "constitution": {"type": "integer"},
                "intelligence": {"type": "integer"},
                "wisdom": {"type": "integer"},
                "charisma": {"type": "integer"},
            },
        },
        "saving_throws": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "strength": {"type": "boolean"},
                "dexterity": {"type": "boolean"},
                "constitution": {"type": "boolean"},
                "intelligence": {"type": "boolean"},
                "wisdom": {"type": "boolean"},
                "charisma": {"type": "boolean"},
            },
        },
        "skills": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "acrobatics": {"type": "boolean"},
                "animal_handling": {"type": "boolean"},
                "arcana": {"type": "boolean"},
                "athletics": {"type": "boolean"},
                "deception": {"type": "boolean"},
                "history": {"type": "boolean"},
                "insight": {"type": "boolean"},
                "intimidation": {"type": "boolean"},
                "investigation": {"type": "boolean"},
                "medicine": {"type": "boolean"},
                "nature": {"type": "boolean"},
                "perception": {"type": "boolean"},
                "performance": {"type": "boolean"},
                "persuasion": {"type": "boolean"},
                "religion": {"type": "boolean"},
                "sleight_of_hand": {"type": "boolean"},
                "stealth": {"type": "boolean"},
                "survival": {"type": "boolean"},
            },
        },
        "proficiency_bonus": {"type": "integer"},
        "passive_wisdom": {"type": "integer"},
        "combat_stats": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "armor_class",
                "initiative",
                "speed",
                "hit_point_maximum",
                "current_hit_points",
                "temporary_hit_points",
                "hit_dice_total",
                "death_saves",
            ],
            "properties": {
                "armor_class": {"type": "integer"},
                "initiative": {"type": "integer"},
                "speed": {"type": "integer"},
                "hit_point_maximum": {"type": "integer"},
                "current_hit_points": {"type": "integer"},
                "temporary_hit_points": {"type": "integer"},
                "hit_dice_total": {"type": "string"},
                "death_saves": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["successes", "failures"],
                    "properties": {
                        "successes": {"type": "integer"},
                        "failures": {"type": "integer"},
                    },
                },
            },
        },
        "attacks_and_spellcasting": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "attack_bonus": {"type": "string"},
                    "damage_type": {"type": "string"},
                },
            },
        },
        "equipment": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "integer"},
                },
            },
        },
        "other_proficiencies_and_languages": {"type": "array", "items": {"type": "string"}},
        "features_and_traits": {"type": "array", "items": {"type": "string"}},
        "personality_traits": {"type": "string"},
        "ideals": {"type": "string"},
        "bonds": {"type": "string"},
        "flaws": {"type": "string"},
        "notes": {"type": "string"},
        "portrait": {
            "type": "object",
            "additionalProperties": False,
            "required": ["image_path"],
            "properties": {
                "image_path": {"type": "string"},
                "prompt": {"type": "string", "default": ""},
            },
        },
    },
}


def generate_player_character(
    character_name: str,
    class_and_level: str,
    race: str,
    background: str,
    alignment: str,
    player_name: Optional[str] = None,
) -> Dict:
    """
    Generate a full D&D 5e character using OpenAI with function calling.

    Args:
        character_name: Name of the character
        class_and_level: Class and level (e.g., "Ranger 1")
        race: Character race (e.g., "Human")
        background: Character background (e.g., "Faceless")
        alignment: Character alignment (e.g., "True Neutral")
        player_name: Optional player name (defaults to character_name)

    Returns:
        Dict containing:
        - character: Full character JSON
        - image_base64: Base64 encoded portrait
        - image_path: Path to saved image
        - portrait_prompt: Prompt used for portrait
        - error: Error message if generation failed
    """
    try:
        client = OpenAI()
        player_name = player_name or character_name

        # Create user prompt for character generation
        user_prompt = (
            f"Create a DnD 5e character with this concept:\n"
            f"- Name: {character_name}\n"
            f"- Class & Level: {class_and_level}\n"
            f"- Race: {race}\n"
            f"- Background: {background}\n"
            f"- Alignment: {alignment}\n"
            f"- Player Name: {player_name}\n"
            "Fill every field of the provided schema with reasonable, rules-consistent values. "
            "When ready, call save_character with the fully filled JSON."
        )

        # Define function tools
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "save_character",
                    "description": "Save the character JSON",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "character": CHARACTER_SCHEMA,
                            "filename_hint": {"type": "string"},
                        },
                        "required": ["character"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_portrait",
                    "description": "Generate a fantasy portrait image for a DnD character using their details.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "prompt": {
                                "type": "string",
                                "description": "A descriptive text prompt for the portrait.",
                            },
                            "character_name": {"type": "string"},
                        },
                        "required": ["prompt", "character_name"],
                    },
                },
            },
        ]

        # Generate character using OpenAI
        # Force the model to call save_character first
        response = client.chat.completions.create(
            model="gpt-4o",
            tools=tools,
            tool_choice={"type": "function", "function": {"name": "save_character"}},
            messages=[
                {
                    "role": "system",
                    "content": "You are a structured DnD character generator. You must call save_character first with the complete character data. Do not call generate_portrait - that will be handled separately.",
                },
                {
                    "role": "system",
                    "content": "All fields must match the provided JSON schema and types. Use sensible defaults where data is unknown.",
                },
                {"role": "user", "content": user_prompt},
            ],
        )

        message = response.choices[0].message
        if not message.tool_calls:
            return {
                "error": "Model did not call save_character. Check schema/fields or loosen constraints."
            }

        # Find the save_character tool call (should be first, but check all)
        save_character_call = None
        for tool_call in message.tool_calls:
            if tool_call.function.name == "save_character":
                save_character_call = tool_call
                break

        if not save_character_call:
            # If no save_character call found, check what was called
            called_names = [tc.function.name for tc in message.tool_calls]
            return {"error": f"Expected save_character call, got {', '.join(called_names)}"}

        args = json.loads(save_character_call.function.arguments)
        character = args["character"]

        # Generate proper stats based on race and class
        from services.stat_generation import (
            calculate_armor_class,
            calculate_hp,
            generate_ability_scores,
        )

        stats = generate_ability_scores(race, class_and_level)
        character["strength"] = stats["strength"]
        character["dexterity"] = stats["dexterity"]
        character["constitution"] = stats["constitution"]
        character["intelligence"] = stats["intelligence"]
        character["wisdom"] = stats["wisdom"]
        character["charisma"] = stats["charisma"]

        # Extract level from class_and_level (e.g., "Fighter 1" -> 1)
        level = 1
        if " " in class_and_level:
            try:
                level = int(class_and_level.split(" ")[1])
            except (IndexError, ValueError):
                level = 1

        # Calculate HP based on class, level, and constitution
        character["hit_points"] = calculate_hp(class_and_level, level, stats["constitution"])

        # Calculate AC based on dexterity (assuming no armor for now)
        character["armor_class"] = calculate_armor_class(stats["dexterity"], armor_bonus=0)

        # Generate portrait prompt
        prompt_gen = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Write a concise, vivid portrait prompt for a fantasy art generator.",
                },
                {
                    "role": "system",
                    "content": "Style: painterly fantasy portrait; head-and-shoulders; neutral background that hints at their theme; avoid copyrighted names.",
                },
                {
                    "role": "user",
                    "content": (
                        "Compose a single-sentence portrait prompt using these details. "
                        "Include race, class, level, alignment, background, notable gear/themes, and an overall vibe.\n"
                        f"{json.dumps({k: character.get(k) for k in ['character_name', 'class_and_level', 'race', 'alignment', 'background']})}"
                    ),
                },
            ],
        )
        portrait_prompt = prompt_gen.choices[0].message.content.strip()

        # Generate portrait image
        img_result = client.images.generate(
            model="dall-e-3", prompt=portrait_prompt, size="1024x1024", response_format="b64_json"
        )
        image_b64 = img_result.data[0].b64_json

        # Save image to file (optional, for reference)
        characters_dir = Path(__file__).parent.parent.parent / "characters"
        characters_dir.mkdir(exist_ok=True)
        filename = f"{_slug(character_name)}.png"
        image_path = characters_dir / filename

        with open(image_path, "wb") as f:
            f.write(base64.b64decode(image_b64))

        # Update character with portrait info
        character["portrait"] = {"image_path": str(image_path), "prompt": portrait_prompt}

        return {
            "character": character,
            "image_base64": image_b64,
            "image_path": str(image_path),
            "portrait_prompt": portrait_prompt,
        }

    except Exception as e:
        return {"error": f"Failed to generate player character: {str(e)}"}
