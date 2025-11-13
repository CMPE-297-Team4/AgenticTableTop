"""
Pytest configuration and shared fixtures.
"""

import sys
from pathlib import Path
from unittest.mock import Mock

import pytest

# Add src/ to Python path so we can import modules directly
src_path = Path(__file__).parent.parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from core.state import GameStatus  # noqa: E402


@pytest.fixture
def mock_llm():
    """Mock LLM for testing without API calls"""
    mock = Mock()
    mock.invoke.return_value.content = """
    {
        "title": "Test Campaign",
        "background_story": "A test story for unit testing.",
        "key_themes": ["test", "mock", "adventure"]
    }
    """
    return mock


@pytest.fixture
def mock_llm_with_usage():
    """Mock LLM with usage metadata for token counting tests"""
    mock = Mock()
    response = Mock()
    response.content = '{"title": "Test", "background_story": "Story", "key_themes": ["theme"]}'
    response.usage_metadata = {"total_tokens": 150}
    mock.invoke.return_value = response
    return mock


@pytest.fixture
def empty_game_state():
    """Empty game state for testing"""
    return GameStatus()


@pytest.fixture
def populated_game_state():
    """Game state with background story populated"""
    state = GameStatus()
    state["title"] = "The Shadow Realm"
    state["background_story"] = "Long ago, in a forgotten kingdom..."
    state["key_themes"] = ["darkness", "redemption", "ancient evil"]
    state["acts"] = []
    return state


@pytest.fixture
def sample_story_response():
    """Sample LLM response for story generation"""
    return """```json
    {
        "title": "The Shadow Realm",
        "background_story": "Long ago, in a forgotten kingdom beneath the mountains, a great evil was sealed away by the Council of Mages. For centuries, the seal held strong, but now cracks are appearing, and dark forces are seeping back into the world.",
        "key_themes": ["darkness", "redemption", "ancient evil"]
    }
    ```"""


@pytest.fixture
def sample_story_response_no_code_blocks():
    """Sample LLM response without code block markers"""
    return """{
        "title": "The Lost Kingdom",
        "background_story": "A kingdom lost to time, waiting to be discovered.",
        "key_themes": ["discovery", "mystery", "adventure"]
    }"""


@pytest.fixture
def sample_acts_response():
    """Sample LLM response for act generation"""
    return """```json
    {
        "title": "The Shadow Realm",
        "acts": [
            {
                "act_title": "Act I - The Awakening",
                "act_summary": "The heroes discover strange occurrences in their village.",
                "narrative_goal": "Investigate the disturbances",
                "primary_conflict": "Local resistance to outsiders",
                "stakes": "Village safety",
                "key_locations": ["Village Square", "Dark Forest"],
                "mechanics_or_features_introduced": ["investigation", "social interaction"],
                "entry_requirements": "None",
                "exit_conditions": "Find the source of disturbances",
                "handoff_notes_for_next_stage": ["needs dungeon map", "introduce antagonist"]
            },
            {
                "act_title": "Act II - The Descent",
                "act_summary": "The party ventures into ancient ruins beneath the village.",
                "narrative_goal": "Uncover the ancient seal",
                "primary_conflict": "Monsters and traps in the ruins",
                "stakes": "The seal's integrity",
                "key_locations": ["Ancient Ruins", "Seal Chamber"],
                "mechanics_or_features_introduced": ["dungeon crawling", "combat encounters"],
                "entry_requirements": "Completed Act I investigation",
                "exit_conditions": "Discover the weakened seal",
                "handoff_notes_for_next_stage": ["design boss encounter", "reveal prophecy"]
            }
        ],
        "progression_overview": "Heroes move from investigation to action, discovering ancient threats.",
        "core_themes": ["discovery", "danger", "heroism"],
        "open_threads_to_resolve_later": ["Identity of the sealed evil", "Council of Mages fate"]
    }
    ```"""


@pytest.fixture
def invalid_json_response():
    """Invalid JSON response for error testing"""
    return "This is not valid JSON at all { broken }"


@pytest.fixture
def sample_quests_response():
    """Sample LLM response for quest generation"""
    return """```json
    {
        "act_title": "Act I - The Awakening",
        "quests": [
            {
                "quest_name": "Investigate the Strange Occurrences",
                "quest_type": "Investigation (Main)",
                "description": "The village has been plagued by mysterious events.",
                "objectives": ["Interview witnesses", "Examine the scene", "Report findings"],
                "key_npcs": ["Village Elder", "Witness"],
                "locations": ["Village Square", "Crime Scene"],
                "rewards": "100 gold, Information",
                "difficulty": "Easy",
                "estimated_sessions": 1,
                "prerequisites": "Arrive in village",
                "outcomes": "Learn about the threat"
            },
            {
                "quest_name": "Secure the Perimeter",
                "quest_type": "Combat (Side)",
                "description": "Defend the village from incoming threats.",
                "objectives": ["Set up defenses", "Fight off attackers"],
                "key_npcs": ["Guard Captain"],
                "locations": ["Village Gates"],
                "rewards": "250 gold, Reputation",
                "difficulty": "Medium",
                "estimated_sessions": 1,
                "prerequisites": "Complete investigation",
                "outcomes": "Village is safe"
            }
        ]
    }
    ```"""


@pytest.fixture
def populated_game_state_with_acts():
    """Game state with acts populated for quest generation"""
    state = GameStatus()
    state["title"] = "The Shadow Realm"
    state["background_story"] = "Long ago, in a forgotten kingdom..."
    state["key_themes"] = ["darkness", "redemption"]
    state["acts"] = [
        {
            "act_title": "Act I - The Awakening",
            "act_summary": "Heroes discover strange occurrences.",
            "narrative_goal": "Investigate disturbances",
            "primary_conflict": "Local resistance",
            "stakes": "Village safety",
            "key_locations": ["Village Square", "Dark Forest"],
            "mechanics_or_features_introduced": ["investigation"],
            "entry_requirements": "None",
            "exit_conditions": "Find source",
            "handoff_notes_for_next_stage": ["needs dungeon"],
        }
    ]
    return state
