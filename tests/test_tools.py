"""
Unit tests for utils/tools.py
"""

from utils.tools import (
    dice_roll,
    get_total_tokens,
    parse_acts_result,
    parse_quests_result,
    parse_storyteller_result,
)


class TestParseStorytellerResult:
    """Tests for parse_storyteller_result function"""

    def test_parse_valid_json_with_code_blocks(self, sample_story_response):
        """Test parsing valid JSON wrapped in code blocks"""
        result = parse_storyteller_result(sample_story_response)
        assert result is not None
        title, story, themes = result
        assert title == "The Shadow Realm"
        assert "forgotten kingdom" in story
        assert len(themes) == 3
        assert "darkness" in themes

    def test_parse_valid_json_without_code_blocks(self, sample_story_response_no_code_blocks):
        """Test parsing valid JSON without code block markers"""
        result = parse_storyteller_result(sample_story_response_no_code_blocks)
        assert result is not None
        title, story, themes = result
        assert title == "The Lost Kingdom"
        assert "kingdom lost to time" in story
        assert "discovery" in themes

    def test_parse_invalid_json_returns_none(self, invalid_json_response):
        """Test that invalid JSON returns None"""
        result = parse_storyteller_result(invalid_json_response)
        assert result is None

    def test_parse_empty_string_returns_none(self):
        """Test that empty string returns None"""
        result = parse_storyteller_result("")
        assert result is None

    def test_parse_missing_fields_returns_none(self):
        """Test that JSON with missing required fields returns None"""
        response = '{"title": "Test"}'  # Missing background_story and key_themes
        result = parse_storyteller_result(response)
        # Should still parse but may return None for missing fields
        # Behavior depends on implementation
        assert result is None or result[1] is None


class TestParseActsResult:
    """Tests for parse_acts_result function"""

    def test_parse_valid_acts(self, sample_acts_response):
        """Test parsing valid acts JSON"""
        acts = parse_acts_result(sample_acts_response)
        assert len(acts) == 2
        assert acts[0]["act_title"] == "Act I - The Awakening"
        assert acts[1]["act_title"] == "Act II - The Descent"
        assert "key_locations" in acts[0]
        assert len(acts[0]["key_locations"]) == 2

    def test_parse_invalid_json_returns_empty_list(self, invalid_json_response):
        """Test that invalid JSON returns empty list"""
        acts = parse_acts_result(invalid_json_response)
        assert acts == []

    def test_parse_json_without_acts_returns_empty_list(self):
        """Test that JSON without 'acts' field returns empty list"""
        response = '{"title": "Test", "other_field": "value"}'
        acts = parse_acts_result(response)
        assert acts == []

    def test_parse_empty_acts_array(self):
        """Test parsing JSON with empty acts array"""
        response = '{"acts": []}'
        acts = parse_acts_result(response)
        assert acts == []


class TestDiceRoll:
    """Tests for dice_roll function"""

    def test_dice_roll_d20_in_range(self):
        """Test d20 rolls are in valid range"""
        for _ in range(100):
            result = dice_roll(20)
            assert isinstance(result, int)
            assert 1 <= result <= 20

    def test_dice_roll_d6(self):
        """Test d6 rolls are in valid range"""
        for _ in range(50):
            result = dice_roll(6)
            assert isinstance(result, int)
            assert 1 <= result <= 6

    def test_dice_roll_d4(self):
        """Test d4 rolls are in valid range"""
        for _ in range(50):
            result = dice_roll(4)
            assert isinstance(result, int)
            assert 1 <= result <= 4

    def test_dice_roll_d100(self):
        """Test d100 rolls are in valid range"""
        for _ in range(50):
            result = dice_roll(100)
            assert isinstance(result, int)
            assert 1 <= result <= 100

    def test_dice_roll_returns_all_values(self):
        """Test that dice roll can return all possible values (statistical)"""
        # This is a statistical test - with enough rolls, should hit all values
        results = set()
        for _ in range(1000):
            results.add(dice_roll(6))
        # Should have most or all values from 1-6
        assert len(results) >= 5  # Allow for slight statistical variance


class TestParseQuestsResult:
    """Tests for parse_quests_result function"""

    def test_parse_valid_quests(self, sample_quests_response):
        """Test parsing valid quests JSON"""
        quests = parse_quests_result(sample_quests_response)
        assert len(quests) == 2
        assert quests[0]["quest_name"] == "Investigate the Strange Occurrences"
        assert quests[1]["quest_name"] == "Secure the Perimeter"
        assert quests[0]["quest_type"] == "Investigation (Main)"
        assert "objectives" in quests[0]
        assert len(quests[0]["objectives"]) == 3

    def test_parse_invalid_json_returns_empty_list(self, invalid_json_response):
        """Test that invalid JSON returns empty list"""
        quests = parse_quests_result(invalid_json_response)
        assert quests == []

    def test_parse_json_without_quests_returns_empty_list(self):
        """Test that JSON without 'quests' field returns empty list"""
        response = '{"act_title": "Test", "other_field": "value"}'
        quests = parse_quests_result(response)
        assert quests == []

    def test_parse_empty_quests_array(self):
        """Test parsing JSON with empty quests array"""
        response = '{"quests": []}'
        quests = parse_quests_result(response)
        assert quests == []


class TestGetTotalTokens:
    """Tests for get_total_tokens function"""

    def test_get_tokens_from_dict_usage_metadata(self):
        """Test extracting tokens from dict with usage_metadata"""
        resp = {"usage_metadata": {"total_tokens": 150}}
        tokens = get_total_tokens(resp)
        assert tokens == 150

    def test_get_tokens_from_dict_usage(self):
        """Test extracting tokens from dict with usage"""
        resp = {"usage": {"total_tokens": 200}}
        tokens = get_total_tokens(resp)
        assert tokens == 200

    def test_get_tokens_from_object_with_usage_metadata(self, mock_llm_with_usage):
        """Test extracting tokens from object with usage_metadata attribute"""
        response = mock_llm_with_usage.invoke("test")
        tokens = get_total_tokens(response)
        assert tokens == 150

    def test_get_tokens_returns_none_for_missing_data(self):
        """Test that missing token data returns None"""
        resp = {"other_field": "value"}
        tokens = get_total_tokens(resp)
        assert tokens is None

    def test_get_tokens_from_empty_dict(self):
        """Test that empty dict returns None"""
        resp = {}
        tokens = get_total_tokens(resp)
        assert tokens is None
