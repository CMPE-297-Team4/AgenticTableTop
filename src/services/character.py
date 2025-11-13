"""
Character/NPC portrait generation module.

This module provides functionality to generate character portraits using OpenAI's
image generation API, based on character descriptions and details.
"""

import json
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
