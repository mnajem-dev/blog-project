# Blog Admin

A full-stack blog admin app with a React (Vite) frontend and an Express/SQLite backend. The two are developed and run independently.

## Features

- Post list with search, filtering (status/category), sortable columns, and pagination
- Create/edit posts with a Markdown editor (formatting toolbar + rendered preview), tags, excerpt, and slugs
- Featured image upload per post
- Bulk publish/delete actions from the post list
- JWT-based login; only authenticated users can create, edit, delete, or upload images for posts

## Prerequisites

- Node.js and npm

## Getting Started

### Backend (`backend/`)

```bash
cd backend
npm install
npm run dev    # start with nodemon (auto-reload)
# or: npm start
```

Runs on `http://localhost:4000`. On first run it creates `backend/blog.db` (SQLite, not committed) and seeds a default admin user.

Optional environment variables:

| Variable         | Default    | Purpose                          |
|------------------|------------|-----------------------------------|
| `ADMIN_USERNAME` | `admin`    | Username seeded on first run      |
| `ADMIN_PASSWORD` | `admin123` | Password seeded on first run      |

### Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev    # start Vite dev server
```

Runs on `http://localhost:5173` and proxies `/api` requests to the backend, so no backend URL needs to be configured.

Both servers must be running simultaneously during development. There are no automated tests defined.

## Architecture

### Backend

- **`server.js`** — Express entry point. CORS is locked to `http://localhost:5173`. Mounts `/api/posts` and `/api/auth` routers, serves uploaded images from `/uploads`, and exposes a `/health` endpoint.
- **`database.js`** — Lazy singleton that opens (or creates) `backend/blog.db` on first call, runs schema migrations, and seeds the default admin user.
- **`middleware/auth.js`** — JWT verification (`requireAuth`) used to protect write endpoints.
- **`routes/auth.js`** — `POST /api/auth/login`, `GET /api/auth/me`.
- **`routes/posts.js`** — REST handlers for posts:
  - `GET /api/posts` — filterable by `status`, `category`, `search`; supports `sortBy`/`sortOrder` and `page`/`limit` pagination
  - `GET /api/posts/:identifier` — by numeric `id` or `slug`
  - `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id` (auth required)
  - `POST /api/posts/:id/image`, `DELETE /api/posts/:id/image` — featured image upload/removal (auth required)
  - `POST /api/posts/bulk` — bulk `publish`/`delete` actions (auth required)

### Frontend

- **`vite.config.js`** — Proxies all `/api` requests to `http://localhost:4000`.
- **`src/api/`** — Thin fetch wrappers (`posts.js`, `auth.js`); the single source of truth for backend calls.
- **`src/context/AuthContext.jsx`** / **`src/components/ProtectedRoute.jsx`** — Auth state and route guarding.
- **`src/App.jsx`** — React Router setup: `/` (PostList), `/posts/:slug` (PostDetail), `/login` (Login), `/create` and `/posts/:slug/edit` (protected).
- Pages live in `src/pages/`, reusable pieces in `src/components/`, each paired with a CSS Module (`.module.css`).

### Data Model

**`posts`**: `id`, `title`, `content`, `author`, `category` (default `'General'`), `status` (`'draft'` | `'published'`, CHECK constraint), `tags`, `excerpt`, `slug`, `featured_image`, `created_at`, `updated_at`, `published_at`.

**`users`**: `id`, `username`, `password_hash`, `created_at`.
