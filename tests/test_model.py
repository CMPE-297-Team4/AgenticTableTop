"""
Unit tests for core/model.py
"""

from unittest.mock import MagicMock, patch

import pytest

# Skip all tests in this module if dependencies are not available
pytest.importorskip("langchain_openai")
pytest.importorskip("langchain_google_genai")

from core.model import initialize_llm  # noqa: E402


class TestInitializeLLM:
    """Tests for initialize_llm function"""

    @patch("core.model.OPENAI_API_KEY", "test-openai-key")
    @patch("core.model.MODEL_TYPE", "OPENAI")
    @patch("core.model.ChatOpenAI")
    def test_initialize_openai_llm(self, mock_chat_openai):
        """Test initialization of OpenAI LLM"""
        mock_instance = MagicMock()
        mock_chat_openai.return_value = mock_instance

        result = initialize_llm()

        mock_chat_openai.assert_called_once()
        assert result == mock_instance

    @patch("core.model.GEMINI_API_KEY", "test-gemini-key")
    @patch("core.model.MODEL_TYPE", "GEMINI")
    @patch("core.model.ChatGoogleGenerativeAI")
    def test_initialize_gemini_llm(self, mock_chat_gemini):
        """Test initialization of Gemini LLM"""
        mock_instance = MagicMock()
        mock_chat_gemini.return_value = mock_instance

        result = initialize_llm()

        mock_chat_gemini.assert_called_once()
        assert result == mock_instance

    @patch("core.model.OPENAI_API_KEY", "")
    @patch("core.model.GEMINI_API_KEY", "")
    def test_initialize_llm_without_api_keys_raises_error(self):
        """Test that initialization without API keys raises ValueError"""
        with pytest.raises(ValueError, match="Please set up your API keys"):
            initialize_llm()

    @patch("core.model.OPENAI_API_KEY", "test-openai-key")
    @patch("core.model.MODEL_TYPE", "OPENAI")
    @patch("core.model.ChatOpenAI")
    def test_initialize_llm_uses_correct_model_name(self, mock_chat_openai):
        """Test that initialization uses the configured model name"""
        mock_instance = MagicMock()
        mock_chat_openai.return_value = mock_instance

        initialize_llm()

        # Verify that ChatOpenAI was called with model_name parameter
        call_kwargs = mock_chat_openai.call_args[1]
        assert "model_name" in call_kwargs
