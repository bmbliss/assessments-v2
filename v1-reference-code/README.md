# Patient Assessment App POC

This document outlines the requirements, decisions, and setup for a proof of concept (POC) for a patient assessment app built with Next.js, PostgreSQL, and Prisma. The app enables doctors to create and manage assessments for patients, who can complete them via a patient portal, supporting telehealth use cases like TRT or peptide treatments.

## Overview
The app allows:
- **Doctors/Providers**: Create, edit, and view assessments within a practice, using templates or custom forms.
- **Patients**: Log in to a portal, complete assigned assessments, save drafts, and submit responses.
- **Features**: Support multiple question types, simple conditional branching, versioning, and basic telemetry (timestamps per answer).

The POC focuses on core functionality to validate the database architecture and user flows, keeping implementation simple for a beginner Next.js developer.

## Requirements
### Core Features
1. **Users and Practices**:
   - Users: Doctors (create/edit assessments), Patients (take assessments), potentially Admins (manage practices).
   - Practices: Scope assessments (each assessment belongs to a practice). Patients likely belong to a single practice (TBD: shared across practices?).
   - Authentication: Patients and doctors need accounts (use Clerk for simplicity).

2. **Assessments**:
   - Doctors create/edit assessments with customizable questions.
   - Support templates (global, forkable by practices).
   - Versioning: Editing an assessment creates a new version; patient responses tie to the specific version taken.
   - Custom success message shown to patients post-submission.

3. **Question Types**:
   - Supported: Text, Number, Date, Single-Select (dropdown/radio), Multi-Select (checkboxes), Slider, File Upload (S3 URLs, mocked for POC).
   - Validation: Per-question rules (e.g., required, min/max for numbers) stored as strings (e.g., "required=true,min=0").
   - Simple Conditional Branching: Show/hide questions based on prior answers (e.g., "If Q1 = 'Yes', show Q2"). Start simple; extendable later.

4. **Patient Flow**:
   - Patients access assessments via a portal (list available ones).
   - Save drafts automatically; resume later.
   - Submit completed assessments, see custom success message.
   - Patients select assessments tied to treatments (e.g., TRT, peptides).

5. **Doctor Viewing**:
   - View individual patient responses per assessment (no aggregates for POC).
   - Basic counts (e.g., number of completed assessments).
   - Notes: Add comments per patient’s assessment response.

6. **Telemetry**:
   - Track timestamps per answer (for auditing/monitoring progress).

7. **File Uploads**:
   - Store S3 URLs in the database (mock for POC; assume images/PDFs).

### Out of Scope for POC
- Complex branching (e.g., multi-condition logic).
- Analytics/summaries beyond simple counts.
- Exportable results (PDF/CSV).
- Advanced HIPAA compliance (e.g., encryption, row-level security).
- Integrations (e.g., EHR, scheduling).

### Scalability
- Target: Support 100k+ assessments, 1000s of patients, 100s of practices.
- POC focus: Functional schema, basic indexing. Optimize later (e.g., partitioning, materialized views).

## Database Architecture (Prisma Schema)
The PostgreSQL schema is defined in `prisma/schema.prisma`. Key models and design decisions:

### Models
1. **Practice**:
   - Fields: `id`, `name`.
   - Relations: Has many `User`s (doctors/patients, TBD), many `Assessment`s.
   - Purpose: Scopes assessments; top-level entity.

2. **User**:
   - Fields: `id`, `email` (unique), `role` (enum: DOCTOR, PA, PATIENT, ADMIN), `practiceId` (optional, TBD).
   - Relations: Belongs to `Practice` (if not global), creates `Assessment`s, submits `AssessmentResponse`s.
   - Note: Sync with Clerk for auth (map Clerk userId to `User.id`).

3. **Assessment**:
   - Fields: `id`, `title`, `description`, `isTemplate` (boolean), `status` (enum: DRAFT, ACTIVE, ARCHIVED), `practiceId`, `creatorId`, `finalMessage`.
   - Relations: Belongs to `Practice`, created by `User`, has many `Version`s and `AssessmentResponse`s.
   - Note: `isTemplate` flags global reusable templates; forking copies to new `Assessment`.

4. **Version**:
   - Fields: `id`, `versionNumber`, `assessmentId`, `createdAt`.
   - Relations: Belongs to `Assessment`, has many `Question`s.
   - Purpose: Supports versioning; new version created on edit.

5. **Question**:
   - Fields: `id`, `versionId`, `order`, `text`, `type` (enum: TEXT, NUMBER, etc.), `options` (string, e.g., "Yes,No"), `validation` (string, e.g., "required=true"), `dependsOnQuestionId`, `conditionValue` (for branching).
   - Relations: Belongs to `Version`, self-references for branching, has many `Answer`s.
   - Note: Simple branching via `dependsOnQuestionId` (e.g., show if prior question’s answer matches `conditionValue`).

6. **AssessmentResponse**:
   - Fields: `id`, `patientId`, `assessmentId`, `versionId`, `status` (enum: DRAFT, COMPLETED), `startedAt`, `completedAt`, `notes`.
   - Relations: Belongs to `User` (patient), `Assessment`, `Version`; has many `Answer`s.
   - Purpose: Tracks patient submissions, ties to specific version.

7. **Answer**:
   - Fields: `id`, `responseId`, `questionId`, `value` (string for text/number/etc.), `fileUrl` (S3 URL, nullable), `answeredAt`.
   - Relations: Belongs to `AssessmentResponse`, `Question`.
   - Purpose: Stores individual answers with telemetry (timestamp).

### Design Decisions
- **Normalization**: Separate tables for `Assessment`, `Version`, `Question`, `Answer` to avoid JSONB (per preference) and ensure flexibility.
- **Versioning**: Responses tie to `Version` (not just `Assessment`) to preserve integrity when edited.
- **Branching**: Simple logic (one dependency per question); extendable via new `Conditions` table if needed.
- **Indexes**: Added on hot fields (e.g., `patientId`, `assessmentId`) for query performance.
- **Validation**: Stored as strings, parsed by app (e.g., via Zod) for simplicity.
- **Scalability**: Schema supports 100k+ assessments; optimize later with PG partitioning or caching.

## Implementation Plan
### Tech Stack
- **Frontend/Backend**: Next.js (App Router, TypeScript, Tailwind CSS).
- **Database**: PostgreSQL (via Neon or local Docker).
- **ORM**: Prisma (for schema management, queries).
- **Auth**: Clerk (simplifies user management, roles).
- **UI Components**: Shadcn/UI (pre-built, customizable).
- **Form Handling**: React Hook Form (for validation, drafts).
- **Package Manager**: pnpm

### Setup Steps
1. **Initialize Next.js**:
   - Run `npx create-next-app@latest my-assessment-poc --typescript --eslint --tailwind --app --src-dir`.
   - Install dependencies: `cd my-assessment-poc && npm install`.

2. **Set Up PostgreSQL**:
   - Use Neon (free tier) or Docker (`docker run -d -p 5433:5433 -e POSTGRES_PASSWORD=mysecretpassword postgres`).
   - Add `DATABASE_URL` to `.env`.

3. **Configure Prisma**:
   - Install: `npm install prisma @prisma/client`.
   - Initialize: `npx prisma init`.
   - Copy schema to `prisma/schema.prisma`.
   - Run `npx prisma db push` to create tables.
   - Generate client: `npx prisma generate`.

4. **Add Authentication**:
   - Install Clerk: `npm install @clerk/nextjs`.
   - Sign up at `clerk.com`, add keys to `.env`.
   - Wrap app in `<ClerkProvider>`; use `<SignIn>` for login.
   - Sync Clerk users to `User` model (manual role assignment for POC).

5. **Build API Routes** (in `src/app/api/`):
   - **Assessments**: `POST /api/assessments` (create with questions), `GET /api/assessments?practiceId=X` (list).
   - **Responses**: `POST /api/responses` (save patient answers), `GET /api/responses?assessmentId=X` (doctor view).
   - **Versioning**: `POST /api/assessments/[id]/versions` (create new version on edit).
   - Use Prisma for DB operations; Clerk for auth checks.

6. **Build Frontend** (in `src/app/`):
   - **Doctor Dashboard** (`/dashboard`): List assessments, form to create/edit (question type dropdown, text/options/validation inputs).
   - **Patient Portal** (`/portal`): List assessments, dynamic form (render based on `Question.type`, handle branching client-side).
   - **Response View** (`/responses/[id]`): Show patient answers, add notes.
   - Use Shadcn/UI components (`npx shadcn-ui@latest init`, add `Button`, `Input`, `Select`).
   - Use React Hook Form for form validation and draft saving.

7. **Core Features**:
   - **Versioning**: On edit, create new `Version` with copied `Question`s.
   - **Branching**: Client-side logic (e.g., show Q2 if Q1’s answer matches `conditionValue`).
   - **Drafts**: Save `Answer`s incrementally; update `AssessmentResponse.status` on submit.
   - **File Uploads**: Mock S3 (input type="file", store dummy URL in `Answer.fileUrl`).
   - **Telemetry**: Set `Answer.answeredAt` on each save.

8. **Testing**:
   - Test flows: Doctor creates assessment, patient takes it, doctor views responses.
   - Verify versioning (responses tied to correct version).
   - Check branching (simple conditions work).

### Time Estimate
- Total: ~20-40 hours (1-2 weeks for a beginner).
- Breakdown:
  - Setup (Next.js, DB, Prisma, Clerk): 5-7 hours.
  - API Routes: 4-6 hours.
  - Frontend/UI: 8-12 hours.
  - Features (versioning, branching, drafts): 8-12 hours.
  - Testing/Debugging: 4-8 hours.

## Next Steps
- Start with setup (Next.js, PostgreSQL, Prisma, Clerk).
- Implement core models and API routes first, then build frontend.
- Test incrementally (e.g., create assessment, then add patient flow).
- Iterate based on POC feedback (e.g., add complex branching, analytics).
- Optimize for scale later (e.g., indexes, caching).
