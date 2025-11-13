"""
Unit tests for AI Monster agent
"""

import json
from unittest.mock import Mock, patch

import pytest

from core.monster_agent import MonsterAgent


@pytest.fixture
def sample_monster():
    """Sample monster stat block"""
    return {
        "name": "Goblin",
        "type": "humanoid",
        "alignment": "Neutral Evil",
        "size": "Small",
        "armor_class": 15,
        "hit_points": 7,
        "speed": "30 ft",
        "abilities": {
            "strength": 8,
            "dexterity": 14,
            "constitution": 10,
            "intelligence": 10,
            "wisdom": 8,
            "charisma": 8,
        },
    }


@pytest.fixture
def sample_combat_context():
    """Sample combat context"""
    return {
        "round": 1,
        "initiative_order": ["Player1", "Goblin", "Player2"],
        "enemies": ["Player1", "Player2"],
        "allies": [],
        "situation": "Combat in progress",
    }


class TestMonsterAgent:
    """Test monster agent functionality"""

    def test_monster_agent_initialization(self):
        """Test monster agent can be initialized"""
        agent = MonsterAgent()
        assert agent.model is not None

    @patch("core.monster_agent.initialize_llm")
    def test_decide_combat_action(self, mock_init_llm, sample_monster, sample_combat_context):
        """Test monster combat decision"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.content = json.dumps(
            {
                "action": "ATTACK",
                "target": "Player1",
                "description": "The goblin attacks Player1 with its scimitar!",
                "reasoning": "Player1 is the closest enemy",
            }
        )
        mock_model.invoke.return_value = mock_response
        mock_init_llm.return_value = mock_model

        agent = MonsterAgent()
        result = agent.decide_combat_action(sample_monster, sample_combat_context)

        assert "action" in result
        assert "target" in result
        assert "description" in result
        assert result["action"] == "ATTACK"

    @patch("core.monster_agent.initialize_llm")
    def test_decide_combat_action_fallback(
        self, mock_init_llm, sample_monster, sample_combat_context
    ):
        """Test fallback when JSON parsing fails"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.content = "Invalid JSON response"
        mock_model.invoke.return_value = mock_response
        mock_init_llm.return_value = mock_model

        agent = MonsterAgent()
        result = agent.decide_combat_action(sample_monster, sample_combat_context)

        # Should fallback to simple attack
        assert "action" in result
        assert result["action"] == "ATTACK"

    @patch("core.monster_agent.initialize_llm")
    def test_decide_non_combat_behavior(self, mock_init_llm, sample_monster):
        """Test monster non-combat behavior decision"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.content = json.dumps(
            {
                "behavior": "DEFENSIVE",
                "response": "The goblin backs away warily, brandishing its weapon.",
                "dialogue": None,
                "reasoning": "The goblin is outnumbered and cautious",
            }
        )
        mock_model.invoke.return_value = mock_response
        mock_init_llm.return_value = mock_model

        agent = MonsterAgent()

        situation = {
            "context": "Players approach the goblin",
            "player_actions": ["Player1 moves closer"],
            "goals": "Survive",
        }

        result = agent.decide_non_combat_behavior(sample_monster, situation)

        assert "behavior" in result
        assert "response" in result
        assert result["behavior"] == "DEFENSIVE"

    @patch("core.monster_agent.initialize_llm")
    def test_decide_non_combat_behavior_fallback(self, mock_init_llm, sample_monster):
        """Test fallback for non-combat behavior"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.content = "Invalid JSON"
        mock_model.invoke.return_value = mock_response
        mock_init_llm.return_value = mock_model

        agent = MonsterAgent()

        situation = {"context": "Test", "player_actions": [], "goals": "Test"}

        result = agent.decide_non_combat_behavior(sample_monster, situation)

        # Should fallback to defensive behavior
        assert "behavior" in result
        assert result["behavior"] == "DEFENSIVE"
