/**
 * Campaign API Service
 * 
 * Handles all communication with the AgenticTableTop backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CampaignRequest {
  outline?: string;
  model_type?: 'openai' | 'gemini';
  save_to_pinecone?: boolean;
  user_id?: string;
  tags?: string[];
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

/**
 * Generate a complete D&D campaign with story, acts, and quests
 */
export async function generateCampaign(
  request: CampaignRequest = {}
): Promise<Campaign> {
  const response = await fetch(`${API_BASE_URL}/api/generate-campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to generate game plan: ${response.statusText}`);
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

