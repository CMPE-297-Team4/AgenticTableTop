"""
Unit tests for player character generation and management
"""

import json
from unittest.mock import Mock, patch

import pytest

from database.models import PlayerCharacter
from services.character import CHARACTER_SCHEMA, generate_player_character


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for character generation"""
    with patch("services.character.OpenAI") as mock_client:
        client_instance = Mock()
        mock_client.return_value = client_instance

        # Mock character generation response
        mock_response = Mock()
        mock_tool_call = Mock()
        mock_tool_call.function = Mock()
        mock_tool_call.function.name = "save_character"
        mock_tool_call.function.arguments = json.dumps(
            {
                "character": {
                    "character_name": "Test Character",
                    "player_name": "Test Player",
                    "class_and_level": "Fighter 1",
                    "race": "Human",
                    "background": "Soldier",
                    "alignment": "Lawful Good",
                    "experience_points": 0,
                    "abilities": {
                        "strength": 16,
                        "dexterity": 14,
                        "constitution": 15,
                        "intelligence": 10,
                        "wisdom": 12,
                        "charisma": 8,
                    },
                    "saving_throws": {
                        "strength": True,
                        "dexterity": False,
                        "constitution": True,
                        "intelligence": False,
                        "wisdom": False,
                        "charisma": False,
                    },
                    "skills": {
                        "athletics": True,
                        "perception": True,
                    },
                    "proficiency_bonus": 2,
                    "passive_wisdom": 11,
                    "combat_stats": {
                        "armor_class": 16,
                        "initiative": 2,
                        "speed": 30,
                        "hit_point_maximum": 12,
                        "current_hit_points": 12,
                        "temporary_hit_points": 0,
                        "hit_dice_total": "1d10",
                        "death_saves": {"successes": 0, "failures": 0},
                    },
                    "attacks_and_spellcasting": [],
                    "equipment": [],
                    "other_proficiencies_and_languages": [],
                    "features_and_traits": [],
                    "personality_traits": "Brave and loyal",
                    "ideals": "Protect the innocent",
                    "bonds": "My family",
                    "flaws": "Too trusting",
                    "notes": "",
                    "portrait": {"image_path": "test.png", "prompt": ""},
                }
            }
        )
        mock_message = Mock()
        mock_message.tool_calls = [mock_tool_call]
        mock_response.choices = [Mock(message=mock_message)]
        client_instance.chat.completions.create.return_value = mock_response

        # Mock portrait prompt generation
        mock_prompt_response = Mock()
        mock_prompt_response.choices = [Mock(message=Mock(content="A brave human fighter"))]
        client_instance.chat.completions.create.side_effect = [
            mock_response,  # Character generation
            mock_prompt_response,  # Portrait prompt
        ]

        # Mock image generation - use valid base64 padding
        import base64

        mock_image_response = Mock()
        # Create a valid base64 string (must be multiple of 4)
        valid_base64 = base64.b64encode(b"fake_image_data").decode("utf-8")
        mock_image_response.data = [Mock(b64_json=valid_base64)]
        client_instance.images.generate.return_value = mock_image_response

        yield client_instance


class TestCharacterGeneration:
    """Test character generation functionality"""

    def test_character_schema_structure(self):
        """Test that CHARACTER_SCHEMA has required fields"""
        assert "type" in CHARACTER_SCHEMA
        assert CHARACTER_SCHEMA["type"] == "object"
        assert "required" in CHARACTER_SCHEMA
        assert "character_name" in CHARACTER_SCHEMA["required"]
        assert "abilities" in CHARACTER_SCHEMA["properties"]

    @patch("services.character.Path")
    @patch("builtins.open", create=True)
    def test_generate_player_character_success(self, mock_open, mock_path, mock_openai_client):
        """Test successful character generation"""
        # Setup mocks
        from pathlib import Path as RealPath

        # Create a real Path mock that supports operations
        mock_path_instance = Mock(spec=RealPath)
        mock_path_instance.__truediv__ = Mock(return_value=mock_path_instance)
        mock_path_instance.mkdir = Mock()
        mock_path_instance.__str__ = Mock(return_value="test.png")

        # Setup Path to return our mock
        mock_path.return_value = mock_path_instance
        mock_path_instance.parent = mock_path_instance

        result = generate_player_character(
            character_name="Test Character",
            class_and_level="Fighter 1",
            race="Human",
            background="Soldier",
            alignment="Lawful Good",
            player_name="Test Player",
        )

        assert "character" in result
        assert result["character"]["character_name"] == "Test Character"
        assert result["character"]["class_and_level"] == "Fighter 1"
        assert "image_base64" in result
        assert "portrait_prompt" in result

    def test_generate_player_character_error_handling(self):
        """Test error handling in character generation"""
        with patch("services.character.OpenAI") as mock_client:
            mock_client.side_effect = Exception("API Error")

            result = generate_player_character(
                character_name="Test",
                class_and_level="Fighter 1",
                race="Human",
                background="Soldier",
                alignment="Lawful Good",
            )

            assert "error" in result
            assert "Failed to generate player character" in result["error"]


class TestCharacterDatabase:
    """Test character database operations"""

    def test_player_character_model_fields(self):
        """Test that PlayerCharacter model has required fields"""
        assert hasattr(PlayerCharacter, "character_name")
        assert hasattr(PlayerCharacter, "player_name")
        assert hasattr(PlayerCharacter, "class_and_level")
        assert hasattr(PlayerCharacter, "race")
        assert hasattr(PlayerCharacter, "background")
        assert hasattr(PlayerCharacter, "alignment")
        assert hasattr(PlayerCharacter, "character_data")
        assert hasattr(PlayerCharacter, "image_base64")
        assert hasattr(PlayerCharacter, "user_id")
