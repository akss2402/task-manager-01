# Team Task Manager (Full-Stack)

A premium team task management application with role-based access control, project tracking, and a dynamic dashboard.

## Features

- **Authentication**: Secure Signup/Login with JWT (Access + Refresh tokens) and HTTP-only cookies.
- **Projects**: Create projects, manage settings, and view team members.
- **Tasks**: Create, assign, and track tasks with status and priority.
- **Dashboard**: High-level overview of your tasks, overdue items, and project stats.
- **RBAC**: Role-based access control (Admin/Member) enforced on all project and task operations.
- **UI/UX**: Modern, responsive design built with React, Tailwind CSS, and Lucide icons.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Axios + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon.tech)
- **Validation**: Zod (Backend)
- **Auth**: JWT with rotation

## Project Structure

```text
├── server/             # Express API
│   ├── src/
│   │   ├── auth/       # Authentication & RBAC
│   │   ├── projects/   # Project management
│   │   ├── tasks/      # Task management
│   │   ├── dashboard/  # Aggregated stats & views
│   │   └── db/         # Database connection
│   └── migrations/     # SQL migrations
└── client/             # Vite React App
    └── src/
        ├── components/ # Reusable UI components
        ├── pages/      # Page views (Dashboard, Projects, etc.)
        ├── services/   # API client
        └── store/      # Auth state management
```

## Local Development

1. **Clone the repository**
2. **Setup Backend**:
   - `cd server`
   - Create `.env` from `.env.example` (add your `DATABASE_URL` and `JWT_SECRET`)
   - `npm install`
   - `npm run migrate` (Runs migrations on Neon)
   - `npm run dev`
3. **Setup Frontend**:
   - `cd client`
   - `npm install`
   - `npm run dev`
4. **Access the app**:
   - Open `http://localhost:5173`

## Deployment

### Database
Ensure your Neon PostgreSQL database is running and you have run the migrations.

### Backend
1. Build the project: `npm run build`
2. Deploy to Render/Railway/Fly.io.
3. Set environment variables:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `CORS_ORIGIN` (Your frontend URL)
   - `COOKIE_SECURE=true`

### Frontend
1. Build the project: `npm run build`
2. Deploy to Vercel/Netlify.
3. Set `VITE_API_BASE_URL` if needed (proxy handles it in dev).
