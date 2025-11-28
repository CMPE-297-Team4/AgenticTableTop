"""
Character Stat Generation

Generates ability scores based on race and class following D&D 5e rules.
"""

from typing import Dict

# D&D 5e Racial Ability Score Bonuses
RACIAL_BONUSES = {
    "Human": {
        "strength": 1,
        "dexterity": 1,
        "constitution": 1,
        "intelligence": 1,
        "wisdom": 1,
        "charisma": 1,
    },
    "Elf": {"dexterity": 2, "intelligence": 1},  # High Elf
    "Dwarf": {"constitution": 2, "wisdom": 1},  # Hill Dwarf
    "Halfling": {"dexterity": 2, "charisma": 1},  # Lightfoot Halfling
    "Dragonborn": {"strength": 2, "charisma": 1},
    "Gnome": {"intelligence": 2, "dexterity": 1},  # Forest Gnome
    "Half-Elf": {"charisma": 2, "dexterity": 1, "constitution": 1},
    "Half-Orc": {"strength": 2, "constitution": 1},
    "Tiefling": {"charisma": 2, "intelligence": 1},
}

# Suggested primary/secondary stats for each class
CLASS_PRIORITIES = {
    "Fighter": ["strength", "constitution", "dexterity"],
    "Wizard": ["intelligence", "constitution", "dexterity"],
    "Rogue": ["dexterity", "intelligence", "constitution"],
    "Cleric": ["wisdom", "constitution", "strength"],
    "Ranger": ["dexterity", "wisdom", "constitution"],
    "Paladin": ["strength", "charisma", "constitution"],
    "Barbarian": ["strength", "constitution", "dexterity"],
    "Bard": ["charisma", "dexterity", "constitution"],
    "Sorcerer": ["charisma", "constitution", "dexterity"],
    "Warlock": ["charisma", "constitution", "dexterity"],
    "Monk": ["dexterity", "wisdom", "constitution"],
    "Druid": ["wisdom", "constitution", "intelligence"],
}


def roll_stats_standard_array() -> list[int]:
    """
    Use the standard array method: [15, 14, 13, 12, 10, 8]
    This ensures consistent, balanced stats.
    """
    return [15, 14, 13, 12, 10, 8]


def generate_ability_scores(
    race: str, class_name: str, method: str = "standard_array"
) -> Dict[str, int]:
    """
    Generate ability scores for a character based on race and class.

    Args:
        race: Character race (e.g., "Human", "Elf")
        class_name: Character class (e.g., "Fighter", "Wizard")
        method: Generation method ("standard_array" or "point_buy")

    Returns:
        Dict with ability scores: strength, dexterity, constitution, intelligence, wisdom, charisma
    """
    # Get base scores using standard array
    base_scores = roll_stats_standard_array()

    # Extract class from "Class Level" format (e.g., "Fighter 1" -> "Fighter")
    if " " in class_name:
        class_name = class_name.split(" ")[0]

    # Get class priorities (which stats are most important for this class)
    priorities = CLASS_PRIORITIES.get(class_name, ["strength", "dexterity", "constitution"])

    # Get racial bonuses
    racial_bonuses = RACIAL_BONUSES.get(race, {})

    # Assign base scores to abilities based on class priorities
    # Put highest scores in most important stats for the class
    ability_names = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]

    # Create a mapping of ability to score
    scores = {}
    base_scores_sorted = sorted(base_scores, reverse=True)

    # Assign highest scores to priority stats
    assigned_abilities = []
    for i, priority_stat in enumerate(priorities[:3]):  # Top 3 priorities
        if i < len(base_scores_sorted):
            scores[priority_stat] = base_scores_sorted[i]
            assigned_abilities.append(priority_stat)

    # Assign remaining scores to remaining abilities
    remaining_abilities = [a for a in ability_names if a not in assigned_abilities]
    remaining_scores = base_scores_sorted[len(priorities[:3]) :]

    for ability, score in zip(remaining_abilities, remaining_scores):
        scores[ability] = score

    # Apply racial bonuses
    for ability, bonus in racial_bonuses.items():
        scores[ability] = scores.get(ability, 10) + bonus

    # Ensure all abilities have a score (default to 10)
    for ability in ability_names:
        if ability not in scores:
            scores[ability] = 10

    return scores


def calculate_modifier(score: int) -> int:
    """Calculate ability modifier from ability score"""
    return (score - 10) // 2


def calculate_hp(class_name: str, level: int, constitution_score: int) -> int:
    """
    Calculate hit points based on class, level, and constitution.

    Args:
        class_name: Character class
        level: Character level
        constitution_score: Constitution ability score

    Returns:
        Total hit points
    """
    # Extract class from "Class Level" format
    if " " in class_name:
        class_name = class_name.split(" ")[0]

    # Hit die by class (D&D 5e)
    hit_dice = {
        "Barbarian": 12,
        "Fighter": 10,
        "Paladin": 10,
        "Ranger": 10,
        "Bard": 8,
        "Cleric": 8,
        "Druid": 8,
        "Monk": 8,
        "Rogue": 8,
        "Warlock": 8,
        "Sorcerer": 6,
        "Wizard": 6,
    }

    hit_die = hit_dice.get(class_name, 8)
    con_modifier = calculate_modifier(constitution_score)

    # Level 1: max hit die + con modifier
    # Each additional level: average of hit die (rounded up) + con modifier
    hp = hit_die + con_modifier

    if level > 1:
        avg_roll = (hit_die // 2) + 1  # Average, rounded up
        hp += (avg_roll + con_modifier) * (level - 1)

    return max(1, hp)  # Minimum 1 HP


def calculate_armor_class(dexterity_score: int, armor_bonus: int = 0) -> int:
    """
    Calculate armor class.

    Args:
        dexterity_score: Dexterity ability score
        armor_bonus: Bonus from armor (default 0 for no armor)

    Returns:
        Armor class value
    """
    dex_modifier = calculate_modifier(dexterity_score)
    # Base AC is 10 + dex modifier + armor bonus
    return 10 + dex_modifier + armor_bonus
