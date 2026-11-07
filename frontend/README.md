# MOWE Academy frontend

Built with **Next.js 16 App Router, React 19, and TypeScript**. The approved MOWE branding, classroom portrait, course artwork, and compact learner dashboard are preserved.

## Run

```powershell
npm ci
npm run dev
```

Open **http://localhost:5173**. Stop with **Ctrl+C**. Next.js runs directly, with no custom launcher or background-server manager. The port is explicitly set to 5173.

## Commands

- `npm run dev` — Next.js development server on localhost:5173.
- `npm run build` — optimized production build and TypeScript validation.
- `npm start` — serve the production build on localhost:5173.
- `npm run typecheck` — generate route types and check strict TypeScript.
- `npm run format` — format source with Prettier.

## Organization

```text
src/
  app/          Next.js page.tsx routes, root layout, loading/error/404 states
  screens/      Landing, dashboard, catalog, course, lesson, certificate and admin views
  layout/       Header, sidebar, mobile navigation and shared overlays
  components/   Reusable course cards, course editor, quizzes and UI controls
  providers/    Shared frontend state and Next.js navigation
  lib/          Types, course artwork mapping and demo-state helpers
  data/         Exact eight-course curriculum and 28 module outlines
public/         Photos, course artwork, logo, favicon and photo credits
```

Every main screen has a real route under `src/app/`. Next.js handles route transitions, code splitting and page metadata. Approved local photos are served through `next/image` for responsive image optimization. The layout supports mobile and desktop navigation, and the certificate dialog supports keyboard dismissal.

## Frontend preview

Authentication is now connected to the Express + Prisma/PostgreSQL backend. Learners register at `/signup`, verify their email code, and sign in at `/login`. Password recovery uses `/forgot-password` and `/reset-password`. Administrator registration requires an email-bound invitation. Protected pages check sessions server-side.

Start `npm run dev` in `../backend` alongside this frontend. The server-only `BACKEND_URL` setting in `.env.local` points to `http://127.0.0.1:4000`; browser requests use the same-origin `/api/auth/*` proxy. Never expose database or SMTP settings with a `NEXT_PUBLIC_` prefix.

Course enrollment, lessons, progress, assessments, editing and grading remain frontend demonstrations. Their sample state is isolated by account on this device. Authentication, profiles and administrator account invitations are real database-backed features.

The authentication backend stays separate in `../backend/` and uses Prisma/PostgreSQL. See [the project README](../README.md) for routes. Next.js conventions follow the [official App Router documentation](https://nextjs.org/docs/app).

## Account entry points

Public account creation is learner-only at `/signup`, with sign-in at `/login`. No account-type selector or workspace-switching toolbar is shown. Administrators enter at `/admin`; signed-out visitors are sent to `/admin/login`. Private invitation links open `/admin/signup`. Authentication pages keep the photo panel stationary while the form panel can scroll.
