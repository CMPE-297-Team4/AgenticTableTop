#!/usr/bin/env python
"""
Quick test to verify RAG setup and basic functionality.
"""

import os
import sys
from pathlib import Path

# Add src/ to Python path so we can import modules directly
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

print("=" * 70)
print("RAG Integration Setup Test")
print("=" * 70)

# Test 1: Check environment variables
print("\n1. Checking environment variables...")
try:
    from dotenv import load_dotenv

    load_dotenv()

    openai_key = os.getenv("OPENAI_API_KEY")
    pinecone_key = os.getenv("PINECONE_API_KEY")

    if openai_key and openai_key != "sk-proj-your-openai-key-here":
        print("   ✓ OPENAI_API_KEY is set")
    else:
        print("   ✗ OPENAI_API_KEY not set or using placeholder")
        print("     → Update .env with your actual OpenAI key")

    if pinecone_key and pinecone_key != "your-pinecone-api-key-here":
        print("   ✓ PINECONE_API_KEY is set")
    else:
        print("   ✗ PINECONE_API_KEY not set or using placeholder")
        print("     → Update .env with your actual Pinecone key")

except Exception as e:
    print(f"   ✗ Error loading .env: {e}")

# Test 2: Check imports
print("\n2. Checking Python imports...")
try:
    from openai import OpenAI  # noqa: F401

    print("   ✓ OpenAI SDK")
except ImportError as e:
    print(f"   ✗ OpenAI SDK: {e}")

try:
    from pinecone import Pinecone  # noqa: F401

    print("   ✓ Pinecone SDK")
except ImportError as e:
    print(f"   ✗ Pinecone SDK: {e}")

try:
    from langchain_openai import ChatOpenAI  # noqa: F401

    print("   ✓ LangChain OpenAI")
except ImportError as e:
    print(f"   ✗ LangChain OpenAI: {e}")

try:
    import yaml  # noqa: F401

    print("   ✓ PyYAML")
except ImportError as e:
    print(f"   ✗ PyYAML: {e}")

try:
    import sklearn  # noqa: F401

    print("   ✓ scikit-learn")
except ImportError as e:
    print(f"   ✗ scikit-learn: {e}")

# Test 3: Check RAG modules
print("\n3. Checking RAG modules...")
try:
    from services.rag import RAGService  # noqa: F401

    print("   ✓ RAGService class")
except ImportError as e:
    print(f"   ✗ RAGService: {e}")

try:
    from core.rag_prompts import rag_storyteller_prompt  # noqa: F401

    print("   ✓ RAG prompts")
except ImportError as e:
    print(f"   ✗ RAG prompts: {e}")

try:
    from core.agents import background_story_with_rag  # noqa: F401

    print("   ✓ RAG agent functions")
except ImportError as e:
    print(f"   ✗ RAG agent functions: {e}")

# Test 4: Check config
print("\n4. Checking configuration...")
try:
    import yaml  # noqa: F811

    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)

    if "RAG" in config:
        print("   ✓ RAG section in config.yaml")
        rag_config = config["RAG"]
        print(f"     - Enabled: {rag_config.get('enabled', False)}")
        print(f"     - Index: {rag_config.get('pinecone', {}).get('index_name', 'N/A')}")
    else:
        print("   ✗ No RAG section in config.yaml")
except Exception as e:
    print(f"   ✗ Error reading config: {e}")

# Test 5: Check .env file
print("\n5. Checking .env file...")
if os.path.exists(".env"):
    print("   ✓ .env file exists")
    print("     → Make sure to fill in your actual API keys!")
else:
    print("   ✗ .env file not found")

print("\n" + "=" * 70)
print("Setup Test Complete!")
print("=" * 70)

print("\nNext steps:")
print("1. Update .env with your actual API keys:")
print("   - OPENAI_API_KEY from https://platform.openai.com/api-keys")
print("   - PINECONE_API_KEY from https://www.pinecone.io/")
print()
print("2. Enable RAG in config.yaml:")
print("   RAG:")
print("     enabled: true")
print()
print("3. Run examples:")
print("   python examples/rag_examples.py")
print()
print("4. See documentation:")
print("   - docs/RAG_SETUP.md - Complete setup guide")
