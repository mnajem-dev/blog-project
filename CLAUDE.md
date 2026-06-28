# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack blog admin app with a React frontend (Vite) and an Express/SQLite backend. The two are developed and run independently.

## Development Commands

### Backend (`backend/`)
```bash
npm run dev    # Start with nodemon (auto-reload)
npm start      # Start without auto-reload
```
Runs on `http://localhost:4000`.

### Frontend (`frontend/`)
```bash
npm run dev    # Start Vite dev server
npm run build  # Production build
npm run preview # Preview production build
```
Runs on `http://localhost:5173`.

Both must be running simultaneously during development. There are no tests defined.

## Architecture

### Backend
- **`server.js`** — Express entry point. CORS is locked to `http://localhost:5173`. Mounts `/api/posts` router and a `/health` endpoint.
- **`database.js`** — Lazy singleton that opens (or creates) `backend/blog.db` on first call and runs the schema migration. The SQLite file is created at runtime and is not committed.
- **`routes/posts.js`** — REST handlers for posts: `GET /api/posts` (filterable by `status` and `category` query params), `GET /api/posts/:id`, `POST /api/posts`.

### Frontend
- **`vite.config.js`** — Proxies all `/api` requests to `http://localhost:4000`, so the frontend uses relative `/api/posts` paths and needs no hardcoded backend URL.
- **`src/api/posts.js`** — Thin fetch wrapper; the single source of truth for all backend calls.
- **`src/App.jsx`** — React Router setup with three routes: `/` (PostList), `/posts/:id` (PostDetail), `/create` (CreatePost).
- Pages live in `src/pages/`, each paired with a CSS Module (`.module.css`).

### Data Model
Posts table columns: `id`, `title`, `content`, `author`, `category` (default `'General'`), `status` (`'draft'` | `'published'`, enforced by a CHECK constraint), `created_at`.
