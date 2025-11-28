import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import Login from '../Login';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
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

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      loading: false,
    });
  });

  it('renders login page', () => {
    render(<Login />);
    
    expect(screen.getByText('Dungeons & Dragons AI')).toBeInTheDocument();
    expect(screen.getByText(/Enter the Realm of Adventure/i)).toBeInTheDocument();
  });

  it('displays login form', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText(/Enter your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows register option', () => {
    render(<Login />);
    
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it('displays fantasy background elements', () => {
    const { container } = render(<Login />);
    
    // Check for fantasy-bg class
    const mainDiv = container.querySelector('.fantasy-bg');
    expect(mainDiv).toBeInTheDocument();
  });
});




