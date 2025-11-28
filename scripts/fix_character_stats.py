#!/usr/bin/env python3
"""
Fix existing character stats by regenerating them based on race and class
"""

import os
import sys

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from database.models import PlayerCharacter, get_db  # noqa: E402
from services.stat_generation import (  # noqa: E402
    calculate_armor_class,
    calculate_hp,
    generate_ability_scores,
)


def fix_all_character_stats():
    """Update all existing characters with proper stats"""
    db = next(get_db())

    try:
        characters = db.query(PlayerCharacter).all()

        if not characters:
            print("No characters found in database")
            return

        print(f"Found {len(characters)} character(s) to update\n")

        for char in characters:
            print(f"Updating: {char.character_name} ({char.race} {char.class_and_level})")

            # Generate proper stats
            stats = generate_ability_scores(char.race, char.class_and_level)

            # Update character stats
            char.strength = stats["strength"]
            char.dexterity = stats["dexterity"]
            char.constitution = stats["constitution"]
            char.intelligence = stats["intelligence"]
            char.wisdom = stats["wisdom"]
            char.charisma = stats["charisma"]

            # Extract level
            level = 1
            if " " in char.class_and_level:
                try:
                    level = int(char.class_and_level.split(" ")[1])
                except (IndexError, ValueError):
                    level = 1

            # Recalculate HP and AC
            char.hit_points = calculate_hp(char.class_and_level, level, stats["constitution"])
            char.armor_class = calculate_armor_class(stats["dexterity"], armor_bonus=0)

            print(
                f"  New stats: STR {char.strength}, DEX {char.dexterity}, CON {char.constitution}"
            )
            print(f"             INT {char.intelligence}, WIS {char.wisdom}, CHA {char.charisma}")
            print(f"  HP: {char.hit_points}, AC: {char.armor_class}\n")

        # Commit all changes
        db.commit()
        print("✅ All characters updated successfully!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Character Stat Fixer")
    print("=" * 60)
    print("\nThis will regenerate stats for all existing characters")
    print("based on their race and class.\n")

    fix_all_character_stats()
