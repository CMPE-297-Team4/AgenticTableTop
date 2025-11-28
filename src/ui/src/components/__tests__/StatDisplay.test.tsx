import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { StatDisplay } from '../StatDisplay';

describe('StatDisplay Component', () => {
  it('renders stat with label and value', () => {
    render(<StatDisplay label="Strength" value={16} />);
    
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('displays modifier when value is provided', () => {
    render(<StatDisplay label="Dexterity" value={18} />);
    
    // Modifier for 18 should be +4
    expect(screen.getByText(/\+4/i)).toBeInTheDocument();
  });

  it('displays highlighted stat when highlight prop is true', () => {
    const { container } = render(<StatDisplay label="Constitution" value={16} highlight />);
    
    const statElement = container.querySelector('.border-primary');
    expect(statElement).toBeInTheDocument();
  });
});

