import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { QuestProgress } from '../QuestProgress';

describe('QuestProgress Component', () => {
  const mockObjectives = [
    'Find the ancient artifact',
    'Defeat the dragon',
    'Return to the village',
  ];

  const mockCompletedObjectives = ['Find the ancient artifact'];

  it('renders quest objectives', () => {
    render(<QuestProgress objectives={mockObjectives} completedObjectives={mockCompletedObjectives} />);
    
    expect(screen.getByText('Find the ancient artifact')).toBeInTheDocument();
    expect(screen.getByText('Defeat the dragon')).toBeInTheDocument();
    expect(screen.getByText('Return to the village')).toBeInTheDocument();
  });

  it('shows progress information', () => {
    render(<QuestProgress objectives={mockObjectives} completedObjectives={mockCompletedObjectives} />);
    
    // Check that progress is displayed (format may vary)
    const progressElement = screen.getByText(/1\/3/i) || screen.getByText(/33%/i);
    expect(progressElement).toBeInTheDocument();
  });

  it('displays all objectives', () => {
    render(<QuestProgress objectives={mockObjectives} completedObjectives={[]} />);
    
    mockObjectives.forEach((objective) => {
      expect(screen.getByText(objective)).toBeInTheDocument();
    });
  });
});

