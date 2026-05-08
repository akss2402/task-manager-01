# Team Task Manager — Project Plan (Milestones)

This document breaks the full-stack build into milestones you can complete, test, and deploy incrementally.

## Tech Stack (fixed)

- **Backend**: Node.js + Express (REST API)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT (Access + Refresh tokens) + **RBAC** (Admin/Member)

Database URL (Neon):

- `postgresql://neondb_owner:npg_kD7neCWLRNp2@ep-lucky-bird-aq40gb6y.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require`

## Global Quality Rules (apply to all milestones)

- **Validation**: Validate *all* inputs (body, params, query). Reject unknown fields.
- **Security**: Hash passwords, never log tokens, store refresh tokens hashed, use CORS properly.
- **RBAC**: Every protected endpoint must enforce both **authentication** and **authorization**.
- **DB integrity**: Use foreign keys, unique constraints, check constraints, and transactions for multi-step writes.
- **API shape**: Consistent JSON responses and error format across the app.
- **No “advanced extras”**: No rate limiting, message queues, microservices, or complex patterns beyond clean MVC/service layering.

## Milestone 0 — Project Bootstrap & Standards

**Goal**: Create the repo structure and baseline tooling so backend + frontend can evolve cleanly.

**Deliverables**
- **Monorepo layout** (suggested):
  - `server/` (Express API)
  - `client/` (Vite React)
  - `shared/` (optional: shared types, constants)
- `.env.example` for backend and frontend
- Scripts:
  - Backend: `dev`, `start`, `lint` (optional), `migrate`, `seed` (optional)
  - Frontend: `dev`, `build`, `preview`
- Basic README with run instructions (local + deployed)

**Acceptance checks**
- Backend runs locally and can connect to Neon (or local Postgres).
- Frontend runs locally and can reach backend (proxy or env base URL).

## Milestone 1 — Database Schema + Migrations

**Goal**: Establish correct relationships for org/team/project/task + auth.

**Core entities**
- **users**
  - `id` (uuid), `name`, `email` (unique), `password_hash`, timestamps
- **projects**
  - `id`, `name`, `description`, `created_by` (FK users), timestamps
- **project_members**
  - `project_id` (FK), `user_id` (FK), `role` (`admin` | `member`), `joined_at`
  - Unique: (`project_id`, `user_id`)
- **tasks**
  - `id`, `project_id` (FK), `title`, `description`
  - `status` (`todo` | `in_progress` | `done`)
  - `priority` (`low` | `medium` | `high`) (optional)
  - `assignee_id` (FK users, nullable), `due_date` (nullable)
  - `created_by` (FK users), timestamps
- **refresh_tokens** (for rotation / logout-all)
  - `id`, `user_id` (FK), `token_hash`, `revoked_at` (nullable), `expires_at`, `created_at`

**Constraints & indexes**
- Email unique index on `users(email)`
- Indexes:
  - `tasks(project_id, status)`
  - `tasks(assignee_id, status)`
  - `tasks(due_date)`
  - `project_members(project_id, role)`
- Check constraints for enums (or Postgres enums)

**Acceptance checks**
- Migration runs on a fresh database.
- FK relationships prevent orphan data.

## Milestone 2 — Backend Auth (Signup/Login/Refresh/Logout) + RBAC foundation

**Goal**: Implement secure JWT auth with refresh token rotation and a clean middleware layer.

**Endpoints**
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh` (refresh token → new access + refresh)
- `POST /auth/logout` (revoke current refresh token)
- `POST /auth/logout-all` (revoke all refresh tokens for user)
- `GET /auth/me`

**Auth details**
- Access token: short-lived (e.g. 15m)
- Refresh token: longer-lived (e.g. 7–30d), stored as **httpOnly cookie** (recommended) or returned to client if cookie is not used
- Store refresh token **hash** in DB (never store raw token)
- Rotation: on refresh, revoke old token and store new one

**Middleware**
- `requireAuth`: verifies access token, attaches `req.user`
- `requireProjectRole(projectIdParamName, allowedRoles[])`: loads membership and enforces role

**Acceptance checks**
- Users can sign up, login, refresh, logout, and fetch `/auth/me`.
- Access token required for protected endpoints.

## Milestone 3 — Project & Team Management APIs (RBAC enforced)

**Goal**: Projects and team membership management with correct authorization.

**Endpoints**
- Projects:
  - `POST /projects` (creator becomes Admin)
  - `GET /projects` (list projects user belongs to)
  - `GET /projects/:projectId`
  - `PATCH /projects/:projectId` (**Admin only**)
  - `DELETE /projects/:projectId` (**Admin only**)
- Members:
  - `GET /projects/:projectId/members`
  - `POST /projects/:projectId/members` (**Admin only**) add by email
  - `PATCH /projects/:projectId/members/:userId` (**Admin only**) change role
  - `DELETE /projects/:projectId/members/:userId` (**Admin only**) remove member

**Rules**
- Only members can read a project.
- Only Admin can modify project settings or membership.
- Prevent removing the last Admin (keep at least one Admin per project).

**Acceptance checks**
- Member cannot add/remove members or update project.
- Admin can manage membership and project details.

## Milestone 4 — Task Management APIs (CRUD + assignment + status)

**Goal**: Tasks can be created, assigned, updated, and tracked; membership rules apply.

**Endpoints**
- `POST /projects/:projectId/tasks` (member+)
- `GET /projects/:projectId/tasks` (member+) with filters:
  - `status`, `assigneeId`, `dueBefore`, `dueAfter`, `q` (search)
- `GET /projects/:projectId/tasks/:taskId` (member+)
- `PATCH /projects/:projectId/tasks/:taskId` (member+)
- `DELETE /projects/:projectId/tasks/:taskId` (**Admin only** or “creator only” if you choose)

**Rules**
- Assignee must be a member of the project.
- Status transitions must be valid (simple free transitions are acceptable).

**Acceptance checks**
- Non-member cannot read/write tasks.
- Task assignment fails if assignee not in project.

## Milestone 5 — Dashboard APIs (My Tasks, Overdue, Stats)

**Goal**: Power the main UI with aggregated, user-focused views.

**Endpoints**
- `GET /dashboard/overview`
  - Counts by status for “my tasks”
  - Overdue count
- `GET /dashboard/my-tasks`
  - Filters: `status`, `overdueOnly`, `projectId`
- `GET /dashboard/project/:projectId/stats` (member+)
  - Counts by status, overdue, unassigned

**Acceptance checks**
- Overdue defined as `due_date < now` and `status != done`.
- Results only include tasks from projects the user is in.

## Milestone 6 — Frontend (Auth + App Shell + Routing)

**Goal**: Implement the client foundations with clean state handling and routing.

**Pages**
- Auth: `Login`, `Signup`
- App shell: navbar/sidebar, user menu, logout
- Protected routes: redirect unauthenticated users to login

**Client architecture**
- API layer: a single `apiClient` with:
  - `Authorization: Bearer <accessToken>`
  - automatic refresh flow on 401 (refresh token → retry once)
- Auth store: keep access token in memory (preferred) + refresh via cookie

**Acceptance checks**
- Login → routed into app.
- Refresh works after reload (if cookie-based refresh is implemented).

## Milestone 7 — Frontend (Projects & Team UI)

**Goal**: Full UI for project CRUD and managing team members with role awareness.

**Pages / Components**
- Projects list + create project modal
- Project details page
- Members list with role badges
- Admin-only controls for add/remove/change role

**Acceptance checks**
- Member sees read-only membership UI.
- Admin sees and can use management actions.

## Milestone 8 — Frontend (Tasks UI + Status Tracking)

**Goal**: End-to-end task lifecycle from UI.

**Pages / Components**
- Task list with filters (status, assignee, overdue)
- Create/edit task modal
- Assign to member dropdown
- Status change (select or kanban-lite columns)

**Acceptance checks**
- All task actions match backend RBAC and validations.

## Milestone 9 — Frontend (Dashboard + Overdue)

**Goal**: A dashboard that surfaces what matters.

**Pages**
- Dashboard overview: cards for counts, overdue, quick links
- “My tasks” view with filters

**Acceptance checks**
- Overdue tasks view matches backend definition.

## Milestone 10 — Testing & Hardening (Pre-Deploy)

**Goal**: Ensure correctness and avoid common production foot-guns.

**Backend checks**
- Request validation coverage for all endpoints
- Authorization tests:
  - unauthenticated → 401
  - wrong project role → 403
  - cross-project access blocked
- Transaction correctness for:
  - project creation (creator membership)
  - refresh rotation
  - membership removal constraints

**Frontend checks**
- Route guarding works
- Refresh + retry logic works and doesn’t loop
- Forms show server validation errors nicely

## Milestone 11 — Deployment (Backend + Frontend + DB)

**Goal**: Deploy the full system with correct environment config.

**Environments**
- Backend env:
  - `DATABASE_URL` (Neon)
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`
  - `CORS_ORIGIN` (frontend URL)
  - `COOKIE_SECURE=true` in prod (if using cookies)
- Frontend env:
  - `VITE_API_BASE_URL`

**Deployment steps**
- Run DB migrations on Neon
- Deploy backend (Render/Railway/Fly.io/Vercel serverless *only if Express is supported as needed*)
- Deploy frontend (Vercel/Netlify)
- Configure CORS + cookies (if cookie auth) for your deployed domains

**Acceptance checks**
- New user can sign up and use the app in production.
- Refresh flow works on production HTTPS.

## Definition of Done (Final Completion)

- **Auth**: Signup/Login/Refresh/Logout implemented securely
- **RBAC**: Admin/Member enforced on every project + task operation
- **Projects**: CRUD + member management
- **Tasks**: CRUD + assignment + status + overdue
- **Dashboard**: stats + my tasks + overdue
- **Validation**: consistent errors and safe inputs everywhere
- **Deployment**: stable production setup with Neon DB and environment variables

