from utils.agents import background_story, generate_game_plan
from utils.model import initialize_llm
from utils.state import GameStatus


def main():
    """
    Some thoughts:
    Step 1: Generate a background story for a new Dungeons & Dragons campaign.
    Step 2: Generate a game plan (act 1, 2, 3, etc.) for the campaign based on the background story.
    Step 3: Generate a list of quests for the game plan.
    etc..
    """
    model = initialize_llm()
    state = GameStatus()

    # Setting up the game, should be a one time process.
    background_story(model, state)
    generate_game_plan(model, state)
    # TODO: Generate Specific quests for each act/ Generate NPC&Monsters. Load player character.


if __name__ == "__main__":
    main()
