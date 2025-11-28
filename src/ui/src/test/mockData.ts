import type { Campaign, GameSession, PlayerCharacter } from '@/services/campaignApi';

export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

export const mockCampaign: Campaign = {
  id: 1,
  title: 'Test Campaign',
  background: 'A test campaign background story',
  theme: 'Fantasy',
  acts: [
    {
      title: 'Act 1: The Beginning',
      summary: 'The adventure begins',
      goal: 'Start the journey',
      stakes: 'High stakes',
      locations: ['Town', 'Forest'],
      entry_condition: 'None',
      exit_condition: 'Complete first quest',
      primary_conflict: 'Evil forces',
      mechanics: ['Combat', 'Exploration'],
      handoff_notes: ['Note 1'],
    },
  ],
  quests: {
    'Act 1: The Beginning': [
      {
        name: 'First Quest',
        type: 'Combat',
        description: 'Fight the monsters',
        objectives: ['Kill 5 goblins', 'Rescue the prisoner'],
        difficulty: 'Medium',
        estimated_time: '2 hours',
        npcs: ['NPC1'],
        locations: ['Dungeon'],
        rewards: 'Gold and XP',
        prerequisites: 'None',
        outcomes: 'Victory',
      },
    ],
  },
  total_acts: 1,
  total_quests: 1,
};

export const mockGameSession: GameSession = {
  id: 1,
  session_name: 'Test Session',
  campaign_id: 1,
  invite_code: 'ABC12345',
  current_act_index: 0,
  current_quest_index: 0,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  last_played_at: '2024-01-01T00:00:00Z',
};

export const mockCharacter: PlayerCharacter = {
  id: 1,
  character_name: 'Test Character',
  player_name: 'testuser',
  race: 'Human',
  class_and_level: 'Fighter 1',
  background: 'Soldier',
  alignment: 'Lawful Good',
  strength: 16,
  dexterity: 14,
  constitution: 15,
  intelligence: 12,
  wisdom: 13,
  charisma: 10,
  hit_points: 12,
  armor_class: 16,
  speed: 30,
  skills: [],
  equipment: [],
  spells: [],
  image_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockCampaigns = [
  {
    id: 1,
    title: 'Campaign 1',
    theme: 'Fantasy',
    background: 'Background 1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Campaign 2',
    theme: 'Horror',
    background: 'Background 2',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

export const mockSessions: GameSession[] = [
  mockGameSession,
  {
    ...mockGameSession,
    id: 2,
    session_name: 'Session 2',
    invite_code: 'XYZ98765',
  },
];

export const mockCharacters: PlayerCharacter[] = [
  mockCharacter,
  {
    ...mockCharacter,
    id: 2,
    character_name: 'Character 2',
    race: 'Elf',
  },
];




