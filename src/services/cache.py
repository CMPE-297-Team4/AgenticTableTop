"""
LLM Response Cache Utility

Caches LLM responses to reduce API calls during local development.
Uses file-based caching with JSON serialization.
"""

import hashlib
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional


class LLMCache:
    """File-based cache for LLM responses"""

    def __init__(self, cache_dir: str = "cache/llm_responses"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Cache expiry (in hours) - can be configured via environment
        self.cache_expiry_hours = int(os.environ.get("LLM_CACHE_EXPIRY_HOURS", "24"))

    def _get_cache_key(self, prompt: str, model: str = "default") -> str:
        """Generate a cache key from prompt and model"""
        # Create a hash of the prompt + model for the filename
        content = f"{prompt}:{model}"
        return hashlib.md5(content.encode()).hexdigest()

    def _get_cache_file_path(self, cache_key: str) -> Path:
        """Get the full path to a cache file"""
        return self.cache_dir / f"{cache_key}.json"

    def get(self, prompt: str, model: str = "default") -> Optional[Dict[str, Any]]:
        """
        Retrieve cached response for a prompt

        Args:
            prompt: The prompt that was used
            model: The model that was used (for cache key differentiation)

        Returns:
            Cached response dict or None if not found/expired
        """
        cache_key = self._get_cache_key(prompt, model)
        cache_file = self._get_cache_file_path(cache_key)

        if not cache_file.exists():
            return None

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)

            # Check if cache is expired
            cached_time = datetime.fromisoformat(cached_data["timestamp"])
            expiry_time = cached_time + timedelta(hours=self.cache_expiry_hours)

            if datetime.now() > expiry_time:
                # Cache expired, remove file
                cache_file.unlink()
                return None

            return cached_data["response"]

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # Corrupted cache file, remove it
            print(f"Warning: Corrupted cache file {cache_file}, removing: {e}")
            cache_file.unlink()
            return None

    def set(self, prompt: str, response: Dict[str, Any], model: str = "default") -> None:
        """
        Cache a response for a prompt

        Args:
            prompt: The prompt that was used
            response: The response to cache
            model: The model that was used
        """
        cache_key = self._get_cache_key(prompt, model)
        cache_file = self._get_cache_file_path(cache_key)

        cache_data = {
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "model": model,
            "response": response,
        }

        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Warning: Failed to cache response: {e}")

    def clear(self) -> int:
        """
        Clear all cached responses

        Returns:
            Number of cache files removed
        """
        removed_count = 0
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                removed_count += 1
            except Exception as e:
                print(f"Warning: Failed to remove cache file {cache_file}: {e}")

        return removed_count

    def cleanup_expired(self) -> int:
        """
        Remove expired cache files

        Returns:
            Number of expired files removed
        """
        removed_count = 0
        current_time = datetime.now()

        for cache_file in self.cache_dir.glob("*.json"):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)

                cached_time = datetime.fromisoformat(cached_data["timestamp"])
                expiry_time = cached_time + timedelta(hours=self.cache_expiry_hours)

                if current_time > expiry_time:
                    cache_file.unlink()
                    removed_count += 1

            except (json.JSONDecodeError, KeyError, ValueError):
                # Corrupted file, remove it
                cache_file.unlink()
                removed_count += 1
            except Exception as e:
                print(f"Warning: Failed to process cache file {cache_file}: {e}")

        return removed_count

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics

        Returns:
            Dictionary with cache stats
        """
        cache_files = list(self.cache_dir.glob("*.json"))
        total_files = len(cache_files)

        total_size = sum(f.stat().st_size for f in cache_files)

        # Count expired files
        expired_count = 0
        current_time = datetime.now()

        for cache_file in cache_files:
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)

                cached_time = datetime.fromisoformat(cached_data["timestamp"])
                expiry_time = cached_time + timedelta(hours=self.cache_expiry_hours)

                if current_time > expiry_time:
                    expired_count += 1

            except Exception:
                expired_count += 1

        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "expired_files": expired_count,
            "cache_dir": str(self.cache_dir),
            "expiry_hours": self.cache_expiry_hours,
        }


# Global cache instance
llm_cache = LLMCache()


def get_cached_response(prompt: str, model: str = "default") -> Optional[Dict[str, Any]]:
    """Convenience function to get cached response"""
    return llm_cache.get(prompt, model)


def cache_response(prompt: str, response: Dict[str, Any], model: str = "default") -> None:
    """Convenience function to cache response"""
    llm_cache.set(prompt, response, model)


def clear_llm_cache() -> int:
    """Convenience function to clear all cache"""
    return llm_cache.clear()


def cleanup_expired_cache() -> int:
    """Convenience function to cleanup expired cache"""
    return llm_cache.cleanup_expired()


def get_cache_stats() -> Dict[str, Any]:
    """Convenience function to get cache stats"""
    return llm_cache.get_stats()
