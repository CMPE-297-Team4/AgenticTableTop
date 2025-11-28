import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import GameLobby from '../GameLobby';
import * as campaignApi from '@/services/campaignApi';
import { useAuth } from '@/contexts/AuthContext';
import { mockCampaigns, mockSessions, mockCharacters } from '@/test/mockData';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the campaign API
vi.mock('@/services/campaignApi', () => ({
  listSessions: vi.fn(),
  listUserCampaigns: vi.fn(),
  listCharacters: vi.fn(),
  createSession: vi.fn(),
  getSessionByInvite: vi.fn(),
  joinSessionByInvite: vi.fn(),
  generateCampaign: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GameLobby Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
    });
    (campaignApi.listSessions as any).mockResolvedValue(mockSessions);
    (campaignApi.listUserCampaigns as any).mockResolvedValue(mockCampaigns);
    (campaignApi.listCharacters as any).mockResolvedValue(mockCharacters);
  });

  it('renders the game lobby page when authenticated', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      expect(screen.getByText('Dungeons & Dragons AI')).toBeInTheDocument();
      expect(screen.getByText('Game Lobby')).toBeInTheDocument();
    });
  });

  it('displays user profile dropdown', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      const profileButton = screen.getByText('testuser');
      expect(profileButton).toBeInTheDocument();
    });
  });

  it('shows navigation tabs', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      expect(screen.getByText(/My Sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/Create Session/i)).toBeInTheDocument();
      expect(screen.getByText(/Join by Invite/i)).toBeInTheDocument();
    });
  });

  it('displays back to campaigns button', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      expect(screen.getByText(/Back to Campaigns/i)).toBeInTheDocument();
    });
  });

  it('shows logout option in profile dropdown', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      const profileButton = screen.getByText('testuser');
      profileButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });
  });

  it('displays campaign creation form when creating new campaign', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      const createTab = screen.getByText(/Create Session/i);
      createTab.click();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Create New Game Session/i)).toBeInTheDocument();
    });
  });

  it('shows invite code input in invite tab', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      const inviteTab = screen.getByText(/Join by Invite/i);
      inviteTab.click();
    });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter invite code/i)).toBeInTheDocument();
    });
  });

  it('displays user sessions when available', async () => {
    render(<GameLobby />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Session')).toBeInTheDocument();
    });
  });
});

describe('GameLobby - Unauthenticated State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
    });
  });

  it('shows login/register form when not authenticated', () => {
    render(<GameLobby />);
    
    expect(screen.getByText('Dungeons & Dragons AI')).toBeInTheDocument();
    expect(screen.getByText(/Enter the Realm of Adventure/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it('displays login form fields', () => {
    render(<GameLobby />);
    
    expect(screen.getByPlaceholderText(/Enter your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
  });

  it('shows register form when register tab is selected', () => {
    render(<GameLobby />);
    
    const registerTab = screen.getByText(/Register/i);
    registerTab.click();
    
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
  });
});




