"""
Trajectory Logger for AgenticTableTop

Logs all generated content (campaigns, quests, monsters) to timestamped files
in a trajectory folder for analysis and debugging.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class TrajectoryLogger:
    """Logs generation trajectory to timestamped files"""

    def __init__(self, trajectory_dir: str = "trajectory"):
        self.trajectory_dir = Path(trajectory_dir)
        self.trajectory_dir.mkdir(parents=True, exist_ok=True)

        # Create timestamp for this session
        self.session_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.trajectory_dir / f"generation_{self.session_timestamp}.log"

        # Initialize log file
        self._write_header()

    def _write_header(self):
        """Write header to log file"""
        with open(self.log_file, "w", encoding="utf-8") as f:
            f.write("=== AgenticTableTop Generation Trajectory ===\n")
            f.write(f"Session Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Log File: {self.log_file}\n")
            f.write("=" * 60 + "\n\n")

    def log_monster_generation(
        self,
        quest_name: str,
        quest_data: Dict[str, Any],
        response_content: str,
        monsters: List[Dict[str, Any]],
        success: bool,
        error: Optional[str] = None,
        tokens_used: Optional[int] = None,
        time_taken: Optional[float] = None,
    ):
        """Log monster generation attempt"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'=' * 60}\n")
            f.write(f"MONSTER GENERATION - {timestamp}\n")
            f.write(f"{'=' * 60}\n")
            f.write(f"Quest: {quest_name}\n")
            f.write(f"Quest Type: {quest_data.get('quest_type', 'Unknown')}\n")
            f.write(f"Difficulty: {quest_data.get('difficulty', 'Unknown')}\n")
            f.write(f"Success: {success}\n")

            if tokens_used:
                f.write(f"Tokens Used: {tokens_used}\n")
            if time_taken:
                f.write(f"Time Taken: {time_taken:.2f} seconds\n")

            if success:
                f.write(f"Monsters Generated: {len(monsters)}\n")
                for i, monster in enumerate(monsters, 1):
                    f.write(f"\n  Monster {i}:\n")
                    f.write(f"    Name: {monster.get('name', 'Unknown')}\n")
                    f.write(
                        f"    Type: {monster.get('size', 'Unknown')} {monster.get('type', 'Unknown')}\n"
                    )
                    f.write(f"    CR: {monster.get('challenge_rating', 'Unknown')}\n")
                    f.write(f"    HP: {monster.get('hit_points', 0)}\n")
                    f.write(f"    AC: {monster.get('armor_class', 0)}\n")
            else:
                f.write(f"Error: {error}\n")

            f.write("\n--- Raw Response (first 2000 chars) ---\n")
            f.write(response_content[:2000])
            if len(response_content) > 2000:
                f.write(f"\n... (truncated, {len(response_content)} total chars)")
            f.write("\n")

            if success and monsters:
                f.write("\n--- Parsed Monster Data (JSON) ---\n")
                f.write(json.dumps(monsters, indent=2, ensure_ascii=False))
                f.write("\n")

            f.write("\n")

    def log_campaign_summary(
        self,
        campaign_title: str,
        total_acts: int,
        total_quests: int,
        total_monsters: int,
        monsters_by_quest: Dict[str, List[Dict[str, Any]]],
    ):
        """Log final campaign summary"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(f"\n{'=' * 60}\n")
            f.write(f"CAMPAIGN SUMMARY - {timestamp}\n")
            f.write(f"{'=' * 60}\n")
            f.write(f"Campaign: {campaign_title}\n")
            f.write(f"Total Acts: {total_acts}\n")
            f.write(f"Total Quests: {total_quests}\n")
            f.write(f"Total Monsters: {total_monsters}\n")
            f.write("\nMonsters by Quest:\n")

            for quest_name, monsters in monsters_by_quest.items():
                f.write(f"  {quest_name}: {len(monsters)} monster(s)\n")

            f.write("\n--- Full Monster Data ---\n")
            f.write(json.dumps(monsters_by_quest, indent=2, ensure_ascii=False))
            f.write("\n")

    def get_log_path(self) -> str:
        """Get the path to the current log file"""
        return str(self.log_file)
