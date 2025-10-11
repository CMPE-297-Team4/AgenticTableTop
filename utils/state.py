from typing import Dict
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

class GameStatus(TypedDict):
    title: str
    background_story: str
    key_themes: list[str]
    acts: list[Dict[str, str]]
