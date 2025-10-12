"""
Unit tests for utils/agents.py
"""

import pytest

from utils.agents import background_story, generate_game_plan


class TestBackgroundStory:
    """Tests for background_story function"""

    def test_background_story_returns_true_on_success(self, mock_llm, empty_game_state):
        """Test that background_story returns True on successful execution"""
        result = background_story(mock_llm, empty_game_state)
        assert result is True

    def test_background_story_updates_state_title(self, mock_llm, empty_game_state):
        """Test that background_story updates the state with title"""
        background_story(mock_llm, empty_game_state)
        assert "title" in empty_game_state
        assert empty_game_state["title"] is not None
        assert isinstance(empty_game_state["title"], str)

    def test_background_story_updates_state_background(self, mock_llm, empty_game_state):
        """Test that background_story updates the state with background_story"""
        background_story(mock_llm, empty_game_state)
        assert "background_story" in empty_game_state
        assert empty_game_state["background_story"] is not None
        assert isinstance(empty_game_state["background_story"], str)

    def test_background_story_updates_state_themes(self, mock_llm, empty_game_state):
        """Test that background_story updates the state with key_themes"""
        background_story(mock_llm, empty_game_state)
        assert "key_themes" in empty_game_state
        assert empty_game_state["key_themes"] is not None
        assert isinstance(empty_game_state["key_themes"], list)

    def test_background_story_calls_llm_invoke(self, mock_llm, empty_game_state):
        """Test that background_story calls the LLM's invoke method"""
        background_story(mock_llm, empty_game_state)
        mock_llm.invoke.assert_called_once()


class TestGamePlan:
    """Tests for generate_game_plan function"""

    def test_generate_game_plan_returns_true_on_success(
        self, mock_llm_with_acts, populated_game_state
    ):
        """Test that generate_game_plan returns True on successful execution"""
        result = generate_game_plan(mock_llm_with_acts, populated_game_state)
        assert result is True

    def test_generate_game_plan_needs_title_in_state(self, mock_llm, empty_game_state):
        """Test that generate_game_plan requires title in state"""
        with pytest.raises(KeyError):
            generate_game_plan(mock_llm, empty_game_state)

    def test_generate_game_plan_needs_background_in_state(self, mock_llm, empty_game_state):
        """Test that generate_game_plan requires background_story in state"""
        empty_game_state["title"] = "Test Title"
        with pytest.raises(KeyError):
            generate_game_plan(mock_llm, empty_game_state)

    def test_generate_game_plan_updates_state_with_acts(
        self, mock_llm_with_acts, populated_game_state
    ):
        """Test that generate_game_plan updates state with acts"""
        generate_game_plan(mock_llm_with_acts, populated_game_state)
        assert "acts" in populated_game_state
        assert isinstance(populated_game_state["acts"], list)

    def test_generate_game_plan_calls_llm_invoke(self, mock_llm_with_acts, populated_game_state):
        """Test that generate_game_plan calls the LLM's invoke method"""
        generate_game_plan(mock_llm_with_acts, populated_game_state)
        mock_llm_with_acts.invoke.assert_called_once()


# Additional fixtures specific to these tests
@pytest.fixture
def mock_llm_with_acts():
    """Mock LLM that returns acts response"""
    from unittest.mock import Mock

    mock = Mock()
    mock.invoke.return_value.content = """```json
    {
        "title": "The Shadow Realm",
        "acts": [
            {
                "act_title": "Act I - The Beginning",
                "act_summary": "The story begins",
                "narrative_goal": "Set the stage",
                "primary_conflict": "Initial challenge",
                "stakes": "Low stakes",
                "key_locations": ["Start Location"],
                "mechanics_or_features_introduced": ["basic mechanics"],
                "entry_requirements": "None",
                "exit_conditions": "Complete introduction",
                "handoff_notes_for_next_stage": ["prepare for act 2"]
            }
        ]
    }
    ```"""
    return mock
