from utils.agents import background_story, generate_game_plan, generate_quests_for_act, generate_monsters_for_combat_quests
from utils.model import initialize_llm
from utils.state import GameStatus
from utils.tools import print_sample_monsters, interactive_combat_testing, load_player_character


def main():
    """
    Content Generation Pipeline:
    Step 1: Generate a background story for a new Dungeons & Dragons campaign.
    Step 2: Generate a game plan (act 1, 2, 3, etc.) for the campaign based on the background story.
    Step 3: Generate quests for each act.
    Step 4 (Future): Generate NPCs and Monsters. Load player character.
    """
    model = initialize_llm()
    state = GameStatus()
    #TODO: Load player character.
    #player_character = load_player_character()
    # Setting up the game content
    background_story(model, state)
    generate_game_plan(model, state)

    # Generate quests for each act
    print("\n==================Quest Generation Phase==================")
    for i in range(len(state["acts"])):
        generate_quests_for_act(model, state, i)
        print()  # Empty line for readability

    # Generate monsters for combat quests
    generate_monsters_for_combat_quests(model, state)

    # Print summary
    print("\n" + "="*60)
    print("CAMPAIGN GENERATION COMPLETE")
    print("="*60)
    print(f"\nCampaign: {state['title']}")
    print(f"Total Acts: {len(state['acts'])}")
    total_quests = sum(len(quests) for quests in state.get("quests", {}).values())
    print(f"Total Quests Generated: {total_quests}")
    total_monsters = sum(len(monsters) for monsters in state.get("monsters", {}).values())
    print(f"Total Monsters Generated: {total_monsters}")

    # Print sample monsters to verify they were generated
    print_sample_monsters(state, total_monsters, max_monsters_to_show=3)

    # Interactive combat testing
    if total_monsters > 0:
        interactive_combat_testing(state)
    else:
        print("\n⚠️  No monsters generated - skipping combat testing")

    # TODO: Generate NPCs. Load player character. Save campaign to file.


if __name__ == "__main__":
    main()
