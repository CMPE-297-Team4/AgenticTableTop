"""
Unit tests for game session management
"""

from core.session import (
    add_narrative_event,
    advance_act,
    advance_quest,
    clear_combat_state,
    complete_objective,
    create_empty_session_state,
    load_session_state,
    save_session_state,
    set_active_quest,
    set_combat_state,
)


class TestSessionState:
    """Test session state management"""

    def test_create_empty_session_state(self):
        """Test creating an empty session state"""
        state = create_empty_session_state()

        assert state["current_act_index"] == 0
        assert state["current_quest_index"] == 0
        assert state["current_scene"] is None
        assert state["in_combat"] is False
        assert state["narrative_history"] == []
        assert state["player_characters"] == []

    def test_save_and_load_session_state(self):
        """Test saving and loading session state"""
        state = create_empty_session_state()
        state["current_scene"] = "A dark forest"
        state["current_act_index"] = 1

        state_json = save_session_state(state)
        loaded_state = load_session_state(state_json)

        assert loaded_state["current_scene"] == "A dark forest"
        assert loaded_state["current_act_index"] == 1

    def test_load_invalid_json(self):
        """Test loading invalid JSON returns empty state"""
        loaded_state = load_session_state("invalid json")
        assert loaded_state["current_act_index"] == 0

    def test_add_narrative_event(self):
        """Test adding narrative events"""
        state = create_empty_session_state()
        state = add_narrative_event(state, "dm_narration", "You enter a dark room.")

        assert len(state["narrative_history"]) == 1
        assert state["narrative_history"][0]["type"] == "dm_narration"
        assert state["narrative_history"][0]["content"] == "You enter a dark room."
        assert "timestamp" in state["narrative_history"][0]

    def test_narrative_history_limit(self):
        """Test that narrative history is limited to 100 events"""
        state = create_empty_session_state()

        # Add 105 events
        for i in range(105):
            state = add_narrative_event(state, "player_action", f"Action {i}")

        # Should only keep last 100
        assert len(state["narrative_history"]) == 100
        assert state["narrative_history"][0]["content"] == "Action 5"  # First of last 100

    def test_set_active_quest(self):
        """Test setting active quest"""
        state = create_empty_session_state()
        quest = {
            "quest_name": "Find the Lost Artifact",
            "objectives": ["Search the ruins", "Defeat the guardian", "Retrieve the artifact"],
        }

        state = set_active_quest(state, quest)

        assert state["active_quest"] == quest
        assert state["quest_objectives"] == quest["objectives"]
        assert state["completed_objectives"] == []

    def test_complete_objective(self):
        """Test completing quest objectives"""
        state = create_empty_session_state()
        quest = {
            "quest_name": "Test Quest",
            "objectives": ["Objective 1", "Objective 2"],
        }
        state = set_active_quest(state, quest)

        state = complete_objective(state, "Objective 1")

        assert "Objective 1" in state["completed_objectives"]
        assert "Objective 2" not in state["completed_objectives"]

    def test_advance_quest(self):
        """Test advancing to next quest"""
        state = create_empty_session_state()
        state["current_quest_index"] = 0
        state = set_active_quest(state, {"quest_name": "Quest 1", "objectives": []})

        state = advance_quest(state)

        assert state["current_quest_index"] == 1
        assert state["active_quest"] is None
        assert state["quest_objectives"] == []

    def test_advance_act(self):
        """Test advancing to next act"""
        state = create_empty_session_state()
        state["current_act_index"] = 0
        state["current_quest_index"] = 2

        state = advance_act(state)

        assert state["current_act_index"] == 1
        assert state["current_quest_index"] == 0
        assert state["active_quest"] is None

    def test_set_combat_state(self):
        """Test setting combat state"""
        state = create_empty_session_state()
        combat_state = {"round": 1, "initiative_order": ["Player1", "Monster1"]}

        state = set_combat_state(state, combat_state)

        assert state["combat_state"] == combat_state
        assert state["in_combat"] is True
        assert state["current_encounter"] == "combat"

    def test_clear_combat_state(self):
        """Test clearing combat state"""
        state = create_empty_session_state()
        state = set_combat_state(state, {"round": 1})

        state = clear_combat_state(state)

        assert state["combat_state"] is None
        assert state["in_combat"] is False
        assert state["current_encounter"] is None
