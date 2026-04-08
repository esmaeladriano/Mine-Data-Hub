# MineOS Africa

## Overview

A full-stack digital platform for mining monitoring and management in Africa. Built for mining engineers, topographers, geologists, and managers to centralize geospatial data, track production, monitor safety alerts, and visualize mine operations.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/mineos-africa)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion

## Features

- **Dashboard (Control Room)**: Production chart, active alerts, activity feed, key metrics
- **Mine Map**: Interactive Leaflet map showing all mine project locations and alert positions
- **Projects**: Manage mine projects (open pit, underground, quarry, alluvial) with status tracking
- **Project Detail**: Per-project overview with surveys, volumes, alerts, and production tabs + mini-map
- **Surveys**: Register topographic surveys (DWG, DXF, SHP, CSV, Orthomosaic, Point Cloud, DEM, GeoTIFF)
- **Volume Calculations**: Track excavated/fill/net volumes between two survey periods
- **Production**: Daily production records with material tracking and bar chart
- **Safety Alerts**: Geotechnical alerts with severity (critical/high/medium/low), resolve/dismiss actions
- **Users**: Multi-role team management (Admin, Engineer, Topographer, Geologist, Manager)

## User Roles

- Admin — full system control
- Engineer — mine analysis and volume planning
- Topographer — survey upload and terrain updates
- Geologist — geological data and drilling analysis
- Manager — reports and production monitoring

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

- `artifacts/mineos-africa/` — React + Vite frontend (served at `/`)
- `artifacts/api-server/` — Express REST API (served at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle DB schemas (projects, surveys, volumes, alerts, users, production, activity)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
