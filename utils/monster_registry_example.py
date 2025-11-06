"""
Example usage of MonsterRegistry for referencing monsters.

This shows how to:
1. Store monsters in the registry
2. Look up monsters by quest name, monster name, or ID
3. Use monsters in combat or other game systems
"""

from utils.schemas import MonsterRegistry, Monster


def example_usage():
    """Example of how to use the MonsterRegistry"""
    
    # Create registry
    registry = MonsterRegistry()
    
    # Example: After generating monsters for a quest
    quest_name = "The Failing Spark"
    monsters_data = [
        {
            "name": "Arcane Flux Golem",
            "size": "Large",
            "type": "construct",
            "armor_class": 17,
            "hit_points": 114,
            # ... other fields
        },
        {
            "name": "Mana Wisp",
            "size": "Small",
            "type": "elemental",
            "armor_class": 13,
            "hit_points": 22,
            # ... other fields
        }
    ]
    
    # Convert dicts to Monster objects and add to registry
    monsters = [Monster.model_validate(m) for m in monsters_data]
    registry.add_monsters(quest_name, monsters)
    
    # Now you can look up monsters in several ways:
    
    # 1. Get all monsters for a quest
    quest_monsters = registry.get_by_quest("The Failing Spark")
    print(f"Monsters in quest: {[m.name for m in quest_monsters]}")
    
    # 2. Get a specific monster by quest name + monster name
    golem = registry.get_unique("The Failing Spark", "Arcane Flux Golem")
    if golem:
        print(f"Found: {golem.name} (AC: {golem.armor_class}, HP: {golem.hit_points})")
    
    # 3. Get all monsters with a given name (if same name appears in multiple quests)
    all_golems = registry.get_by_name("Arcane Flux Golem")
    for quest, monster in all_golems:
        print(f"Found {monster.name} in quest: {quest}")
    
    # 4. Get by unique ID (auto-generated as "quest_name:monster_name")
    monster_id = "The Failing Spark:Arcane Flux Golem"
    result = registry.get_by_id(monster_id)
    if result:
        quest, monster = result
        print(f"Found by ID: {monster.name} from {quest}")
    
    # 5. List all monsters
    all_monsters = registry.list_all_monsters()
    print(f"Total monsters in registry: {len(all_monsters)}")
    
    # Example: Use in combat
    if golem:
        from utils.combat_system import create_combatant_from_monster
        combatant = create_combatant_from_monster(golem.model_dump())
        print(f"Created combatant: {combatant.name} with {combatant.max_hp} HP")


if __name__ == "__main__":
    example_usage()


