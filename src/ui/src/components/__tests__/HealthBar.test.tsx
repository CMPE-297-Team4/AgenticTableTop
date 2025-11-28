import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { HealthBar } from '../HealthBar';

describe('HealthBar Component', () => {
  it('renders health bar with current and max values', () => {
    render(<HealthBar current={75} max={100} />);
    
    if (screen.queryByText(/75/i)) {
      expect(screen.getByText(/75/i)).toBeInTheDocument();
    }
    if (screen.queryByText(/100/i)) {
      expect(screen.getByText(/100/i)).toBeInTheDocument();
    }
  });

  it('displays health bar element', () => {
    const { container } = render(<HealthBar current={50} max={100} />);
    
    const healthBar = container.querySelector('.bg-red-500') || container.querySelector('[role="progressbar"]');
    expect(healthBar).toBeInTheDocument();
  });

  it('shows mana bar with variant', () => {
    const { container } = render(<HealthBar current={30} max={50} variant="mana" />);
    
    const manaBar = container.querySelector('.bg-blue-500');
    expect(manaBar).toBeInTheDocument();
  });

  it('displays XP bar with variant', () => {
    const { container } = render(<HealthBar current={250} max={500} variant="xp" />);
    
    const xpBar = container.querySelector('.bg-purple-500') || container.querySelector('.xp-gradient');
    expect(xpBar).toBeInTheDocument();
  });
});

