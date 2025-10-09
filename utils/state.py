from pydantic import BaseModel, Field
from typing_extensions import TypedDict

class BackgroundStoryState(TypedDict):
    title: str
    background_story: str
    tone: str
    key_themes: list[str]
