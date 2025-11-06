"""
Combat System for D&D Campaigns

This module handles combat mechanics including initiative, turns, damage calculation,
and status effects for D&D encounters.
"""

import random
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from utils.tools import dice_roll


class CombatStatus(Enum):
    """Combat status effects."""
    UNCONSCIOUS = "unconscious"
    PRONE = "prone"
    STUNNED = "stunned"
    PARALYZED = "paralyzed"
    CHARMED = "charmed"
    FRIGHTENED = "frightened"
    POISONED = "poisoned"
    BLINDED = "blinded"
    DEAFENED = "deafened"
    INVISIBLE = "invisible"


@dataclass
class Combatant:
    """Represents a combatant in combat (player or monster)."""
    name: str
    max_hp: int
    current_hp: int
    armor_class: int
    initiative: int
    is_player: bool
    status_effects: List[CombatStatus] = None
    temporary_hp: int = 0
    conditions: List[str] = None
    
    def __post_init__(self):
        if self.status_effects is None:
            self.status_effects = []
        if self.conditions is None:
            self.conditions = []
    
    @property
    def is_conscious(self) -> bool:
        """Check if the combatant is conscious."""
        return self.current_hp > 0 and CombatStatus.UNCONSCIOUS not in self.status_effects
    
    @property
    def is_stable(self) -> bool:
        """Check if the combatant is stable (not making death saves)."""
        return self.current_hp > 0 or CombatStatus.UNCONSCIOUS in self.status_effects
    
    def take_damage(self, damage: int, damage_type: str = "bludgeoning") -> int:
        """Apply damage to the combatant."""
        if not self.is_conscious:
            return 0
        
        # Apply resistances/immunities here (simplified)
        actual_damage = damage
        
        # Apply to temporary HP first
        if self.temporary_hp > 0:
            if actual_damage >= self.temporary_hp:
                actual_damage -= self.temporary_hp
                self.temporary_hp = 0
            else:
                self.temporary_hp -= actual_damage
                actual_damage = 0
        
        # Apply to current HP
        self.current_hp = max(0, self.current_hp - actual_damage)
        
        # Check for unconsciousness
        if self.current_hp <= 0 and self.is_conscious:
            self.status_effects.append(CombatStatus.UNCONSCIOUS)
        
        return actual_damage
    
    def heal(self, healing: int) -> int:
        """Heal the combatant."""
        if not self.is_conscious:
            return 0
        
        old_hp = self.current_hp
        self.current_hp = min(self.max_hp, self.current_hp + healing)
        
        # Remove unconscious status if healed above 0
        if self.current_hp > 0 and CombatStatus.UNCONSCIOUS in self.status_effects:
            self.status_effects.remove(CombatStatus.UNCONSCIOUS)
        
        return self.current_hp - old_hp
    
    def add_status_effect(self, status: CombatStatus):
        """Add a status effect to the combatant."""
        if status not in self.status_effects:
            self.status_effects.append(status)
    
    def remove_status_effect(self, status: CombatStatus):
        """Remove a status effect from the combatant."""
        if status in self.status_effects:
            self.status_effects.remove(status)


class CombatEncounter:
    """Manages a combat encounter."""
    
    def __init__(self, combatants: List[Combatant]):
        self.combatants = combatants
        self.current_turn = 0
        self.round = 1
        self.initiative_order = []
        self.combat_log = []
        self.is_active = False
        
        # Sort by initiative (highest first)
        self.initiative_order = sorted(combatants, key=lambda x: x.initiative, reverse=True)
    
    def start_combat(self):
        """Start the combat encounter."""
        self.is_active = True
        self.combat_log.append(f"Combat begins! Initiative order: {', '.join([c.name for c in self.initiative_order])}")
    
    def get_current_combatant(self) -> Optional[Combatant]:
        """Get the combatant whose turn it is."""
        if not self.is_active or not self.initiative_order:
            return None
        return self.initiative_order[self.current_turn]
    
    def next_turn(self):
        """Move to the next turn."""
        if not self.is_active:
            return
        
        self.current_turn += 1
        if self.current_turn >= len(self.initiative_order):
            self.current_turn = 0
            self.round += 1
            self.combat_log.append(f"Round {self.round} begins!")
    
    def is_combat_over(self) -> bool:
        """Check if combat is over (all enemies or all players defeated)."""
        players = [c for c in self.combatants if c.is_player]
        enemies = [c for c in self.combatants if not c.is_player]
        
        # Check if all players are unconscious
        all_players_down = all(not c.is_conscious for c in players)
        
        # Check if all enemies are unconscious
        all_enemies_down = all(not c.is_conscious for c in enemies)
        
        return all_players_down or all_enemies_down
    
    def get_combat_result(self) -> str:
        """Get the result of combat."""
        players = [c for c in self.combatants if c.is_player]
        enemies = [c for c in self.combatants if not c.is_player]
        
        all_players_down = all(not c.is_conscious for c in players)
        all_enemies_down = all(not c.is_conscious for c in enemies)
        
        if all_players_down:
            return "defeat"
        elif all_enemies_down:
            return "victory"
        else:
            return "ongoing"
    
    def add_combat_log(self, message: str):
        """Add a message to the combat log."""
        self.combat_log.append(message)


def roll_initiative() -> int:
    """Roll for initiative (1d20 + Dexterity modifier)."""
    return dice_roll(20)


def roll_attack_roll(attack_bonus: int, advantage: bool = False, disadvantage: bool = False) -> Tuple[int, bool]:
    """
    Roll an attack roll.
    
    Returns:
        Tuple of (total_roll, is_critical)
    """
    if advantage and disadvantage:
        # Advantage and disadvantage cancel out
        roll = dice_roll(20)
    elif advantage:
        roll = max(dice_roll(20), dice_roll(20))
    elif disadvantage:
        roll = min(dice_roll(20), dice_roll(20))
    else:
        roll = dice_roll(20)
    
    total = roll + attack_bonus
    is_critical = roll == 20
    
    return total, is_critical


def roll_damage(damage_dice: str, damage_bonus: int = 0, is_critical: bool = False) -> int:
    """
    Roll damage dice.
    
    Args:
        damage_dice: Dice string like "2d6" or "1d8"
        damage_bonus: Bonus to add to damage
        is_critical: Whether this is a critical hit (double dice)
        
    Returns:
        Total damage rolled
    """
    # Parse dice string (e.g., "2d6" -> 2 dice of 6 sides)
    if 'd' not in damage_dice:
        return int(damage_dice) + damage_bonus
    
    num_dice, dice_size = damage_dice.split('d')
    num_dice = int(num_dice)
    dice_size = int(dice_size)
    
    # Double dice for critical hits
    if is_critical:
        num_dice *= 2
    
    total_damage = 0
    for _ in range(num_dice):
        total_damage += dice_roll(dice_size)
    
    return total_damage + damage_bonus


def calculate_armor_class(base_ac: int, dexterity_modifier: int, armor_type: str = "none") -> int:
    """
    Calculate armor class based on armor type and Dexterity modifier.
    
    Args:
        base_ac: Base armor class
        dexterity_modifier: Dexterity modifier
        armor_type: Type of armor ("light", "medium", "heavy", "none")
        
    Returns:
        Final armor class
    """
    if armor_type == "heavy":
        # Heavy armor doesn't add Dex modifier
        return base_ac
    elif armor_type == "medium":
        # Medium armor adds Dex modifier (max +2)
        return base_ac + min(dexterity_modifier, 2)
    else:
        # Light armor or no armor adds full Dex modifier
        return base_ac + dexterity_modifier


def create_combatant_from_monster(monster: Dict[str, Any], name: str = None) -> Combatant:
    """
    Create a Combatant from a monster dictionary.
    
    Args:
        monster: Monster dictionary with stat block
        name: Optional custom name for the monster
        
    Returns:
        Combatant object
    """
    monster_name = name or monster.get("name", "Unknown Monster")
    max_hp = monster.get("hit_points", 10)
    armor_class = monster.get("armor_class", 10)
    
    # Roll initiative
    dex_modifier = (monster.get("dexterity", 10) - 10) // 2
    initiative = roll_initiative() + dex_modifier
    
    return Combatant(
        name=monster_name,
        max_hp=max_hp,
        current_hp=max_hp,
        armor_class=armor_class,
        initiative=initiative,
        is_player=False
    )


def create_player_combatant(
    name: str, 
    max_hp: int, 
    armor_class: int, 
    dexterity_modifier: int
) -> Combatant:
    """
    Create a Combatant for a player character.
    
    Args:
        name: Player character name
        max_hp: Maximum hit points
        armor_class: Armor class
        dexterity_modifier: Dexterity modifier for initiative
        
    Returns:
        Combatant object
    """
    initiative = roll_initiative() + dexterity_modifier
    
    return Combatant(
        name=name,
        max_hp=max_hp,
        current_hp=max_hp,
        armor_class=armor_class,
        initiative=initiative,
        is_player=True
    )


def simulate_attack(
    attacker: Combatant, 
    target: Combatant, 
    attack_bonus: int, 
    damage_dice: str, 
    damage_bonus: int = 0
) -> Dict[str, Any]:
    """
    Simulate an attack from attacker to target.
    
    Args:
        attacker: Attacking combatant
        target: Target combatant
        attack_bonus: Attack bonus
        damage_dice: Damage dice string
        damage_bonus: Damage bonus
        
    Returns:
        Dictionary with attack results
    """
    if not attacker.is_conscious or not target.is_conscious:
        return {"hit": False, "damage": 0, "critical": False, "message": "Cannot attack while unconscious"}
    
    # Roll attack
    attack_roll, is_critical = roll_attack_roll(attack_bonus)
    
    # Check if hit
    hit = attack_roll >= target.armor_class or is_critical
    
    if not hit:
        return {
            "hit": False, 
            "damage": 0, 
            "critical": False, 
            "message": f"{attacker.name} attacks {target.name} but misses (rolled {attack_roll} vs AC {target.armor_class})"
        }
    
    # Roll damage
    damage = roll_damage(damage_dice, damage_bonus, is_critical)
    
    # Apply damage
    actual_damage = target.take_damage(damage)
    
    critical_text = " (CRITICAL HIT!)" if is_critical else ""
    message = f"{attacker.name} hits {target.name} for {actual_damage} damage{critical_text}"
    
    return {
        "hit": True,
        "damage": actual_damage,
        "critical": is_critical,
        "message": message
    }


def run_simple_encounter(
    monster_data: Dict[str, Any],
    player_name: str = "Hero",
    player_max_hp: int = 30,
    player_armor_class: int = 15,
    player_dexterity_modifier: int = 2,
    player_attack_bonus: int = 3,
    player_damage_dice: str = "1d8",
    player_damage_bonus: int = 1,
    max_rounds: int = 10
) -> Dict[str, Any]:
    """
    Run a simple combat encounter between a player and a generated monster.
    
    Args:
        monster_data: Monster dictionary from generated monsters
        player_name: Player character name
        player_max_hp: Player max hit points
        player_armor_class: Player armor class
        player_dexterity_modifier: Player dexterity modifier
        player_attack_bonus: Player attack bonus
        player_damage_dice: Player damage dice (e.g., "1d8")
        player_damage_bonus: Player damage bonus
        max_rounds: Maximum number of rounds before combat ends
        
    Returns:
        Dictionary with combat results including log, result, and final stats
    """
    # Create player combatant
    player = create_player_combatant(
        name=player_name,
        max_hp=player_max_hp,
        armor_class=player_armor_class,
        dexterity_modifier=player_dexterity_modifier
    )
    
    # Create monster combatant from generated monster
    monster = create_combatant_from_monster(monster_data)
    
    # Create combat encounter
    encounter = CombatEncounter([player, monster])
    encounter.start_combat()
    
    # Combat log
    combat_log = []
    combat_log.append(f"=== COMBAT BEGINS ===")
    combat_log.append(f"Player: {player.name} (HP: {player.current_hp}/{player.max_hp}, AC: {player.armor_class})")
    combat_log.append(f"Monster: {monster.name} (HP: {monster.current_hp}/{monster.max_hp}, AC: {monster.armor_class})")
    combat_log.append(f"Initiative order: {', '.join([c.name for c in encounter.initiative_order])}")
    combat_log.append("")
    
    # Simulate combat rounds
    round_count = 0
    
    while not encounter.is_combat_over() and round_count < max_rounds:
        current_combatant = encounter.get_current_combatant()
        combat_log.append(f"Round {encounter.round}, Turn: {current_combatant.name}")
        
        if current_combatant == player:
            # Player attacks monster
            attack_result = simulate_attack(
                player, 
                monster, 
                player_attack_bonus, 
                player_damage_dice, 
                player_damage_bonus
            )
            combat_log.append(f"  {attack_result['message']}")
        else:
            # Monster attacks player - use monster's first action if available
            actions = monster_data.get("actions", [])
            if actions:
                action = actions[0]
                attack_bonus = action.get("attack_bonus", 0)
                damage_dice = action.get("damage", "1d6")
                # Parse damage bonus from damage string if present (e.g., "2d6 + 3")
                damage_bonus = 0
                if "+" in damage_dice:
                    parts = damage_dice.split("+")
                    damage_dice = parts[0].strip()
                    try:
                        damage_bonus = int(parts[1].strip())
                    except:
                        damage_bonus = 0
                
                attack_result = simulate_attack(monster, player, attack_bonus, damage_dice, damage_bonus)
                combat_log.append(f"  {attack_result['message']}")
            else:
                # Fallback attack if no actions defined
                attack_result = simulate_attack(monster, player, 3, "1d6", 0)
                combat_log.append(f"  {attack_result['message']}")
        
        combat_log.append(f"  Player HP: {player.current_hp}/{player.max_hp}")
        combat_log.append(f"  Monster HP: {monster.current_hp}/{monster.max_hp}")
        combat_log.append("")
        
        encounter.next_turn()
        round_count += 1
    
    # Get final result
    result = encounter.get_combat_result()
    combat_log.append("=== COMBAT ENDS ===")
    combat_log.append(f"Result: {result.upper()}")
    combat_log.append(f"Final Player HP: {player.current_hp}/{player.max_hp}")
    combat_log.append(f"Final Monster HP: {monster.current_hp}/{monster.max_hp}")
    
    return {
        "combat_log": combat_log,
        "result": result,
        "player_hp": player.current_hp,
        "monster_hp": monster.current_hp,
        "round": encounter.round,
        "player": player,
        "monster": monster
    }