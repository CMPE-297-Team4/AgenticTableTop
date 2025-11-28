import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import NotFound from '../NotFound';

describe('NotFound Page', () => {
  it('renders 404 page', () => {
    render(<NotFound />);
    
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });

  it('displays return to home link', () => {
    render(<NotFound />);
    
    expect(screen.getByText(/Return to Home/i)).toBeInTheDocument();
  });
});

