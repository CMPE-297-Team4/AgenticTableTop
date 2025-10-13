from typing import Any, Dict, List

from typing_extensions import TypedDict


class GameStatus(TypedDict):
    title: str
    background_story: str
    key_themes: list[str]
    acts: list[Dict[str, Any]]
    quests: Dict[str, List[Dict[str, Any]]]  # Key: act_title, Value: list of quests
