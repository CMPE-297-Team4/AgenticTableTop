"""
Text-to-Speech Service

Generates audio from text using OpenAI TTS API with theme-based voices and natural modulation.
"""

import os
import re
from typing import Optional

from openai import OpenAI


def get_voice_for_theme(theme: str) -> str:
    """
    Select appropriate voice based on campaign theme.

    Args:
        theme: Campaign theme (e.g., "Comedy", "Horror", "Pirate")

    Returns:
        Voice name for OpenAI TTS
    """
    theme_lower = theme.lower() if theme else ""

    # Theme-specific voice mapping
    if "comedy" in theme_lower or "whimsy" in theme_lower:
        return "nova"  # Bright, energetic female voice
    elif "horror" in theme_lower or "gothic" in theme_lower or "dark" in theme_lower:
        return "onyx"  # Deep, ominous male voice
    elif "pirate" in theme_lower or "swashbuckl" in theme_lower:
        return "echo"  # Gruff, adventurous male voice
    elif "steampunk" in theme_lower or "victorian" in theme_lower:
        return "fable"  # British storytelling voice
    elif "epic" in theme_lower or "heroic" in theme_lower:
        return "onyx"  # Powerful male voice
    else:
        return "alloy"  # Default: dynamic, expressive, engaging voice


def get_speed_for_theme(theme: str) -> float:
    """
    Get base speech speed for theme - optimized for engaging, dynamic narration.

    Args:
        theme: Campaign theme

    Returns:
        Speed multiplier (0.25 to 4.0)
    """
    theme_lower = theme.lower() if theme else ""

    if "comedy" in theme_lower:
        return 1.15  # Faster for comedic energy
    elif "horror" in theme_lower or "gothic" in theme_lower:
        return 0.95  # Still dramatic but not too slow
    elif "pirate" in theme_lower:
        return 1.1  # Swashbuckling pace
    else:
        return 1.05  # Engaging storytelling pace (faster than before)


def add_natural_pauses(text: str) -> str:
    """
    Add minimal, natural pauses for dynamic, engaging speech.
    Less is more - keeping the narration flowing and energetic.

    Args:
        text: Input text

    Returns:
        Text with minimal punctuation for natural, fast-paced delivery
    """
    # Only add essential pauses for dramatic effect
    # Add brief pause for transitional words (but keep it minimal)
    text = re.sub(r"\s(Suddenly|Meanwhile)\s", r", \1, ", text, flags=re.IGNORECASE)

    # Add commas after introductory scene-setters (only the most important ones)
    text = re.sub(r"(As you enter|When you arrive)\s", r"\1, ", text, flags=re.IGNORECASE)

    # Clean up paragraph breaks to keep flow
    text = re.sub(r"\n\n+", ". ", text)
    text = re.sub(r"\n", " ", text)

    # Clean up any accidental double punctuation
    text = re.sub(r",\s*,+", ",", text)
    text = re.sub(r"\.\s*\.+", ".", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def generate_speech(
    text: str,
    model: str = "tts-1-hd",  # Use HD model for better quality
    voice: str = "alloy",
    speed: float = 1.0,
    api_key: Optional[str] = None,
    theme: Optional[str] = None,
    add_modulation: bool = True,
) -> bytes:
    """
    Generate speech audio from text using OpenAI TTS with theme-based voices.

    Args:
        text: Text to convert to speech
        model: TTS model to use (tts-1 or tts-1-hd)
        voice: Voice to use (can be overridden by theme)
        speed: Speed of speech (can be overridden by theme)
        api_key: OpenAI API key (defaults to env var)
        theme: Campaign theme for voice selection
        add_modulation: Whether to add natural pauses and modulation

    Returns:
        Audio data as bytes (MP3 format)
    """
    api_key = api_key or os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    # Override voice and speed based on theme if provided
    if theme:
        voice = get_voice_for_theme(theme)
        speed = get_speed_for_theme(theme)

    # Add natural pauses for more human-like speech
    if add_modulation:
        text = add_natural_pauses(text)

    client = OpenAI(api_key=api_key)

    try:
        response = client.audio.speech.create(
            model=model,
            voice=voice,
            input=text,
            speed=speed,
        )

        # Read audio data
        audio_data = response.content

        return audio_data

    except Exception as e:
        raise RuntimeError(f"Failed to generate speech: {str(e)}")
