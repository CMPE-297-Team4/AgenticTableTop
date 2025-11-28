/**
 * Campaign API Service
 * 
 * Handles all communication with the Dungeons & Dragons AI backend API
 */

import { logger } from '@/utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Get headers with authentication if available
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export interface CampaignRequest {
  outline?: string;
  model_type?: 'openai' | 'gemini';
  save_to_pinecone?: boolean;
  user_id?: string;
  tags?: string[];
  force_new?: boolean;  // Force new generation, bypass cache
  // Advanced settings
  difficulty_level?: 'Easy' | 'Medium' | 'Hard' | 'Deadly';
  num_acts?: number;
  num_quests_per_act?: number;
  generate_monsters?: boolean;
  monsters_per_quest?: number;
}

export interface Quest {
  name: string;
  type: string;
  description: string;
  objectives: string[];
  difficulty?: string;
  estimated_time?: string;
  npcs?: string[];
  locations?: string[];
  rewards?: string;
  prerequisites?: string;
  outcomes?: string;
}

export interface Act {
  title: string;
  summary: string;
  goal: string;
  locations: string[];
  stakes: string;
  entry_condition?: string;
  exit_condition?: string;
  primary_conflict?: string;
  mechanics?: string[];
  handoff_notes?: string[];
}

export interface Campaign {
  id?: number;  // Database ID
  title: string;
  background: string;
  background_story?: string; // API returns this field
  theme: string;
  acts: Act[];
  quests: Record<string, Quest[]>;
  total_acts: number;
  total_quests: number;
}

export interface Story {
  title: string;
  background: string;
  theme: string;
}

export interface SearchRequest {
  query: string;
  user_id?: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  theme: string;
  created_at: string;
  score: number;
  tags: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface SaveCampaignRequest {
  campaign_data: Campaign;
  user_id?: string;
  tags?: string[];
}
export interface NPCImageRequest {
  npc_name: string;
  npc_description: string;
  quest_context?: string;
  campaign_id?: string;
}

export interface NPCImageResponse {
  npc_name: string;
  image_base64: string;
  prompt_used: string;
}

export interface UserRegister {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

export interface NPCImageListItem {
  id: number;
  npc_name: string;
  npc_description: string | null;
  quest_context: string | null;
  campaign_id: string | null;
  created_at: string | null;
  has_image: boolean;
}

export interface Monster {
  name: string;
  size: string;
  type: string;
  alignment: string;
  armor_class: number;
  hit_points: number;
  speed: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  challenge_rating: string;
  proficiency_bonus: number;
  saving_throws: string[];
  skills: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: string[];
  senses: string;
  languages: string;
  special_abilities: Array<{
    name: string;
    description: string;
  }>;
  actions: Array<{
    name: string;
    description: string;
    attack_bonus: number;
    damage: string;
    damage_type: string;
  }>;
  legendary_actions: any[];
  description: string;
  tactics: string;
  treasure: string;
  environment: string;
}

export interface MonsterGenerationRequest {
  quest_name: string;
  quest_description: string;
  quest_type: string;
  difficulty?: string;
  locations?: string[];
  objectives?: string[];
  quest_context?: string;
}

export interface MonsterResponse {
  quest_name: string;
  monsters: Monster[];
}

export interface CombatRequest {
  player_name: string;
  player_max_hp: number;
  player_armor_class: number;
  player_dexterity_modifier: number;
  monster_name: string;
  monster_data: Monster;
}

export interface CombatResponse {
  combat_log: string[];
  result: string;
  player_hp: number;
  monster_hp: number;
  round: number;
  current_turn: string;
}

/**
 * Generate a complete D&D campaign with story, acts, and quests
 */
export async function generateCampaign(
  request: CampaignRequest = {}
): Promise<Campaign> {
  const response = await fetch(`${API_BASE_URL}/api/generate-campaign`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate campaign: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Map API response fields to frontend interface
  return {
    ...data,
    background: data.background_story || data.background, // Use background_story if available
  };
}

/**
 * Save a campaign to Pinecone vector database
 */
export async function saveCampaign(
  request: SaveCampaignRequest
): Promise<{ success: boolean; campaign_id: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/save-campaign`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to save campaign: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search for campaigns using vector similarity
 */
export async function searchCampaigns(
  request: SearchRequest
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/search-campaigns`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to search campaigns: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search for quests using vector similarity
 */
export async function searchQuests(
  request: SearchRequest
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/search-quests`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to search quests: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a specific campaign by ID
 */
export async function getCampaign(campaignId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/campaign/${campaignId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get campaign: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/campaign/${campaignId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to delete campaign: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Generate only the background story (faster)
 */
export async function generateStory(
  request: CampaignRequest = {}
): Promise<Story> {
  const response = await fetch(`${API_BASE_URL}/api/generate-story`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate story: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate story and acts (medium speed, no quests)
 */
export async function generateGamePlan(
  request: CampaignRequest = {}
): Promise<Partial<Campaign>> {
  const response = await fetch(`${API_BASE_URL}/api/generate-game-plan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate game plan: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Register a new user
 */
export async function register(userData: UserRegister): Promise<UserInfo> {
  logger.info('Registering user', { 
    username: userData.username, 
    email: userData.email, 
    apiUrl: API_BASE_URL 
  });
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    logger.info('Registration response received', { 
      status: response.status, 
      statusText: response.statusText 
    });

    if (!response.ok) {
      let errorDetail = 'Unknown error';
      let errorData: any = null;
      try {
        errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.error('Registration error', { 
          status: response.status, 
          errorData 
        });
      } catch (parseError) {
        // If JSON parsing fails, use status text
        const text = await response.text();
        errorDetail = `HTTP ${response.status}: ${response.statusText}. Response: ${text}`;
        logger.error('Registration error (non-JSON)', { 
          status: response.status, 
          responseText: text 
        });
      }
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error(`Registration failed: Unauthorized (401). ${errorDetail}`);
      } else if (response.status === 400) {
        throw new Error(errorDetail);
      } else if (response.status === 409 || errorDetail.includes('already')) {
        throw new Error(errorDetail);
      } else {
        throw new Error(`Registration failed (${response.status}): ${errorDetail}`);
      }
    }

    const result = await response.json();
    logger.info('Registration successful', { 
      userId: result.id, 
      username: result.username 
    });
    return result;
  } catch (error) {
    logger.error('Registration exception', { 
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. ` +
        `Please make sure the backend is running. ` +
        `Check the console for more details.`
      );
    }
    throw error;
  }
}

/**
 * Login and get access token
 */
export async function login(credentials: UserLogin): Promise<Token> {
  logger.info('Logging in user', { 
    username: credentials.username, 
    apiUrl: API_BASE_URL 
  });
  
  try {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
    });

    logger.info('Login response received', { 
      status: response.status, 
      statusText: response.statusText 
    });

    if (!response.ok) {
      let errorDetail = 'Unknown error';
      let errorData: any = null;
      try {
        errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.error('Login error', { 
          status: response.status, 
          errorData 
        });
      } catch (parseError) {
        const text = await response.text();
        errorDetail = `HTTP ${response.status}: ${response.statusText}. Response: ${text}`;
        logger.error('Login error (non-JSON)', { 
          status: response.status, 
          responseText: text 
        });
      }
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error(`Login failed: Incorrect username or password (401). ${errorDetail}`);
      } else if (response.status === 403) {
        throw new Error('Login failed: Account is inactive. Please contact support.');
      } else {
        throw new Error(`Login failed (${response.status}): ${errorDetail}`);
      }
    }

    const token = await response.json();
    logger.info('Login successful, token received', { 
      userId: token.user_id, 
      username: token.username 
    });
    
    // Store token in localStorage
    localStorage.setItem('auth_token', token.access_token);
    localStorage.setItem('user_id', token.user_id.toString());
    localStorage.setItem('username', token.username);
    
    return token;
  } catch (error) {
    logger.error('Login exception', { 
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. ` +
        `Please make sure the backend is running. ` +
        `Check the console for more details.`
      );
    }
    throw error;
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<UserInfo> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get user info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Logout (clear stored token)
 */
export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
}

/**
 * Generate or retrieve NPC image
 * Checks database first, then generates if not found
 */
export async function generateNPCImage(
  npcName: string,
  npcDescription: string,
  questContext?: string,
  campaignId?: string
): Promise<NPCImageResponse> {
  const request: NPCImageRequest = {
    npc_name: npcName,
    npc_description: npcDescription,
    quest_context: questContext,
    campaign_id: campaignId,
  };

  const response = await fetch(`${API_BASE_URL}/api/generate-npc-image`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate NPC image: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific NPC image by name
 */
export async function getNPCImage(
  npcName: string,
  campaignId?: string
): Promise<NPCImageResponse> {
  const params = new URLSearchParams();
  if (campaignId) {
    params.append('campaign_id', campaignId);
  }

  const url = `${API_BASE_URL}/api/npc-images/${encodeURIComponent(npcName)}${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get NPC image: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Monster Image interfaces and functions
 */
export interface MonsterImageRequest {
  monster_name: string;
  monster_type?: string;
  monster_description?: string;
  quest_context?: string;
  campaign_id?: string;
}

export interface MonsterImageResponse {
  monster_name: string;
  image_base64: string;
  prompt_used: string;
}

/**
 * Generate or retrieve Monster image
 * Checks database first, then generates if not found
 */
export async function generateMonsterImage(
  monsterName: string,
  monsterType?: string,
  monsterDescription?: string,
  questContext?: string,
  campaignId?: string
): Promise<MonsterImageResponse> {
  const request: MonsterImageRequest = {
    monster_name: monsterName,
    monster_type: monsterType,
    monster_description: monsterDescription,
    quest_context: questContext,
    campaign_id: campaignId,
  };

  const response = await fetch(`${API_BASE_URL}/api/generate-monster-image`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate Monster image: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific Monster image by name
 */
export async function getMonsterImage(
  monsterName: string,
  campaignId?: string
): Promise<MonsterImageResponse> {
  const params = new URLSearchParams();
  if (campaignId) {
    params.append('campaign_id', campaignId);
  }

  const url = `${API_BASE_URL}/api/monster-images/${encodeURIComponent(monsterName)}${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get Monster image: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all NPC images
 */
export async function listNPCImages(
  campaignId?: string,
  npcName?: string
): Promise<NPCImageListItem[]> {
  const params = new URLSearchParams();
  if (campaignId) {
    params.append('campaign_id', campaignId);
  }
  if (npcName) {
    params.append('npc_name', npcName);
  }

  const url = `${API_BASE_URL}/api/npc-images${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to list NPC images: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete an NPC image
 */
export async function deleteNPCImage(imageId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/npc-images/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to delete NPC image: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all campaigns for the current user
 */
export async function listUserCampaigns(): Promise<Array<{
  id: number;
  title: string;
  theme: string;
  background: string;
  created_at: string | null;
  updated_at: string | null;
}>> {
  const response = await fetch(`${API_BASE_URL}/api/user/campaigns`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to list campaigns: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Load a specific campaign by ID
 */
export async function loadCampaign(campaignId: number): Promise<Campaign> {
  const response = await fetch(`${API_BASE_URL}/api/user/campaigns/${campaignId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to load campaign: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Health check for the API
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('API is not available');
  }
  
  return response.json();
}

/**
 * Generate monsters for a combat quest
 */
export async function generateMonsters(
  request: MonsterGenerationRequest
): Promise<MonsterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-monsters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate monsters: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Simulate combat between a player and monster
 */
export async function simulateCombat(
  request: CombatRequest
): Promise<CombatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/simulate-combat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to simulate combat: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a formatted stat block for a monster
 */
export async function getMonsterStatBlock(
  monsterName: string,
  monsterData: Monster
): Promise<{ monster_name: string; stat_block: string }> {
  const response = await fetch(`${API_BASE_URL}/api/monster-stat-block/${encodeURIComponent(monsterName)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(monsterData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to get stat block: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Player Character API
// ============================================================================

export interface PlayerCharacterCreateRequest {
  character_name: string;
  class_and_level: string;
  race: string;
  background: string;
  alignment: string;
  player_name?: string;
  campaign_id?: number;
}

export interface PlayerCharacter {
  id: number;
  character_name: string;
  player_name: string;
  class_and_level: string;
  race: string;
  background: string;
  alignment: string;
  character_data: any; // Full D&D 5e character sheet
  image_base64?: string;
  image_path?: string;
  portrait_prompt?: string;
  created_at: string;
  updated_at: string;
}

export async function createCharacter(
  request: PlayerCharacterCreateRequest
): Promise<PlayerCharacter> {
  const response = await fetch(`${API_BASE_URL}/api/characters/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create character' }));
    throw new Error(error.detail || 'Failed to create character');
  }

  return response.json();
}

export async function listCharacters(): Promise<PlayerCharacter[]> {
  const response = await fetch(`${API_BASE_URL}/api/characters`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to list characters');
  }

  return response.json();
}

export async function getCharacter(characterId: number): Promise<PlayerCharacter> {
  const response = await fetch(`${API_BASE_URL}/api/characters/${characterId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get character');
  }

  return response.json();
}

export async function updateCharacter(
  characterId: number,
  updates: { character_data?: any; current_hit_points?: number; experience_points?: number }
): Promise<PlayerCharacter> {
  const response = await fetch(`${API_BASE_URL}/api/characters/${characterId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update character');
  }

  return response.json();
}

export async function deleteCharacter(characterId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/characters/${characterId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete character');
  }
}

export async function regeneratePortrait(characterId: number): Promise<PlayerCharacter> {
  const response = await fetch(`${API_BASE_URL}/api/characters/${characterId}/portrait`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to regenerate portrait');
  }

  return response.json();
}

// ============================================================================
// Game Session API
// ============================================================================

export interface GameSession {
  id: number;
  session_name: string;
  campaign_id: number;
  invite_code?: string;
  current_act_index: number;
  current_quest_index: number;
  is_active: boolean;
  state?: any;
  created_at: string;
  last_played_at?: string;
}

export interface CreateSessionRequest {
  campaign_id: number;
  session_name: string;
  character_ids: number[];
}

export interface PlayerActionRequest {
  action_type: string;
  character_name: string;
  description: string;
  target?: string;
  parameters?: any;
}


export async function createSession(request: CreateSessionRequest): Promise<GameSession> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create session';
    try {
      const error = await response.json();
      // Handle FastAPI validation errors
      if (Array.isArray(error.detail)) {
        errorMessage = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } catch (e) {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || 'Failed to create session';
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function listSessions(): Promise<GameSession[]> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to list sessions');
  }

  return response.json();
}

export async function getSession(sessionId: number): Promise<GameSession> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get session');
  }

  return response.json();
}

export async function startSession(sessionId: number): Promise<{ 
  session_id: number; 
  session_name: string; 
  campaign: Campaign; 
  state: any;
  initial_narration?: {
    narration: string;
    audio_data?: string;
    audio_format?: string;
  };
}> {
  logger.info('Starting game session', { sessionId, apiUrl: `${API_BASE_URL}/api/sessions/${sessionId}/start` });
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to start session', { 
        status: response.status, 
        statusText: response.statusText,
        errorText 
      });
      
      if (response.status === 404) {
        throw new Error(`Session ${sessionId} not found. It may have been deleted.`);
      } else if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}). The backend server may be having issues.`);
      } else {
        throw new Error(`Failed to start session: ${errorText || response.statusText}`);
      }
    }

    const data = await response.json();
    logger.info('Session started successfully', { sessionId });
    return data;
  } catch (error) {
    logger.error('Start session exception', { 
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      sessionId
    });
    
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. ` +
        `Please make sure the backend is running by running: make start-backend`
      );
    }
    throw error;
  }
}

export async function saveSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to save session');
  }
}

export interface PlayerActionResponse {
  result: string;
  dm_narration: string;
  state_update: any;
  audio_data?: string;
  audio_format?: string;
}

export async function playerAction(
  sessionId: number,
  action: PlayerActionRequest
): Promise<PlayerActionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/action`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to process action' }));
    throw new Error(error.detail || 'Failed to process action');
  }

  return response.json();
}

export async function deleteSession(sessionId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
}

/**
 * Get session details by invite code
 */
export async function getSessionByInvite(inviteCode: string): Promise<GameSession & { campaign_title?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/invite/${inviteCode}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get session by invite code' }));
    throw new Error(error.detail || 'Failed to get session by invite code');
  }

  return response.json();
}

/**
 * Join a session using an invite code
 */
export async function joinSessionByInvite(inviteCode: string, characterId: number): Promise<{ message: string; session_id: number; session_name: string }> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/invite/${inviteCode}/join?character_id=${characterId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to join session' }));
    throw new Error(error.detail || 'Failed to join session');
  }

  return response.json();
}

// ============================================================================
// Dungeon Master API
// ============================================================================

export interface SceneNarration {
  narration: string;
  environmental_details?: string[];
  mood?: string;
  audio_data?: string;
  audio_format?: string;
}

export async function narrateScene(
  sessionId: number,
  forceRegenerate: boolean = false,
  location?: string
): Promise<SceneNarration> {
  const response = await fetch(`${API_BASE_URL}/api/dm/narrate-scene`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ session_id: sessionId, location, force_regenerate: forceRegenerate }),
  });

  if (!response.ok) {
    throw new Error('Failed to get scene narration');
  }

  return response.json();
}

export async function getSceneNarrationAudio(
  sessionId: number,
  location?: string
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/dm/narrate-scene/audio`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ session_id: sessionId, location }),
  });

  if (!response.ok) {
    throw new Error('Failed to get audio narration');
  }

  return response.blob();
}
