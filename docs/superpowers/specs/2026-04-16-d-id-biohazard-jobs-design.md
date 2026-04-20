# D-ID and Biohazard Jobs Feature Design

## Overview

Create two new navigation menus (D-ID and Biohazard) for job management in the admin dashboard. Jobs allow admins to assign tasks to users who then scan a stock number and upload before/after photos.

## Firestore Schema

Single collection: `jobs`

```
jobs/
  {jobId}/
    // Type identifier
    - type: "d-id" | "biohazard"
    
    // Vehicle info (same as daily-cleans)
    - branch: string
    - insurance: string
    - make: string
    - model: string
    - year: string
    - stockNumber: string
    - vin: string
    - picture: string (vehicle thumbnail URL)
    
    // Job management
    - status: "pending" | "active" | "completed"
    - assignedUserId: string (Firestore user document ID)
    - assignedUserName: string
    - createdAt: timestamp
    - createdBy: string (admin user ID)
    
    // Photos storage (URLs from uploaded images)
    - photos: {
        beforeUrl1: string
        beforeUrl2: string
        beforeUrl3: string
        beforeUrl4: string (D-ID only)
        afterUrl1: string
        afterUrl2: string
        afterUrl3: string
        afterUrl4: string (D-ID only)
      }
```

## Photo Requirements

| Job Type | Before Photos | After Photos | Total |
|---------|-------------|-------------|-------|
| D-ID | 4 | 4 | 8 |
| Biohazard | 3 | 3 | 6 |

## Phase A: Admin Side (This Implementation)

### Sidebar Navigation

Add to `dashboard-layout.tsx`:
```tsx
{ id: 'd-id', label: 'D-ID', icon: Clipboard, href: '/dashboard/d-id' }
{ id: 'biohazard', label: 'Biohazard', icon: Clipboard, href: '/dashboard/biohazard' }
```

- Use same Clipboard icon as Sales Prep
- Active state: green accent (`bg-green-100 text-green-700`)

### Pages

- `/app/dashboard/d-id/page.tsx`
- `/app/dashboard/biohazard/page.tsx`

### Data Service

Add to `data-service.ts`:

```typescript
export interface Job {
  id: string;
  type: 'd-id' | 'biohazard';
  // Vehicle info (optional - can be filled later)
  branch?: string;
  insurance?: string;
  make?: string;
  model?: string;
  year?: string;
  stockNumber: string;
  vin?: string;
  picture?: string;
  // Job management
  status: 'pending' | 'active' | 'completed';
  assignedUserId: string | null;
  assignedUserName: string;
  createdAt: Date;
  createdBy: string;
  // Photos
  beforeUrl1?: string;
  beforeUrl2?: string;
  beforeUrl3?: string;
  beforeUrl4?: string;
  afterUrl1?: string;
  afterUrl2?: string;
  afterUrl3?: string;
  afterUrl4?: string;
}

getJobs(filters: {
  type: 'd-id' | 'biohazard';
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Job[]; total: number; page: number; totalPages: number }>

createJob(data: { type: 'd-id' | 'biohazard'; stockNumber: string; vehicleInfo?: {...}): Promise<string>
updateJob(id: string, data: Partial<Job>): Promise<void>
assignJob(jobId: string, userId: string): Promise<void>
```

### UI Components

1. **JobListCard** - Shows jobs in table (same pattern as daily-cleans)
2. **CreateJobModal** - Form to create new job
   - **Required:**
     - Type: Dropdown [D-ID | Biohazard]
     - Stock Number: Input
   - **Optional (expandable):**
     - Branch, Insurance, Make, Model, Year, VIN, Picture URL
   - User assignment dropdown (optional)
3. **JobDetailModal** - View job details with photo slots

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/jobs?type=d-id\|biohazard` | List jobs by type |
| POST | `/api/jobs` | Create job |
| PATCH | `/api/jobs/[id]` | Update job |
| POST | `/api/jobs/[id]/assign` | Assign user to job |

## Style Guidelines

Follow existing patterns:
- Colors: Primary gray (#0a0a0a dark), accent green (#22c55e)
- Components: Use existing shadcn/ui (Card, Button, Table, Badge)
- Dark mode: Full support
- Spacing: Same as daily-cleans (p-4, gap-4)

## Phase B (Later)

- User notification menu showing assigned jobs
- User scan stock number to access job
- Photo upload interface

## Phase C (Later)

- QR scanner integration
- Real-time notifications

## Acceptance Criteria

- [ ] Sidebar shows D-ID and Biohazard menu items
- [ ] Admin can create job with all vehicle fields
- [ ] Admin can view job list with filters
- [ ] Admin can assign job to user
- [ ] Admin can view job details with photo status
- [ ] Table matches existing daily-cleans styling