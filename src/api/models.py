"""
Pydantic models for API request/response schemas
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


class CampaignRequest(BaseModel):
    """Request model for campaign generation"""

    outline: Optional[str] = "I want a background story for a new Dungeons & Dragons campaign."
    model_type: Optional[str] = "openai"  # or "gemini"
    save_to_pinecone: Optional[bool] = False  # Whether to save to Pinecone
    user_id: Optional[str] = None  # User ID for Pinecone storage
    tags: Optional[List[str]] = []  # Tags for Pinecone storage
    force_new: Optional[bool] = False  # Force new generation, bypass cache


class CampaignResponse(BaseModel):
    """Response model for campaign generation"""

    title: str
    background: str
    theme: str
    acts: List[Dict[str, Any]]
    quests: Dict[str, List[Dict[str, Any]]]
    total_acts: int
    total_quests: int


class StoryResponse(BaseModel):
    """Response model for story generation only"""

    title: str
    background: str
    theme: str


class SaveCampaignRequest(BaseModel):
    """Request model for saving campaign to Pinecone"""

    campaign_data: CampaignResponse
    user_id: Optional[str] = None
    tags: Optional[List[str]] = []


class SearchRequest(BaseModel):
    """Request model for searching campaigns"""

    query: str
    user_id: Optional[str] = None
    limit: Optional[int] = 10


class SearchResponse(BaseModel):
    """Response model for search results"""

    results: List[Dict[str, Any]]
    total: int


class NPCImageRequest(BaseModel):
    """Request model for NPC image generation"""

    npc_name: str
    npc_description: str  # race, class, background, role
    quest_context: Optional[str] = None  # additional context
    campaign_id: Optional[str] = None  # optional - link to campaign


class UserRegister(BaseModel):
    """Request model for user registration"""

    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Request model for user login"""

    username: str
    password: str


class Token(BaseModel):
    """Response model for authentication token"""

    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


class UserResponse(BaseModel):
    """Response model for user information"""

    id: int
    username: str
    email: str
    is_active: bool


class NPCImageResponse(BaseModel):
    """Response model for NPC image generation"""

    npc_name: str
    image_base64: str
    prompt_used: str


class MonsterGenerationRequest(BaseModel):
    """Request model for monster generation"""

    quest_name: str
    quest_description: str
    quest_type: str
    difficulty: str = "Medium"
    locations: List[str] = []
    objectives: List[str] = []
    quest_context: Optional[str] = None


class MonsterResponse(BaseModel):
    """Response model for monster generation"""

    quest_name: str
    monsters: List[Dict[str, Any]]


class CombatRequest(BaseModel):
    """Request model for combat simulation"""

    player_name: str
    player_max_hp: int
    player_armor_class: int
    player_dexterity_modifier: int
    monster_name: str
    monster_data: Dict[str, Any]


class CombatResponse(BaseModel):
    """Response model for combat simulation"""

    combat_log: List[str]
    result: str
    player_hp: int
    monster_hp: int
    round: int
    current_turn: str
