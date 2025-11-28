import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import CharacterCreate from '../CharacterCreate';
import * as campaignApi from '@/services/campaignApi';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the campaign API
vi.mock('@/services/campaignApi', () => ({
  createCharacter: vi.fn(),
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

describe('CharacterCreate Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
    });
  });

  it('renders character creation form', () => {
    render(<CharacterCreate />);
    
    expect(screen.getByText(/Create D&D Character/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Character Name/i)).toBeInTheDocument();
  });

  it('displays all required character fields', () => {
    render(<CharacterCreate />);
    
    expect(screen.getByLabelText(/Character Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Race/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Class and Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Background/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alignment/i)).toBeInTheDocument();
  });

  it('shows player name as read-only', () => {
    render(<CharacterCreate />);
    
    const playerNameField = screen.getByText('testuser');
    expect(playerNameField).toBeInTheDocument();
  });

  it('displays ability score inputs', () => {
    render(<CharacterCreate />);
    
    expect(screen.getByLabelText(/Strength/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dexterity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Constitution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Intelligence/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Wisdom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Charisma/i)).toBeInTheDocument();
  });

  it('shows create character button', () => {
    render(<CharacterCreate />);
    
    const createButton = screen.getByRole('button', { name: /Create Character/i });
    expect(createButton).toBeInTheDocument();
  });

  it('displays back button', () => {
    render(<CharacterCreate />);
    
    const backButton = screen.getByText(/Back/i);
    expect(backButton).toBeInTheDocument();
  });

  it('shows race dropdown options', async () => {
    render(<CharacterCreate />);
    
    const raceSelect = screen.getByLabelText(/Race/i);
    raceSelect.click();
    
    await waitFor(() => {
      expect(screen.getByText(/Human/i)).toBeInTheDocument();
      expect(screen.getByText(/Elf/i)).toBeInTheDocument();
      expect(screen.getByText(/Dwarf/i)).toBeInTheDocument();
    });
  });

  it('shows alignment options', async () => {
    render(<CharacterCreate />);
    
    const alignmentSelect = screen.getByLabelText(/Alignment/i);
    alignmentSelect.click();
    
    await waitFor(() => {
      expect(screen.getByText(/Lawful Good/i)).toBeInTheDocument();
      expect(screen.getByText(/Chaotic Evil/i)).toBeInTheDocument();
    });
  });
});




