Review all uncommitted changes, stage them, craft a conventional commit message, and push to GitHub.

## Steps

### 1. Inspect the working tree

Run these in parallel:
- `git status` — see what's modified, untracked, or staged
- `git diff HEAD` — see the full diff of all changes

### 2. Analyze the changes

Read the diff carefully and determine:

**Type** — pick exactly one:
- `feat` — new user-facing feature or behaviour
- `fix` — bug fix or correction
- `chore` — tooling, config, deps, refactors, tests, docs, build

**Scope** (optional) — the area affected, e.g. `api`, `ui`, `auth`, `db`. Omit if the change spans many areas.

**Summary line** — imperative mood, ≤ 72 chars, no trailing period.  
Example: `feat(api): add pagination to GET /posts`

**Body** (optional) — only if the *why* isn't obvious from the diff. Keep it short.

### 3. Stage all changes

```powershell
git add -A
```

If any files look like secrets (`.env`, credentials, keys), **do not stage them** — warn the user and stop.

### 4. Commit

Use a heredoc so formatting is exact:

```powershell
git commit -m @'
<type>(<scope>): <summary>

<optional body>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

### 5. Push

```powershell
git push
```

If the branch has no upstream, run:

```powershell
git push -u origin HEAD
```

### 6. Report

Tell the user:
- The commit type and message used
- Which files were included
- The push target (branch + remote URL if available)
