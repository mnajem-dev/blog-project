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

Optional environment variables for the backend:

| Variable         | Default    | Purpose                          |
|------------------|------------|-----------------------------------|
| `JWT_SECRET`     | `dev-secret-change-me` | Secret used to sign auth tokens |
| `ADMIN_USERNAME` | `admin`    | Username seeded on first run      |
| `ADMIN_PASSWORD` | `admin123` | Password seeded on first run      |

## Architecture

### Backend
- **`server.js`** — Express entry point. CORS is locked to `http://localhost:5173`. Serves uploaded images from `/uploads`. Mounts `/api/auth` and `/api/posts` routers and a `/health` endpoint.
- **`database.js`** — Lazy singleton that opens (or creates) `backend/blog.db` on first call, runs idempotent schema migrations (tags, published_at, updated_at, slug, excerpt, featured_image columns), and seeds a default admin user into `users` on first run. The SQLite file is created at runtime and is not committed.
- **`middleware/auth.js`** — `requireAuth` verifies a `Bearer` JWT (see `JWT_SECRET`) and attaches `req.user`; used to protect write endpoints.
- **`routes/auth.js`** — `POST /api/auth/login` (bcrypt password check, returns a JWT), `GET /api/auth/me`.
- **`routes/posts.js`** — REST handlers for posts:
  - `GET /api/posts` — filterable by `status`, `category`, `search`; supports `sortBy`/`sortOrder` and `page`/`limit` pagination
  - `GET /api/posts/:identifier` — by numeric `id` or `slug`
  - `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id` (auth required)
  - `POST /api/posts/:id/image`, `DELETE /api/posts/:id/image` — featured image upload/removal via multer, 5MB max, jpeg/png/webp/gif (auth required)
  - `POST /api/posts/bulk` — bulk `publish`/`delete` actions on an array of ids (auth required)
  - Slugs are auto-generated from title (or a provided slug) and de-duplicated via `uniqueSlug`.

### Frontend
- **`vite.config.js`** — Proxies all `/api` requests to `http://localhost:4000`, so the frontend uses relative `/api/posts` paths and needs no hardcoded backend URL.
- **`src/api/`** — Thin fetch wrappers (`posts.js`, `auth.js`); the single source of truth for all backend calls.
- **`src/context/AuthContext.jsx`** — Holds auth state (token/user) from login.
- **`src/components/ProtectedRoute.jsx`** — Redirects to `/login` when unauthenticated; wraps create/edit routes.
- **`src/App.jsx`** — React Router setup: `/` (PostList), `/posts/:slug` (PostDetail), `/login` (Login), `/create` and `/posts/:slug/edit` (protected, CreatePost/EditPost).
- **`src/components/MarkdownToolbar.jsx`** + **`src/utils/markdown.js`** — Markdown formatting toolbar and rendering (via `marked` + `dompurify`) used by the post editor.
- **`src/components/FeaturedImageField.jsx`** — Upload/remove UI for a post's featured image.
- **`src/components/TagInput.jsx`** — Tag entry for posts.
- Pages live in `src/pages/`, reusable pieces in `src/components/`, each paired with a CSS Module (`.module.css`).

### Data Model
**`posts`**: `id`, `title`, `content`, `author`, `category` (default `'General'`), `status` (`'draft'` | `'published'`, CHECK constraint), `tags`, `excerpt`, `slug` (unique, derived from title), `featured_image` (relative `/uploads` URL), `created_at`, `updated_at`, `published_at`.

**`users`**: `id`, `username` (unique), `password_hash` (bcrypt), `created_at`. Seeded with one admin user on first run.
