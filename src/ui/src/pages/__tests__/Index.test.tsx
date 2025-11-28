import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import Index from '../Index';
import * as campaignApi from '@/services/campaignApi';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the campaign API
vi.mock('@/services/campaignApi', () => ({
  generateCampaign: vi.fn(),
  loadCampaign: vi.fn(),
  listUserCampaigns: vi.fn(),
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

describe('Index Page (Campaign Creation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      logout: vi.fn(),
      loading: false,
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
    });
    (campaignApi.listUserCampaigns as any).mockResolvedValue([]);
  });

  it('renders the campaign creation page', () => {
    render(<Index />);
    
    expect(screen.getByText('Dungeons & Dragons AI')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered D&D Campaign Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate New')).toBeInTheDocument();
    expect(screen.getByText('Load Campaign')).toBeInTheDocument();
  });

  it('displays campaign template selector', () => {
    render(<Index />);
    
    const templateSelect = screen.getByText(/Choose a template or write your own/i);
    expect(templateSelect).toBeInTheDocument();
  });

  it('displays difficulty level selector', () => {
    render(<Index />);
    
    const difficultySelect = screen.getByText(/Difficulty Level/i);
    expect(difficultySelect).toBeInTheDocument();
  });

  it('displays campaign outline textarea', () => {
    render(<Index />);
    
    const outlineTextarea = screen.getByPlaceholderText(/Describe the type of D&D campaign/i);
    expect(outlineTextarea).toBeInTheDocument();
  });

  it('displays advanced settings toggle', () => {
    render(<Index />);
    
    const advancedSettings = screen.getByText(/Advanced Settings/i);
    expect(advancedSettings).toBeInTheDocument();
  });

  it('shows navigation buttons', () => {
    render(<Index />);
    
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('displays user information in nav bar', () => {
    render(<Index />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('shows generate campaign button', () => {
    render(<Index />);
    
    const generateButton = screen.getByRole('button', { name: /Generate Campaign/i });
    expect(generateButton).toBeInTheDocument();
  });

  it('displays campaign templates in dropdown', async () => {
    render(<Index />);
    
    const templateSelect = screen.getByText(/Choose a template or write your own/i);
    templateSelect.click();
    
    await waitFor(() => {
      expect(screen.getByText(/Dark Fantasy/i)).toBeInTheDocument();
      expect(screen.getByText(/High Fantasy/i)).toBeInTheDocument();
      expect(screen.getByText(/Comedy Adventure/i)).toBeInTheDocument();
    });
  });

  it('shows difficulty options with descriptions', async () => {
    render(<Index />);
    
    const difficultySelect = screen.getByText(/Difficulty Level/i).closest('div')?.querySelector('button');
    if (difficultySelect) {
      difficultySelect.click();
      
      await waitFor(() => {
        expect(screen.getByText(/Easy/i)).toBeInTheDocument();
        expect(screen.getByText(/Medium/i)).toBeInTheDocument();
        expect(screen.getByText(/Hard/i)).toBeInTheDocument();
        expect(screen.getByText(/Deadly/i)).toBeInTheDocument();
      });
    }
  });
});




