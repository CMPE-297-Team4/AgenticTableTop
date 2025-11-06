"""
RAG Integration Quick Start Examples

This script provides copy-paste examples for using RAG features.
"""

# =============================================================================
# EXAMPLE 1: Simple RAG-Augmented Campaign Generation
# =============================================================================

def example_basic_rag_campaign():
    """Generate a campaign with RAG-augmented content."""
    from utils.model import initialize_llm
    from utils.state import GameStatus
    from utils.agents import (
        background_story_with_rag,
        generate_game_plan_with_rag,
        generate_quests_for_act_with_rag,
    )
    from utils.rag_service import get_rag_service

    # Initialize
    model = initialize_llm()
    state = GameStatus()
    rag = get_rag_service()

    # Ensure index exists
    rag.ensure_index("agentic-tabletop")

    # Generate with RAG
    background_story_with_rag(model, state, rag, "campaign-setting")
    generate_game_plan_with_rag(model, state, rag, "campaign-rules")

    # Generate quests for each act
    for i in range(len(state["acts"])):
        generate_quests_for_act_with_rag(model, state, i, rag, "campaign-rules")

    # Print results
    print(f"Campaign: {state['title']}")
    print(f"Total Acts: {len(state['acts'])}")
    print(f"Total Quests: {sum(len(q) for q in state.get('quests', {}).values())}")
    print(f"RAG Augmented: {state.get('rag_augmented', False)}")


# =============================================================================
# EXAMPLE 2: Build Knowledge Base from PDFs
# =============================================================================

def example_build_knowledge_base():
    """Upload PDFs to create a knowledge base."""
    from utils.rag_service import RAGService

    rag = RAGService()

    # Ensure index exists
    rag.ensure_index("agentic-tabletop")

    # Upload D&D 5e rules
    print("Uploading D&D 5e rules...")
    num_rules = rag.upsert_pdf_to_knowledge_base(
        pdf_path="dnd5e_rules.pdf",
        namespace="campaign-rules",
        doc_id_prefix="dnd5e",
    )
    print(f"  ✓ Uploaded {num_rules} rule chunks")

    # Upload campaign setting
    print("Uploading campaign setting...")
    num_setting = rag.upsert_pdf_to_knowledge_base(
        pdf_path="my_world.pdf",
        namespace="campaign-setting",
        doc_id_prefix="world",
    )
    print(f"  ✓ Uploaded {num_setting} setting chunks")

    # Upload NPCs
    print("Uploading NPC database...")
    num_npcs = rag.upsert_pdf_to_knowledge_base(
        pdf_path="npcs.pdf",
        namespace="campaign-characters",
        doc_id_prefix="npcs",
    )
    print(f"  ✓ Uploaded {num_npcs} NPC chunks")

    # Check stats
    stats = rag.get_index_stats()
    print(f"\nIndex stats: {stats}")


# =============================================================================
# EXAMPLE 3: Query Knowledge Base Directly
# =============================================================================

def example_query_knowledge_base():
    """Retrieve context from knowledge base."""
    from utils.rag_service import RAGService

    rag = RAGService()
    rag.ensure_index("agentic-tabletop")

    # Query for rules about combat
    print("Querying for combat rules...")
    context = rag.retrieve_context(
        query="How do combat actions work in D&D 5e?",
        namespace="campaign-rules",
        top_k=3,
    )
    print("Retrieved context:")
    print(context)
    print()

    # Query for setting information
    print("Querying for setting information...")
    context = rag.retrieve_context(
        query="What are the main regions in the campaign world?",
        namespace="campaign-setting",
        top_k=3,
    )
    print("Retrieved context:")
    print(context)


# =============================================================================
# EXAMPLE 4: Manage Namespaces
# =============================================================================

def example_manage_namespaces():
    """Create and manage different knowledge namespaces."""
    from utils.rag_service import RAGService

    rag = RAGService()
    rag.ensure_index("agentic-tabletop")

    # Check current namespaces
    stats = rag.get_index_stats()
    print("Current namespaces:")
    for ns, info in stats.get("namespaces", {}).items():
        print(f"  - {ns}: {info.get('vector_count', 0)} vectors")

    # Clear a namespace
    print("\nClearing campaign-rules namespace...")
    rag.delete_namespace("campaign-rules")
    print("  ✓ Cleared")

    # Verify
    stats = rag.get_index_stats()
    print("\nNamespaces after clearing:")
    for ns, info in stats.get("namespaces", {}).items():
        print(f"  - {ns}: {info.get('vector_count', 0)} vectors")


# =============================================================================
# EXAMPLE 5: Standard Campaign Generation (No RAG)
# =============================================================================

def example_standard_campaign():
    """Generate a campaign without RAG (original functionality)."""
    from utils.model import initialize_llm
    from utils.state import GameStatus
    from utils.agents import background_story, generate_game_plan, generate_quests_for_act

    # Initialize
    model = initialize_llm()
    state = GameStatus()

    # Generate without RAG
    background_story(model, state)
    generate_game_plan(model, state)

    # Generate quests for each act
    for i in range(len(state["acts"])):
        generate_quests_for_act(model, state, i)

    # Print results
    print(f"Campaign: {state['title']}")
    print(f"Total Acts: {len(state['acts'])}")
    print(f"Total Quests: {sum(len(q) for q in state.get('quests', {}).values())}")


# =============================================================================
# EXAMPLE 6: Mixed RAG/Non-RAG (Selective RAG)
# =============================================================================

def example_selective_rag():
    """Use RAG for some steps, regular generation for others."""
    from utils.model import initialize_llm
    from utils.state import GameStatus
    from utils.agents import (
        background_story_with_rag,
        generate_game_plan,  # No RAG
        generate_quests_for_act_with_rag,
    )
    from utils.rag_service import get_rag_service

    # Initialize
    model = initialize_llm()
    state = GameStatus()
    rag = get_rag_service()

    # Generate background with RAG (grounded in setting)
    background_story_with_rag(model, state, rag, "campaign-setting")

    # Generate game plan without RAG (more creative)
    generate_game_plan(model, state)

    # Generate quests with RAG (grounded in rules)
    for i in range(len(state["acts"])):
        generate_quests_for_act_with_rag(model, state, i, rag, "campaign-rules")


# =============================================================================
# MAIN: Run examples
# =============================================================================

if __name__ == "__main__":
    import sys

    print("RAG Integration Examples\n")
    print("Available examples:")
    print("  1. Basic RAG Campaign Generation")
    print("  2. Build Knowledge Base from PDFs")
    print("  3. Query Knowledge Base Directly")
    print("  4. Manage Namespaces")
    print("  5. Standard Campaign Generation (No RAG)")
    print("  6. Selective RAG Usage")
    print()

    try:
        choice = input("Enter example number (1-6): ").strip()

        if choice == "1":
            print("\n=== Example 1: Basic RAG Campaign Generation ===\n")
            example_basic_rag_campaign()
        elif choice == "2":
            print("\n=== Example 2: Build Knowledge Base ===\n")
            example_build_knowledge_base()
        elif choice == "3":
            print("\n=== Example 3: Query Knowledge Base ===\n")
            example_query_knowledge_base()
        elif choice == "4":
            print("\n=== Example 4: Manage Namespaces ===\n")
            example_manage_namespaces()
        elif choice == "5":
            print("\n=== Example 5: Standard Campaign Generation ===\n")
            example_standard_campaign()
        elif choice == "6":
            print("\n=== Example 6: Selective RAG Usage ===\n")
            example_selective_rag()
        else:
            print("Invalid choice. Please enter 1-6.")
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
