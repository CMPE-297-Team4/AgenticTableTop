from utils.agents import background_story, generate_game_plan, generate_quests_for_act
from utils.model import initialize_llm
from utils.state import GameStatus


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

    # Setting up the game content
    background_story(model, state)
    generate_game_plan(model, state)

    # Generate quests for each act
    print("\n==================Quest Generation Phase==================")
    for i in range(len(state["acts"])):
        generate_quests_for_act(model, state, i)
        print()  # Empty line for readability

    # Print summary
    print("==================Campaign Generation Complete==================")
    print(f"\nCampaign: {state['title']}")
    print(f"Total Acts: {len(state['acts'])}")
    total_quests = sum(len(quests) for quests in state.get("quests", {}).values())
    print(f"Total Quests Generated: {total_quests}")

    # TODO: Generate NPC&Monsters. Load player character. Save campaign to file.


if __name__ == "__main__":
    main()
