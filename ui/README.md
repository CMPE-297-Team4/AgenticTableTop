# AgenticTableTop - Frontend

React + TypeScript UI for the D&D campaign generator.

## Quick Start

**From project root:**
```bash
make start-all
```

**Or run frontend only:**
```bash
cd ui && npm run dev
```

Then open http://localhost:5173

## Structure

```
ui/src/
├── pages/
│   ├── Index.tsx        # Campaign generator
│   ├── Game.tsx         # Campaign viewer
│   └── NotFound.tsx     # 404 page
├── services/
│   └── campaignApi.ts   # Backend API client
└── components/ui/       # Shadcn UI components
```

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn UI
- React Router + TanStack Query

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Lint code
```

## Configuration

Optional: Create `ui/.env` to customize API URL:
```env
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

**Cannot connect to backend**
- Make sure backend is running: `make api` from project root

**Campaign not loading**
- Generate a new campaign from the Index page
- Check browser console (F12) for errors

See main [README.md](../README.md) for full documentation.
