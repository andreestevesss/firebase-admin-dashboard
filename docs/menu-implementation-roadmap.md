---
title: Menu Implementation Roadmap
layout: page
---

# Roadmap for Adding **D‑ID** and **Biohazard** Menus

## 1. Goal
Create two new navigation menus – **D‑ID** and **Biohazard** – that display a sticker (the current barcode view) and four additional vehicle images. The admin will assign these jobs to users via a `stock number`; the user scans the number in the app, receives a confirmation notification and is allowed to upload *before* and *after* pictures.

## 2. High‑Level Flow

```
Admin → Create Job (stock number, assign user)
   │
   └─> Store in DB (job table + user‑job link)

User App
  ├─> Periodically poll /notifications
  └─> Scan QR → match stock number → receive 'green light' notification

Job UI (D‑ID / Biohazard)
  ├─> Show sticker + 4 vehicle pics
  ├─> After clicking “Complete”, upload before/after pics
  └─> Mark job as done in DB
```

![UX Sketch](https://placeholder.com/ux-demo)
*(Sketch placeholder – replace with real wireframes.)*

## 3. UI/UX Design
1. **Navigation** – Add two new items in the sidebar or top‑bar (depending on current layout). Use `🏷️` icons for consistency.
2. **Menu Page** – Card layout similar to existing vehicle gallery: top card shows *sticker*, below 4 smaller cards show the vehicle moments.
3. **Interactive Elements** –
   * *Scan QR* button that opens the device camera.
   * *Upload* area for before/after photos.
4. **Notification UI** – A banner or toast that appears when a new job is assigned.

### Wireframe sketch (markdown‑text representation)
```text
 ┌───────────────────────┐
 │  [🚓] D‑ID             │
 │  [⚡] Biohazard        │
 └─────┬─────────────────┘
       │
   ┌───────────────────────┐
   │ Sticker (QR / Stock)   │
   ├───────────────────────┤
   │ 4 Vehicle Images Grid  │
   └───────────────────────┘
   Press 'Scan QR' → matches job → green light
```

## 4. Data Model (Open‑API / Prisma adjustments)
| Table | Fields | Notes |
|-------|--------|-------|
| `job` | id, type (`d-id`/`biohazard`), stock_number, status (`pending`,`active`,`completed`) | New table; `type` only for UI filtering |
| `user_job` | id, user_id, job_id | Many‑to‑many link; admin assigns jobs |
| `job_photo` | id, job_id, before_url, after_url, created_at | Stores uploaded image URLs |

If using Prisma in `schema.prisma`, add:
```prisma
model Job {
  id          Int       @id @default(autoincrement())
  type        JobType
  stockNumber String
  status      JobStatus
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  photos      JobPhoto[]
  users       User[]    @relation("UserJob", through: UserJob)
}

enum JobType { D_ID BIOHAZARD }
enum JobStatus { PENDING ACTIVE COMPLETED }
```

## 5. API Endpoints (Next.js API routes)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/jobs` | Admin creates job → returns `stockNumber`, `jobId` |
| POST | `/api/jobs/assign` | Admin assigns user to job |
| GET | `/api/jobs/:jobId/stock` | User fetches job by scanning stock number |
| POST | `/api/jobs/:jobId/photos` | Upload before/after photos |
| GET | `/api/jobs/notification` | Poll for new jobs (WebSocket optional) |

## 6. Frontend Components
- `MenuLayout.tsx` – Wrapper for D‑ID/Biohazard sections.
- `StickerCard.tsx` – Displays QR + stock number.
- `VehicleCard.tsx` – Reusable component for vehicle images.
- `ScannerModal.tsx` – Uses `react-webcam` or `expo-camera` to scan QR.
- `PhotoUploader.tsx` – Handles two‑step upload (before/after).
- `NotificationToast.tsx` – Shows assignment alerts.

## 7. Flow Implementation Steps
1. **Add routes** – Create the API files in `src/app/api/jobs/`.
2. **Extend DB** – Run Prisma migration.
3. **UI skeleton** – Add navigation entries, scaffold pages.
4. **Sticker & images** – Pull current sticker logic; duplicate for new pages.
5. **Scan functionality** – Integrate QR scanner; compare stock number to DB.
6. **Notification system** – Use SWR or React Query polling for job assignments.
7. **Photo upload** – Implement S3/Cloudinary endpoint; update `job_photo`.
8. **Testing** – Unit tests for API; Cypress end‑to‑end for job flow.
9. **Deployment** – Deploy to Firebase Functions & Cloud Storage.

## 8. Acceptance Criteria
- Admin can create a job via API with stock number.
- Admin can assign job to a user.
- User scanning the QR displays a green‑light banner.
- User can upload before/after pictures and mark job complete.
- All UI components are responsive and match existing design language.
- No existing menu flows break.

## 9. Optional Enhancements
- Use Firebase Cloud Messaging for push notifications.
- Add a status badge in the user's dashboard.
- Analytics for job completion time.

## Next Steps
1. Draft the Prisma schema changes.
2. Create the API route skeletons.
3. Add navigation entries in `sideBar.tsx`.
4. Build `StickerCard` and test rendering.
5. Proceed incrementally with testing after each step.
