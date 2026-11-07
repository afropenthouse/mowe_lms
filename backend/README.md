# MOWE Academy authentication backend

Express 5 + TypeScript, Prisma 7, PostgreSQL, and SMTP email. Authentication is connected to the Next.js frontend through its same-origin `/api/auth/*` proxy. Learning content/progress features remain frontend demonstrations; this backend implements authentication and account profiles.

## Run locally

Dependencies, the Prisma client, the initial migration, and the provided local environment have already been configured on this machine.

```powershell
cd backend
npm run dev
```

In another terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173/signup` or `/login`. The backend listens on `127.0.0.1:4000`.

For a new checkout: `npm ci`, copy `.env.example` to `.env`, supply real settings, then run `npm run db:generate` and `npm run db:migrate`. Never commit `.env`. The database connection uses verified TLS and channel binding. All auth tables and Prisma migration history are isolated inside the `mowe_lms` PostgreSQL schema.

## Create the first administrator

Administrator signup requires an email-bound, one-use invitation. Run this trusted local CLI with the intended administrator's unregistered email:

```powershell
npm run admin:invite -- admin@example.com
```

The recipient receives a private `/admin/signup` registration link, creates their password, and verifies their email code. The CLI does not print invitation tokens. Signed-in Super Admins can invite additional administrators from `/admin/team`. Public signup at `/signup` is learner-only and has no account-type selector. `/admin` redirects signed-out visitors to `/admin/login`. Public signup cannot create a privileged role without a valid invitation. Existing accounts are not promoted by an invitation.

## Implemented flows

- Learner signup and invitation-based admin signup.
- Six-digit email verification, 10-minute expiry, five attempts, one-use consumption, and a 60-second resend cooldown.
- New and reset passwords must contain 8–12 characters. Older passwords remain accepted at login to avoid locking out existing accounts.
- Login with password hashing, verified-email enforcement, opaque database-backed sessions, optional 30-day remember-me, and a ten-session cap.
- Password reset using an email code. Successful reset invalidates all existing sessions and pending account challenges.
- Sign out, sign out everywhere, persistent profiles, and a paginated administrator-only user directory.
- CSRF checks, origin validation, security headers, request-body limits, and persistent IP/account throttling.
- PostgreSQL row locks protect concurrent code consumption. Password operations are asynchronous and concurrency bounded.
- Generic credential/recovery errors. Passwords, codes, invitation tokens and session tokens are never logged. Codes use keyed hashes; only hashes of session/invitation tokens are stored.

## Endpoints

## Course content and learning

Run `npm run db:migrate` then `npm run db:seed` to install the CBA curriculum. Seeding is repeatable and preserves existing content. The backend also exposes `GET /learning/state` and CSRF-protected `POST /learning/actions`, proxied as `/api/learning/*` by Next.js. Anonymous users receive the published catalogue without answer keys. Authenticated learners receive their own progress and attempts; admins receive drafts, editing data, content history and review queues. Course authoring, restore/delete, grades and programme settings require a verified admin session.

Actions include course save/delete/restore, enrollment, lesson notes/progress, quiz start/submit, written assignment submission/review, discussion, settings and learner suspension/reactivation. Quiz limits and grading are enforced server-side; attempts snapshot the assessment so later edits do not change an in-flight quiz. Cloudinary file storage and free certificate issuance are implemented. See [curriculum authoring notes](src/content/README.md).

### Announcements

Admins compose in-app announcements at `/admin/announcements`. Delivery supports all active, verified learners; up to 500 individually selected learners; or a union of learner groups and learners with activity in selected published courses. Groups cover enrolled, not enrolled, certified, and enrolled without a certificate. Course activity means a lesson progress record, quiz attempt or assignment. Recipients are resolved at send time; future signups are not automatically added to past announcements.

`GET /admin/announcements` lists paginated sent messages with recipient and read counts. `POST /admin/announcements/preview` checks an audience, and `POST /admin/announcements` sends a validated title, body and targeting. Delivery and the sent history commit in one database transaction. Recipients receive private Prisma LearningRecords (`kind=notification`) and history is stored under `announcement:<uuid>` in AcademySetting.

Learners use `GET /learning/notifications` and `PATCH /learning/notifications/read` for their inbox and individual/all read state. Session ownership is enforced server-side. Unread counts appear in the learner sidebar and bell, and visible inboxes refresh every 15 seconds and on focus. The admin header has no notification bell. These messages are in-app announcements; no SMTP email is sent.

### Certificate management

`GET /admin/certificates` provides a searchable, paginated completion register and counts for issued, eligible and in-progress learners. `PATCH /admin/certificates/settings` configures the issuer, program title, signatory, optional graded assignments and final assessment requirements, and the issuance pause. All admin roles can manage certificates; learner requests are denied.

`POST /admin/certificates/issue` accepts a learner `userId`. Learners can also claim their own certificate through the `certificate` learning action. The server requires active, verified enrollment, all lessons in currently published courses, and a passing graded attempt for every course quiz. Optional requirements are checked server-side. Certificates always have a zero fee, and row locking plus the unique learning-record key prevent duplicate issuance. Issued certificates store the recipient and issuer details as a snapshot in a Prisma LearningRecord (`kind=certificate`, `key=program`); later profile or settings edits do not rewrite them.

`GET /learning/certificates/:id` publicly verifies an issued certificate using its opaque reference. Email and issuing admin ID are excluded. The frontend verification page supports browser printing and Save as PDF. An issued certificate remains available when issuance is paused or the curriculum changes.

### Authentication endpoints

All paths below are relative to `/auth` on the backend or `/api/auth` on the frontend.

| Method | Path | Purpose |
|---|---|---|
| GET | `/csrf` | Establish signed CSRF cookie and return request token |
| GET | `/me` | Current verified session or null |
| POST | `/register` | Create learner or invited administrator |
| POST | `/verify-email` | Consume email code and establish session |
| POST | `/resend-code` | Resend using the pending challenge ID |
| POST | `/login` | Establish session; unverified accounts receive verification guidance |
| POST | `/forgot-password` | Request reset code; always return generic eligibility message |
| POST | `/reset-password` | Consume reset code and change password |
| POST | `/logout` | Revoke current session |
| POST | `/logout-all` | Revoke all sessions for the signed-in user |
| PATCH | `/profile` | Update the signed-in user's display details |
| POST | `/change-password` | Verify the current password, rotate this session and revoke other sessions |
| GET | `/admin/users` | Administrator-only, bounded user directory |
| POST | `/admin-invitations` | Administrator-only invitation email |

Mutations require `X-CSRF-Token`, matching the signed CSRF cookie. The frontend client manages this automatically. Authentication uses an HttpOnly, SameSite=Lax cookie; production adds Secure. No session token is stored in localStorage.

## Commands and verification

```powershell
npm run db:validate
npm run typecheck
npm test
npm run build
npm start
npm run smtp:verify
npm run auth:cleanup
```

Tests use temporary accounts in the configured `mowe_lms` schema and remove those accounts afterward. Test email is captured in memory through a test-only mail driver; no test messages are sent to actual recipients. Production refuses the test mail driver. `smtp:verify` checks real SMTP connectivity/authentication without sending mail.

Run `auth:cleanup` regularly to remove expired sessions, throttling windows, invitations and stale codes. Do not run a second backend server on the same port. Production requires `NODE_ENV=production`, an HTTPS frontend origin, a unique `AUTH_SECRET`, and the appropriate trusted-proxy configuration for the deployment. Keep the backend behind the frontend proxy; direct browser cross-origin access is not enabled.

Security choices follow [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [password recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). Prisma uses the [PostgreSQL driver adapter](https://www.prisma.io/docs/orm/v7).

## Cloudinary uploads

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in backend `.env`, then apply migrations and restart the backend. Keep these credentials out of the frontend.

`POST /files` accepts a CSRF-protected multipart form with `file`, `purpose` and optional `courseId`. Admins upload lesson resources/videos from the media library or course editor. Enrolled learners upload course-bound assignment attachments, and signed-in users can upload profile photos. Allowed resources: PDF, DOCX, UTF-8 TXT, PNG, JPG and WebP (20 MB). Videos: MP4/WebM (20 MB). Profile photos: JPG, PNG or WebP (5 MB). File signatures are verified.

Resources, videos and assignments use authenticated Cloudinary storage. `GET /files/:id` checks the session and enrollment/ownership before issuing a two-minute signed download. Assignment files are limited to their owner and admins. Profile photos are public. `DELETE /files/:id` permits the owner or admin and refuses files referenced by courses, version history or submissions. Admin media listings are paginated.

`GET /learning/overview` returns server-side totals excluding admins, unverified users and stale lesson progress. `GET /learning/updates` provides a revision token to refresh active clients after content or learner activity changes.

Run normal checks with `npm test`. To verify real Cloudinary storage too, run `$env:RUN_CLOUDINARY_TESTS="1"; npx tsx --test test/files.test.ts` in PowerShell. That check creates temporary users, a course and cloud files, verifies permissions/downloads/grading/totals, and removes its fixtures.

Learners receive a permanent unique student number (MOWE557, MOWE558, etc.). PostgreSQL assigns numbers atomically and existing learners are backfilled by the student-number migration. Administrators have no student number. Profile updates cannot change email, role or student number. Password changes require the current password and matching 8-12 character passwords, preserve the current login with a rotated cookie, revoke other sessions and consume outstanding reset codes. Profile photos use Cloudinary. Learners use /profile and administrators use /admin/profile; both workspace avatars link to their profile.

To test real profile photos too, set RUN_CLOUDINARY_TESTS=1 and run npx tsx --test test/profile.test.ts. If Node 24 is running behind an HTTPS proxy, set NODE_USE_ENV_PROXY=1 so CDN downloads use the configured proxy.
