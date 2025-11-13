"""
Text-to-Speech Service

Generates audio from text using OpenAI TTS API.
"""

import os
from typing import Optional

from openai import OpenAI


def generate_speech(
    text: str,
    model: str = "tts-1",
    voice: str = "alloy",
    speed: float = 1.0,
    api_key: Optional[str] = None,
) -> bytes:
    """
    Generate speech audio from text using OpenAI TTS.

    Args:
        text: Text to convert to speech
        model: TTS model to use (tts-1 or tts-1-hd)
        voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
        speed: Speed of speech (0.25 to 4.0)
        api_key: OpenAI API key (defaults to env var)

    Returns:
        Audio data as bytes (MP3 format)
    """
    api_key = api_key or os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

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
