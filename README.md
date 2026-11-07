# MOWE Academy

Certified Business Administrator learning interface with database-backed learner/admin authentication.

## Structure

- `frontend/`: Next.js App Router + React + TypeScript frontend with real page routes and reusable components, with MOWE Global brand tokens and responsive layouts.
- `backend/`: Express + Prisma/PostgreSQL authentication, course authoring, enrollment, lesson progress, quizzes, assignment review and administrator invitations.

## Run locally

Node.js 22.13 or later is required.

```powershell
cd frontend
npm ci
npm run dev
```

Also run `npm run dev` in `backend` in a separate terminal. The authentication backend listens on `127.0.0.1:4000`.

Open the Local URL printed by the server, `http://localhost:5173` (fixed port). From the root, `npm run dev` starts the frontend too.

## Review the layouts

Public signup is learner-only, and administrator access is separate at `/admin`. Sign up at `/signup` and verify your email before entering the learner dashboard. Admin access requires a private registration invitation; see [backend setup](backend/README.md).

| Page | Route |
| --- | --- |
| Landing page | `/` |
| Learner dashboard | `/dashboard` |
| Course catalog | `/courses` |
| Course detail | `/course/course-1` |
| First lesson | `/learn/course-1/c1-l1` |
| Certificates | `/certificates` |
| Profile | `/profile` |
| Admin dashboard | `/admin` |
| Course management | `/admin/courses` |
| Course builder | `/admin/courses/course-1` |
| Learner management | `/admin/students` |
| Assignment review | `/admin/review` |
| Media library | `/admin/media` |
| Admin announcements | `/admin/announcements` |
| Learner announcements | `/announcements` |
| Certificate management | `/admin/certificates` |

Courses, content history, enrollment, notes, progress, quiz attempts, written assignments, grading, certificates and settings persist in PostgreSQL. Admin changes are shared across accounts. Learners only see published courses; correct quiz answers stay on the server. Signed-in bookmarks persist across devices. Cloudinary stores lesson resources, videos, private assignment attachments and profile photos. Admin overview totals come from uncapped database aggregates and refresh when activity changes (checked every 15 seconds while visible, on focus and navigation). Certificate issuance is free and checks completion requirements on the server.

## Curriculum and branding

The supplied CBA outline is expanded into three courses, 11 modules with 33 lessons, 30 multiple-choice questions with explanations, and three workplace assignments with review criteria. Each module combines core teaching, a worked case study and a practical workshop. Each course starts with a 70% pass mark, three quiz attempts and no time limit; admins can adjust these. The programme final assessment combines the published question banks. Course text is original draft teaching material for academy review and can be edited in `/admin/courses`.

The learner course pages include a searchable outline that can be opened or closed, lesson previews, progress, and direct links to quizzes and assignments. On mobile the outline becomes a drawer with keyboard focus handling and Escape dismissal.

The course builder provides inline module/lesson deletion and Undo, including the final item. Empty courses, modules and assessments can be saved as drafts; publishing requires at least one module, a complete lesson in every module and at least one quiz question. Save the draft or publish to persist structure edits. Shared colour tokens keep text, borders and status colours consistent across learner, admin and auth pages.

After configuring the backend database, run `npm run db:migrate` and `npm run db:seed` in `backend`. Seeding inserts missing course IDs and preserves existing admin edits. See [content notes](backend/src/content/README.md).

Brand tokens were checked against the live `moweglobal.com` stylesheet: Afacad / Afacad Flux, vermilion `#c8281b`, navy `#0f2a52`, rounded buttons, and corporate photography. The original logo and workshop photo are sourced from that site; the classroom photo is stock photography. No student testimonial or outcome statistics are invented.

## Checks

Light mode is the default. The sun/moon control in the public and workspace headers and auth screens switches themes. The choice is stored in the browser and applied before hydration to avoid a light-theme flash when returning in dark mode. Certificate paper and course artwork retain their original colours.

```powershell
cd frontend
npm run typecheck
npm run build
```

## Next stage

Free certificate eligibility, issuance and verification are implemented at `/admin/certificates` and `/certificates`. Admins can configure completion requirements and certificate details; learners can claim a certificate once eligible. Issued certificates support public verification and Print / Save PDF. Payment integration and academic review of the expanded curriculum remain future work. Paid enrollment is blocked until checkout is configured.
