import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import CampaignLibrary from '../CampaignLibrary';
import * as campaignApi from '@/services/campaignApi';
import { useAuth } from '@/contexts/AuthContext';
import { mockCampaigns } from '@/test/mockData';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the campaign API
vi.mock('@/services/campaignApi', () => ({
  listUserCampaigns: vi.fn(),
  deleteCampaign: vi.fn(),
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

describe('CampaignLibrary Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
    });
    (campaignApi.listUserCampaigns as any).mockResolvedValue(mockCampaigns);
  });

  it('renders campaign library page', async () => {
    render(<CampaignLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText(/Campaign Library/i)).toBeInTheDocument();
    });
  });

  it('displays user campaigns', async () => {
    render(<CampaignLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      expect(screen.getByText('Campaign 2')).toBeInTheDocument();
    });
  });

  it('shows campaign details', async () => {
    render(<CampaignLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
      expect(screen.getByText('Horror')).toBeInTheDocument();
    });
  });
});




