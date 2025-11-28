"""
Integration tests for gameplay flow
"""

import json
from unittest.mock import Mock, patch

from combat.system import Combatant, CombatEncounter
from core.dm_agent import DungeonMasterAgent
from core.gameplay import GameplayManager, GameplayState
from core.session import add_narrative_event, create_empty_session_state, set_active_quest


class TestGameplayIntegration:
    """Test integrated gameplay flow"""

    @patch("core.dm_agent.initialize_llm")
    def test_dm_agent_with_session_state(self, mock_init_llm):
        """Test DM agent works with session state"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.content = json.dumps(
            {
                "narration": "You enter a dark room.",
                "environmental_details": ["Torch on wall", "Wooden door"],
                "mood": "mysterious",
            }
        )
        mock_model.invoke.return_value = mock_response
        mock_init_llm.return_value = mock_model

        campaign_data = {
            "title": "Test Campaign",
            "background": "A test campaign",
            "theme": "Adventure",
        }

        session_state = create_empty_session_state()
        session_state = add_narrative_event(session_state, "player_action", "I open the door")

        agent = DungeonMasterAgent(use_rag=False)
        result = agent.narrate_scene(
            campaign_data=campaign_data,
            quest=None,
            narrative_history=session_state["narrative_history"],
        )

        assert "narration" in result

    def test_gameplay_manager_initialization(self):
        """Test gameplay manager can be initialized"""
        campaign_data = {"title": "Test", "background": "Test", "theme": "Test"}
        session_state = create_empty_session_state()

        with patch("core.gameplay.DungeonMasterAgent"):
            manager = GameplayManager(session_state, campaign_data)
            assert manager.current_state in GameplayState

    def test_combat_with_monster_agent(self):
        """Test combat system with monster agent"""
        player = Combatant(
            name="Player1",
            max_hp=20,
            current_hp=20,
            armor_class=16,
            initiative=15,
            is_player=True,
        )

        monster = Combatant(
            name="Goblin",
            max_hp=7,
            current_hp=7,
            armor_class=15,
            initiative=12,
            is_player=False,
        )

        monster_data = {
            "Goblin": {
                "name": "Goblin",
                "type": "humanoid",
                "alignment": "Neutral Evil",
                "armor_class": 15,
                "hit_points": 7,
                "abilities": {"strength": 8, "dexterity": 14},
            }
        }

        encounter = CombatEncounter([player, monster], monster_data=monster_data)

        # Test that monster agent is initialized
        assert encounter.monster_agent is not None

        # Test getting monster action
        with patch.object(encounter.monster_agent, "decide_combat_action") as mock_decide:
            mock_decide.return_value = {
                "action": "ATTACK",
                "target": "Player1",
                "description": "Goblin attacks!",
            }

            action = encounter.get_monster_action(monster)
            assert action["action"] == "ATTACK"
            assert action["target"] == "Player1"

    def test_session_state_with_quest(self):
        """Test session state management with quest"""
        state = create_empty_session_state()

        quest = {
            "quest_name": "Test Quest",
            "quest_description": "A test quest",
            "objectives": ["Objective 1", "Objective 2"],
        }

        state = set_active_quest(state, quest)

        assert state["active_quest"] == quest
        assert len(state["quest_objectives"]) == 2

    @patch("core.dm_agent.initialize_llm")
    def test_full_action_flow(self, mock_init_llm):
        """Test full player action -> DM response flow"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.content = json.dumps(
            {
                "result": "success",
                "narration": "You successfully investigate the door.",
                "requires_roll": False,
                "roll_type": "none",
                "state_changes": {},
            }
        )
        mock_model.invoke.return_value = mock_response
        mock_init_llm.return_value = mock_model

        campaign_data = {"title": "Test", "background": "Test", "theme": "Test"}
        session_state = create_empty_session_state()

        with patch("core.gameplay.DungeonMasterAgent"):
            manager = GameplayManager(session_state, campaign_data)
            manager.dm_agent = DungeonMasterAgent(use_rag=False)

            action = {
                "action_type": "INVESTIGATE",
                "description": "I examine the door",
                "target": "door",
            }

            result = manager.process_player_action(action)

            assert "result" in result or "narration" in result
