# Telehealth Assessment Platform V2

A next-generation patient assessment platform built for telehealth providers, supporting complex conditional flows, multiple step types, and flexible healthcare workflows.

## Overview

This platform enables healthcare providers to create sophisticated assessment flows that go beyond simple linear questionnaires. Built on lessons learned from our POC, V2 supports:

- **Flow-Based Assessments**: Complex branching logic with conditional paths
- **Multiple Step Types**: Questions, information screens, consent forms, checkout flows, provider interventions
- **Flexible Configurations**: JSONB-based step configurations for maximum flexibility
- **Rich Telehealth Workflows**: Support for medication ordering, lab requests, appointment scheduling
- **Real-time Conditional Logic**: Dynamic assessment flows based on user responses

## Key Improvements from V1

### 1. Flow-Based Architecture
**V1 Limitation**: Linear question sequences with simple 1:1 dependencies
```
Q1 → Q2 (if Q1 = "Yes") 
Q1 → Q3 (if Q1 = "No")
```

**V2 Solution**: Node-based flow system supporting complex branching
```
Q1 → Branch A (Q2, Q3, Q4) if Q1 = "Yes" AND user_age > 18
Q1 → Branch B (Q5, Q6) if Q1 = "No" 
Q2 + Q3 → Checkout Flow if severity > 7
```

### 2. Abstract Step Types
**V1 Limitation**: Everything was a "question"

**V2 Solution**: Rich step types for complete telehealth workflows
- `question` - Traditional form inputs
- `information` - Educational content, disclaimers
- `consent` - Legal consent forms
- `media` - Videos, images, educational materials
- `checkout` - Medication/service selection and payment
- `appointment` - Schedule follow-up appointments
- `lab_order` - Generate lab orders based on responses
- `provider_review` - Flag for urgent provider intervention
- `external_link` - Redirect to external resources

### 3. JSONB Configuration
**V1 Limitation**: Comma-separated strings for options/validation
```sql
options: "Yes,No,Maybe"
validation: "required=true,min=0,max=100"
```

**V2 Solution**: Structured JSONB configuration
```sql
config: {
  "questionType": "single_select",
  "options": [
    {"value": "yes", "label": "Yes", "triggersUrgent": true},
    {"value": "no", "label": "No"}
  ],
  "validation": {"required": true, "customMessage": "This field is required"}
}
```

## Database Architecture

### Core Models

```sql
-- Flow management
model AssessmentFlow {
  id           Int @id @default(autoincrement())
  versionId    Int
  startStepId  Int?
  
  version      Version @relation(fields: [versionId], references: [id])
  steps        FlowStep[]
  transitions  FlowTransition[]
}

-- Individual steps in the flow
model FlowStep {
  id           Int @id @default(autoincrement())
  flowId       Int
  type         StepType
  title        String?
  config       Json        -- Step-specific configuration
  position     Json?       -- UI positioning for flow builder
  
  flow         AssessmentFlow @relation(fields: [flowId], references: [id])
  outgoing     FlowTransition[] @relation("FromStep")
  incoming     FlowTransition[] @relation("ToStep")
  responses    StepResponse[]
}

-- Transitions between steps with conditional logic
model FlowTransition {
  id           Int @id @default(autoincrement())
  flowId       Int
  fromStepId   Int
  toStepId     Int
  condition    Json?       -- Complex conditional logic
  order        Int         -- Priority for multiple conditions
  
  flow         AssessmentFlow @relation(fields: [flowId], references: [id])
  fromStep     FlowStep @relation("FromStep", fields: [fromStepId], references: [id])
  toStep       FlowStep @relation("ToStep", fields: [toStepId], references: [id])
}

-- User interactions with steps
model StepResponse {
  id              Int @id @default(autoincrement())
  assessmentResponseId Int
  stepId          Int
  data            Json        -- Flexible response data
  completedAt     DateTime?
  metadata        Json?       -- Telemetry, timing data, etc.
  
  assessmentResponse AssessmentResponse @relation(fields: [assessmentResponseId], references: [id])
  step            FlowStep @relation(fields: [stepId], references: [id])
}

enum StepType {
  QUESTION
  INFORMATION
  CONSENT
  MEDIA
  CHECKOUT
  APPOINTMENT
  LAB_ORDER
  PROVIDER_REVIEW
  EXTERNAL_LINK
}
```

### Conditional Logic System

Complex conditions using JSON structure:
```json
{
  "rules": [
    {
      "stepId": 5,
      "operator": "equals", 
      "value": "severe",
      "path": "data.severity"
    },
    {
      "stepId": 7,
      "operator": "greater_than",
      "value": 8,
      "path": "data.painLevel"
    }
  ],
  "logic": "AND"
}
```

## Step Type Configurations

### Question Step
```json
{
  "type": "question",
  "config": {
    "questionType": "single_select",
    "text": "What is your current pain level?",
    "options": [
      {"value": "mild", "label": "Mild (1-3)", "color": "green"},
      {"value": "moderate", "label": "Moderate (4-6)", "color": "yellow"},
      {"value": "severe", "label": "Severe (7-10)", "color": "red", "triggersUrgent": true}
    ],
    "validation": {
      "required": true,
      "customMessage": "Pain level assessment is required"
    }
  }
}
```

### Information Step
```json
{
  "type": "information",
  "config": {
    "content": "## Understanding Your Treatment\n\nBased on your responses, we recommend...",
    "format": "markdown",
    "media": {
      "type": "video",
      "url": "https://example.com/treatment-video.mp4"
    },
    "continueButton": "I understand and want to proceed"
  }
}
```

### Checkout Step
```json
{
  "type": "checkout",
  "config": {
    "title": "Select Your Treatment Plan",
    "products": [
      {
        "id": "trt_basic",
        "name": "TRT Basic Plan",
        "description": "Monthly testosterone therapy with basic monitoring",
        "price": 19900,
        "recurring": true,
        "features": ["Monthly medication", "Basic labs", "Provider check-ins"]
      }
    ],
    "paymentRequired": true,
    "allowMultiple": false
  }
}
```

### Provider Review Step
```json
{
  "type": "provider_review",
  "config": {
    "priority": "urgent",
    "message": "Patient reports severe symptoms requiring immediate review",
    "autoAssign": true,
    "estimatedReviewTime": "2 hours",
    "requiredActions": ["clinical_review", "contact_patient"]
  }
}
```

## Tech Stack

### Core Technologies
- **Frontend/Backend**: Next.js 14 (App Router, TypeScript)
- **Database**: PostgreSQL with JSONB support
- **ORM**: Prisma (with JSONB field support)
- **Authentication**: Clerk (role-based access)
- **UI Framework**: Tailwind CSS + Shadcn/UI
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: Zustand (for complex flow state)

### New Dependencies
- **Flow Visualization**: React Flow (for assessment builder)
- **Rich Text**: TipTap or similar (for information steps)
- **Payment Processing**: Stripe (for checkout steps)
- **File Handling**: UploadThing or AWS S3
- **Date/Time**: Date-fns for scheduling components

### Development Tools
- **Package Manager**: pnpm
- **Type Safety**: TypeScript strict mode
- **Code Quality**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library
- **API Testing**: Hoppscotch or Postman

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Basic flow system with core step types

**Database Setup**:
- [ ] New Prisma schema with flow models
- [ ] Seed data with example flows
- [ ] Migration from V1 data (optional)

**Core API Routes**:
- [ ] Flow CRUD operations
- [ ] Step management endpoints
- [ ] Flow execution engine
- [ ] Response saving with JSONB

**Basic UI Components**:
- [ ] FlowStep renderer system
- [ ] Basic step types (question, information)
- [ ] Flow execution component

### Phase 2: Assessment Builder (Weeks 3-4)
**Goal**: Visual flow builder for providers

**Flow Builder UI**:
- [ ] Drag-and-drop flow editor (React Flow)
- [ ] Step configuration panels
- [ ] Transition condition builder
- [ ] Flow testing/preview mode

**Step Editors**:
- [ ] Question step configuration
- [ ] Information step editor with rich text
- [ ] Conditional logic builder
- [ ] Step validation system

### Phase 3: Advanced Steps (Weeks 5-6)
**Goal**: Telehealth-specific step types

**Checkout Integration**:
- [ ] Product/service selection
- [ ] Stripe payment integration
- [ ] Order management system

**Provider Features**:
- [ ] Provider review step
- [ ] Urgent flag system
- [ ] Provider dashboard for interventions

**Additional Steps**:
- [ ] Consent form step
- [ ] Appointment scheduling step
- [ ] Lab order step

### Phase 4: Patient Experience (Weeks 7-8)
**Goal**: Optimized patient-facing experience

**Flow Execution**:
- [ ] Dynamic step rendering
- [ ] Progress tracking for non-linear flows
- [ ] Auto-save with JSONB responses
- [ ] Resume functionality

**Mobile Optimization**:
- [ ] Responsive step designs
- [ ] Touch-friendly interactions
- [ ] Offline capability (basic)

## Key Features

### Visual Flow Builder
- Drag-and-drop interface for creating assessment flows
- Real-time preview of patient experience
- Conditional logic builder with visual connections
- Step templates and reusable components

### Dynamic Assessment Engine
- Runtime evaluation of complex conditions
- Smart progress calculation for non-linear flows
- Automatic step validation and error handling
- Real-time flow adaptation based on responses

### Comprehensive Step Types
- **Questions**: All traditional input types with rich validation
- **Information**: Rich content with media support
- **Checkout**: Integrated payment and product selection
- **Provider Review**: Automated provider notification and assignment
- **Consent**: Legal compliance with digital signatures

### Advanced Conditional Logic
- Multi-step dependencies with AND/OR logic
- Numeric comparisons and range checks
- Pattern matching and complex validation
- Time-based conditions and expiration

## Sample Use Cases

### Testosterone Replacement Therapy (TRT) Assessment
```
1. Information Step: "Welcome to TRT Evaluation"
2. Question: Age verification
3. Question Series: Symptoms checklist
4. Conditional Branch:
   - If high symptom score → Lab Order Step
   - If moderate score → Information + Checkout
   - If low score → Information + Exit
5. Provider Review: For complex cases
6. Checkout: Treatment plan selection
7. Information: Next steps and follow-up
```

### Mental Health Screening
```
1. Consent: HIPAA and screening consent
2. Question Series: PHQ-9 questionnaire
3. Conditional Logic:
   - If suicide ideation → Urgent Provider Review
   - If severe depression → Provider Review + Crisis Resources
   - If moderate → Information + Appointment Booking
   - If mild → Information + Self-help Resources
```

### Medication Refill Assessment
```
1. Question: Current medication verification
2. Question: Side effects check
3. Question: Adherence assessment
4. Conditional Branch:
   - If no issues → Automatic Refill
   - If side effects → Provider Review
   - If adherence issues → Information + Provider Review
5. Checkout: Refill confirmation and payment
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm package manager

### Setup Steps

1. **Initialize Project**
```bash
npx create-next-app@latest telehealth-assessments-v2 --typescript --eslint --tailwind --app --src-dir
cd telehealth-assessments-v2
pnpm install
```

2. **Database Setup**
```bash
# Add to .env
DATABASE_URL="postgresql://user:password@localhost:5432/assessments_v2"

# Install Prisma
pnpm add prisma @prisma/client
pnpm add -D @types/node

# Initialize Prisma
npx prisma init
```

3. **Copy Schema**
```bash
# Copy the complete schema from this README to prisma/schema.prisma
npx prisma db push
npx prisma generate
```

4. **Authentication Setup**
```bash
pnpm add @clerk/nextjs
# Add Clerk keys to .env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

5. **UI Components**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input select card tabs dialog
pnpm add react-flow-renderer zustand react-hook-form @hookform/resolvers zod
```

6. **Start Development**
```bash
pnpm dev
```

## Migration from V1

If you want to preserve existing data:

1. **Data Export**: Export assessments and responses from V1
2. **Schema Mapping**: Convert questions to flow steps
3. **Conditional Logic**: Migrate simple dependencies to flow transitions
4. **Response Migration**: Convert answers to step responses with JSONB

Migration script will be provided in `/scripts/migrate-from-v1.ts`

## Success Metrics

- **Provider Efficiency**: Reduce assessment creation time by 60%
- **Patient Experience**: Support complex flows without confusion
- **Platform Flexibility**: Handle diverse telehealth use cases
- **Technical Performance**: Support 100K+ concurrent assessments
- **Developer Experience**: Enable rapid feature development

---

This architecture provides a solid foundation for building a world-class telehealth assessment platform that can adapt to any healthcare workflow while maintaining excellent user experience for both providers and patients.
