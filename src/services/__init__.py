"""
Service layer for external integrations and utilities
"""

from services.cache import (
    cache_response,
    cleanup_expired_cache,
    clear_llm_cache,
    get_cache_stats,
    get_cached_response,
)
from services.character import generate_npc_portrait
from services.trajectory import TrajectoryLogger

# Optional imports - may not be available if dependencies aren't installed
try:
    from services.pinecone import PineconeService, pinecone_service

    _pinecone_available = True
except ImportError:
    PineconeService = None  # type: ignore
    pinecone_service = None  # type: ignore
    _pinecone_available = False

try:
    from services.rag import RAGService, get_rag_service

    _rag_available = True
except ImportError:
    RAGService = None  # type: ignore
    get_rag_service = None  # type: ignore
    _rag_available = False

__all__ = [
    "cache_response",
    "cleanup_expired_cache",
    "clear_llm_cache",
    "get_cache_stats",
    "get_cached_response",
    "generate_npc_portrait",
    "TrajectoryLogger",
]

if _pinecone_available:
    __all__.extend(["PineconeService", "pinecone_service"])

if _rag_available:
    __all__.extend(["RAGService", "get_rag_service"])
