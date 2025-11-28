import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { AchievementBadge } from '../AchievementBadge';

describe('AchievementBadge Component', () => {
  it('renders achievement badge with label', () => {
    render(<AchievementBadge label="Level Up!" type="level" />);
    
    expect(screen.getByText('Level Up!')).toBeInTheDocument();
  });

  it('displays different badge types', () => {
    const { rerender } = render(<AchievementBadge label="Test" type="quest" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    
    rerender(<AchievementBadge label="Test" type="act" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    
    rerender(<AchievementBadge label="Test" type="achievement" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    
    rerender(<AchievementBadge label="Test" type="milestone" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('displays icon for badge type', () => {
    const { container } = render(<AchievementBadge label="Quest Complete" type="quest" />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

