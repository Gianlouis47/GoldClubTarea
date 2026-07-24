# GoldClubTarea — Project Context for Claude Code

## Project Overview
**GoldClubTarea** — React 18 + Vite + Supabase inventory management for bar/liquor store.
Fork: Gianlouis47/GoldClubTarea ← nathalyyv/GoldClubTarea (upstream)

## Tech Stack
- **Frontend**: React 18.3, React Router DOM 6.26, Vite 5.4, Bootstrap 5.3
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Language**: TypeScript (ESM modules)
- **Package Manager**: npm

## Key Commands
- `npm run dev` — Start dev server (port 5173)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build

## Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components (routes)
├── services/       # Supabase client, API calls
├── hooks/          # Custom React hooks
├── context/        # React Context providers
├── utils/          # Helper functions
└── assets/         # Static assets
```

## Database Schema (Supabase)
**Core tables (from upstream):**
- `productos` — inventory items
- `categorias` — product categories
- `proveedores` — suppliers
- `movimientos` — stock movements

**Additional tables (local fork - NOT in upstream schema.sql):**
- `nota_despacho` — dispatch notes
- `reporte_incidentes` — incident reports
- `orden_preparacion` — preparation orders
- `informe_baja` — write-off reports

## Known Issues to Fix
1. `supabase.raw()` doesn't exist in SDK v2 — use `.rpc()` or direct queries
2. Column `estado TEXT` doesn't exist — schema uses `activo BOOLEAN`
3. Missing 4 extra tables in schema.sql

## Development Workflow
1. Make changes in fork (Gianlouis47/GoldClubTarea)
2. Test locally with `npm run dev`
3. Push to fork
4. Create PR to upstream (nathalyyv/GoldClubTarea)

## Code Style
- TypeScript strict mode
- Functional components + hooks
- Supabase client in `src/services/supabase.ts`
- No direct SQL in components — use service layer

## MCP Servers Available
- **context7** — Library/framework docs lookup
- **github** — GitHub API (issues, PRs, repos)
- **filesystem** — Full read/write access to /c/Users/User

## Sub-agents to Use
- `@security-reviewer` — Audit Supabase RLS policies, auth
- `@code-simplifier` — Clean up React components
- `@pr-test-analyzer` — Review test coverage
- `@type-design-analyzer` — TypeScript types audit