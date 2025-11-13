/**
 * Campaign API Service
 * 
 * Handles all communication with the AgenticTableTop backend API
 */

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
function getAuthHeaders(): HeadersInit {
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
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Failed to register: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Failed to login: ${response.statusText}`);
    }

    const token = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('auth_token', token.access_token);
    localStorage.setItem('user_id', token.user_id.toString());
    localStorage.setItem('username', token.username);
    
    return token;
  } catch (error) {
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

