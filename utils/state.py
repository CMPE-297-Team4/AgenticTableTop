from typing import Dict

from typing_extensions import TypedDict


class GameStatus(TypedDict):
    title: str
    background_story: str
    key_themes: list[str]
    acts: list[Dict[str, str]]
