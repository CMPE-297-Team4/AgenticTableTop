"""
Unit tests for AI Dungeon Master agent
"""

import json
from unittest.mock import Mock, patch

import pytest

from core.dm_agent import DungeonMasterAgent


@pytest.fixture
def mock_model():
    """Mock LLM model"""
    model = Mock()
    response = Mock()
    response.content = json.dumps(
        {
            "narration": "You enter a dark, foreboding forest. The trees loom overhead, their branches like skeletal fingers reaching toward the sky.",
            "environmental_details": ["Ancient trees", "Thick undergrowth", "Faint mist"],
            "mood": "mysterious and ominous",
        }
    )
    model.invoke.return_value = response
    return model


@pytest.fixture
def sample_campaign_data():
    """Sample campaign data for testing"""
    return {
        "title": "The Lost Kingdom",
        "background": "A kingdom lost to time, hidden in the mountains.",
        "theme": "Exploration and discovery",
        "acts": [
            {
                "act_title": "Act 1: The Journey Begins",
                "act_summary": "The party sets out on their quest.",
            }
        ],
        "quests": {
            "Act 1: The Journey Begins": [
                {
                    "quest_name": "Find the Ancient Map",
                    "quest_description": "Locate the map that leads to the lost kingdom",
                    "objectives": ["Search the library", "Question the librarian"],
                }
            ]
        },
    }


class TestDungeonMasterAgent:
    """Test DM agent functionality"""

    def test_dm_agent_initialization(self):
        """Test DM agent can be initialized"""
        agent = DungeonMasterAgent(use_rag=False)
        assert agent.model is not None
        assert agent.use_rag is False

    def test_dm_agent_with_rag(self):
        """Test DM agent initialization with RAG"""
        with patch("core.dm_agent.get_rag_service") as mock_rag:
            mock_rag.return_value = Mock()
            agent = DungeonMasterAgent(use_rag=True)
            assert agent.use_rag is True
            assert agent.rag_service is not None

    @patch("core.dm_agent.initialize_llm")
    def test_narrate_scene(self, mock_init_llm, mock_model, sample_campaign_data):
        """Test scene narration"""
        mock_init_llm.return_value = mock_model
        agent = DungeonMasterAgent(use_rag=False)

        result = agent.narrate_scene(
            campaign_data=sample_campaign_data,
            quest=None,
            narrative_history=None,
            location="A dark forest",
        )

        assert "narration" in result
        assert "environmental_details" in result
        assert "mood" in result

    @patch("core.dm_agent.initialize_llm")
    def test_respond_to_action(self, mock_init_llm, mock_model, sample_campaign_data):
        """Test DM response to player action"""
        mock_init_llm.return_value = mock_model
        mock_model.invoke.return_value.content = json.dumps(
            {
                "result": "success",
                "narration": "You successfully open the door.",
                "requires_roll": False,
                "roll_type": "none",
                "state_changes": {},
            }
        )

        agent = DungeonMasterAgent(use_rag=False)

        action = {
            "action_type": "INVESTIGATE",
            "description": "I examine the door for traps",
            "target": "door",
        }

        result = agent.respond_to_action(
            action=action,
            campaign_data=sample_campaign_data,
            quest=None,
            character_data=None,
            narrative_history=None,
        )

        assert "result" in result
        assert "narration" in result

    @patch("core.dm_agent.initialize_llm")
    def test_check_quest_progression(self, mock_init_llm, mock_model, sample_campaign_data):
        """Test quest progression checking"""
        mock_init_llm.return_value = mock_model
        mock_model.invoke.return_value.content = json.dumps(
            {
                "objectives_completed": ["Search the library"],
                "quest_complete": False,
                "narration": "You continue your quest...",
                "next_quest": None,
            }
        )

        agent = DungeonMasterAgent(use_rag=False)

        quest = sample_campaign_data["quests"]["Act 1: The Journey Begins"][0]
        completed_objectives = ["Search the library"]

        result = agent.check_quest_progression(
            quest=quest,
            completed_objectives=completed_objectives,
            campaign_data=sample_campaign_data,
            narrative_history=None,
        )

        assert "quest_complete" in result
        assert "objectives_completed" in result

    @patch("core.dm_agent.initialize_llm")
    def test_narrate_combat(self, mock_init_llm, mock_model, sample_campaign_data):
        """Test combat narration"""
        mock_init_llm.return_value = mock_model
        mock_model.invoke.return_value.content = json.dumps(
            {
                "narration": "The goblin swings its rusty sword at you!",
                "damage_dealt": 5,
                "status_effects": None,
            }
        )

        agent = DungeonMasterAgent(use_rag=False)

        result = agent.narrate_combat(
            action_description="The goblin attacks with its sword",
            attacker="Goblin",
            target="Player",
            damage=5,
            campaign_data=sample_campaign_data,
        )

        assert "narration" in result
        assert "damage_dealt" in result
