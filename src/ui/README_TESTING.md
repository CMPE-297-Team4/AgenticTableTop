# UI Testing Guide

This project uses **Vitest** and **React Testing Library** for UI testing.

## Setup

Install dependencies:
```bash
cd src/ui
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Test Structure

Tests are organized in `src/pages/__tests__/` and `src/components/__tests__/` directories.

### Test Files

- `Index.test.tsx` - Campaign creation page tests
- `GameLobby.test.tsx` - Game lobby page tests
- `CharacterCreate.test.tsx` - Character creation page tests
- `Login.test.tsx` - Login page tests
- `GameSession.test.tsx` - Game session page tests
- `CampaignLibrary.test.tsx` - Campaign library page tests
- Component tests in `components/__tests__/`

## Writing Tests

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test Utilities

Use the custom `render` function from `@/test/testUtils` which includes all necessary providers (Router, Auth, QueryClient, etc.).

### Mocking

- API calls are mocked using `vi.mock()`
- Auth context is mocked in each test file
- Navigation is mocked using `vi.mock('react-router-dom')`

## Test Coverage

The test suite covers:
- ✅ Page rendering
- ✅ Navigation elements
- ✅ Form inputs and validation
- ✅ User interactions
- ✅ Component display
- ✅ Authentication states
- ✅ API integration (mocked)

## Continuous Integration

Tests should pass before merging PRs. Run `npm test` locally before pushing.




