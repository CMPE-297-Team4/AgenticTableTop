"""
Pydantic schemas for game entities.
These provide automatic validation and type conversion from JSON.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class SpecialAbility(BaseModel):
    """Special ability for a monster"""

    name: str
    description: str


class MonsterAction(BaseModel):
    """Action/attack for a monster"""

    name: str
    description: str
    attack_bonus: int
    damage: str
    damage_type: str


class LegendaryAction(BaseModel):
    """Legendary action for a monster"""

    name: str
    description: str
    cost: Optional[int] = 1


class Monster(BaseModel):
    """
    Complete monster schema with automatic validation.
    This handles JSON parsing and type conversion automatically.
    """

    name: str
    size: str = Field(description="Tiny, Small, Medium, Large, Huge, or Gargantuan")
    type: str
    alignment: str
    armor_class: int = Field(ge=0, le=30, description="Armor class (0-30)")
    hit_points: int = Field(ge=1, description="Hit points (must be positive)")
    speed: str
    strength: int = Field(ge=1, le=30, description="Strength score (1-30)")
    dexterity: int = Field(ge=1, le=30, description="Dexterity score (1-30)")
    constitution: int = Field(ge=1, le=30, description="Constitution score (1-30)")
    intelligence: int = Field(ge=1, le=30, description="Intelligence score (1-30)")
    wisdom: int = Field(ge=1, le=30, description="Wisdom score (1-30)")
    charisma: int = Field(ge=1, le=30, description="Charisma score (1-30)")
    challenge_rating: str = Field(
        description="Challenge rating as string (e.g., '3', '1/2', '1/4')"
    )
    proficiency_bonus: int = Field(ge=0, description="Proficiency bonus")
    saving_throws: List[str] = Field(
        default_factory=list, description="List of saving throw proficiencies"
    )
    skills: List[str] = Field(default_factory=list, description="List of skill proficiencies")
    damage_resistances: List[str] = Field(
        default_factory=list, description="List of damage resistances"
    )
    damage_immunities: List[str] = Field(
        default_factory=list, description="List of damage immunities"
    )
    condition_immunities: List[str] = Field(
        default_factory=list, description="List of condition immunities"
    )
    senses: str = Field(default="", description="Senses description")
    languages: str = Field(default="", description="Languages known")
    special_abilities: List[SpecialAbility] = Field(
        default_factory=list, description="List of special abilities"
    )
    actions: List[MonsterAction] = Field(
        default_factory=list, description="List of actions/attacks"
    )
    legendary_actions: List[LegendaryAction] = Field(
        default_factory=list, description="List of legendary actions"
    )
    description: str = Field(default="", description="Lore/visual description")
    tactics: str = Field(default="", description="Combat tactics")
    treasure: str = Field(default="", description="Treasure description")
    environment: str = Field(default="", description="Environment where found")

    # Optional: Unique identifier for referencing
    monster_id: Optional[str] = Field(default=None, description="Optional unique identifier")

    @field_validator(
        "saving_throws",
        "skills",
        "damage_resistances",
        "damage_immunities",
        "condition_immunities",
        "special_abilities",
        "actions",
        "legendary_actions",
        mode="before",
    )
    @classmethod
    def ensure_list(cls, v):
        """Ensure empty arrays are lists, not null"""
        if v is None:
            return []
        return v

    @field_validator("challenge_rating", mode="before")
    @classmethod
    def ensure_string_cr(cls, v):
        """Ensure challenge_rating is always a string"""
        if isinstance(v, (int, float)):
            return str(v)
        return str(v) if v else "0"

    class Config:
        """Pydantic configuration"""

        # Allow extra fields in case LLM adds unexpected ones
        extra = "ignore"
        # Use enum values instead of names
        use_enum_values = True


class MonsterGenerationResponse(BaseModel):
    """Response schema for monster generation"""

    quest_name: str
    monsters: List[Monster]

    @classmethod
    def from_json(cls, json_str: str) -> "MonsterGenerationResponse":
        """
        Parse JSON string directly into validated schema.
        This handles all the parsing and validation automatically.
        """
        return cls.model_validate_json(json_str)


class MonsterRegistry:
    """
    Registry for looking up monsters by various identifiers.
    This solves the "how do we reference monsters" problem.
    """

    def __init__(self):
        # Index by quest_name -> list of monsters
        self._by_quest: dict[str, list[Monster]] = {}
        # Index by monster name -> (quest_name, monster)
        self._by_name: dict[str, list[tuple[str, Monster]]] = {}
        # Index by monster_id -> (quest_name, monster)
        self._by_id: dict[str, tuple[str, Monster]] = {}

    def add_monsters(self, quest_name: str, monsters: List[Monster]):
        """Add monsters for a quest"""
        self._by_quest[quest_name] = monsters

        for monster in monsters:
            # Index by name (multiple monsters can have same name)
            if monster.name not in self._by_name:
                self._by_name[monster.name] = []
            self._by_name[monster.name].append((quest_name, monster))

            # Index by ID if provided
            if monster.monster_id:
                self._by_id[monster.monster_id] = (quest_name, monster)
            else:
                # Generate a unique ID if not provided: quest_name:monster_name
                monster_id = f"{quest_name}:{monster.name}"
                monster.monster_id = monster_id
                self._by_id[monster_id] = (quest_name, monster)

    def get_by_quest(self, quest_name: str) -> List[Monster]:
        """Get all monsters for a quest"""
        return self._by_quest.get(quest_name, [])

    def get_by_name(self, monster_name: str) -> List[tuple[str, Monster]]:
        """Get all monsters with a given name (returns list of (quest_name, monster) tuples)"""
        return self._by_name.get(monster_name, [])

    def get_by_id(self, monster_id: str) -> Optional[tuple[str, Monster]]:
        """Get a specific monster by ID"""
        return self._by_id.get(monster_id)

    def get_unique(self, quest_name: str, monster_name: str) -> Optional[Monster]:
        """Get a specific monster by quest name and monster name"""
        monsters = self.get_by_quest(quest_name)
        for monster in monsters:
            if monster.name == monster_name:
                return monster
        return None

    def list_all_monsters(self) -> List[tuple[str, Monster]]:
        """List all monsters with their quest names"""
        result = []
        for quest_name, monsters in self._by_quest.items():
            for monster in monsters:
                result.append((quest_name, monster))
        return result
