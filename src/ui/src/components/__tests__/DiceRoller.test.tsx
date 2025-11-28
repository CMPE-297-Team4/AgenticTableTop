import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import { DiceRoller } from '../DiceRoller';

describe('DiceRoller Component', () => {
  it('renders dice roller component', () => {
    render(<DiceRoller result={15} />);
    
    // Wait for the result to display after animation
    waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('displays dice icon', () => {
    const { container } = render(<DiceRoller result={20} />);
    
    // Check for dice icon (lucide-react D20)
    const diceIcon = container.querySelector('svg');
    expect(diceIcon).toBeInTheDocument();
  });

  it('shows result when provided', async () => {
    render(<DiceRoller result={20} rolling={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });
});

