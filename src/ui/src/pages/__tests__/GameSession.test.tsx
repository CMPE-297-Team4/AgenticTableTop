import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import GameSession from '../GameSession';
import * as campaignApi from '@/services/campaignApi';
import { useAuth } from '@/contexts/AuthContext';
import { mockCampaign, mockGameSession } from '@/test/mockData';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the campaign API
vi.mock('@/services/campaignApi', () => ({
  getSession: vi.fn(),
  getCampaign: vi.fn(),
  playerAction: vi.fn(),
  rollDice: vi.fn(),
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ sessionId: '1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('GameSession Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
    });
    (campaignApi.getSession as any).mockResolvedValue(mockGameSession);
    (campaignApi.getCampaign as any).mockResolvedValue(mockCampaign);
  });

  it('renders game session page', async () => {
    render(<GameSession />);
    
    await waitFor(() => {
      expect(screen.getByText(/Game Session/i)).toBeInTheDocument();
    });
  });

  it('displays campaign information', async () => {
    render(<GameSession />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });
  });

  it('shows action input form', async () => {
    render(<GameSession />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/What do you want to do/i)).toBeInTheDocument();
    });
  });

  it('displays submit action button', async () => {
    render(<GameSession />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Take Action/i })).toBeInTheDocument();
    });
  });
});




