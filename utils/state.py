from typing import Any, Dict, List

from typing_extensions import TypedDict


class GameStatus(TypedDict):
    title: str
    background_story: str
    key_themes: list[str]
    acts: list[Dict[str, Any]]
    quests: Dict[str, List[Dict[str, Any]]]  # Key: act_title, Value: list of quests
    monsters: Dict[str, List[Dict[str, Any]]]  # Key: quest_name, Value: list of monsters

class Monster(TypedDict):
    name: str
    size: str
    type: str
    alignment: str
    armor_class: int
    hit_points: int
    speed: str
    strength: int
    dexterity: int
    constitution: int
    intelligence: int

class PlayerCharacter(TypedDict):
    name: str
    advancement: str
    level: int
    race: str
    background: str
    alignment: str
    experience_points: int
    inventory: List[str]
    equipment: List[str]
    spells: List[str]
    feats: List[str]