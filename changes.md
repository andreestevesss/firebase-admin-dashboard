# Firebase Admin Dashboard - Recent Changes

## Overview
Documentation of all commits pushed to GitHub since the initial implementation.

---

## Commit History

### 2026-04-20

| Commit | Description | Files Modified |
|--------|-------------|-------------|
| `4219a4c` | feat: update users filter by status instead of dates | users/page.tsx, data-service.ts |
| `8f3341f` | feat: update users table layout and simplify actions | users/page.tsx |
| `e64af04` | feat: add user management modal with CRUD operations | user-modal.tsx (new), users/page.tsx |

### 2026-04-18

| Commit | Description | Files Modified |
|--------|-------------|-------------|
| `2405fe4` | fix: simplify filter options to this/last week/month, show all users | user-uploads/page.tsx |
| `47efa68` | feat: add filter dropdown to user-uploads page | user-uploads/page.tsx |
| `d2062ff` | fix: change table header to User Details | user-uploads/page.tsx |
| `9320839` | fix: remove duplicate header keep only User/DailyCleans/SalesPrep/Total | user-uploads/page.tsx |
| `c640885` | fix: remove duplicate header on user uploads page | user-uploads/page.tsx |
| `f22e962` | feat: add Show All button on dashboard user chart with filter support | dashboard/page.tsx, user-uploads/page.tsx |
| `bd33043` | feat: replace arrow icon with building icon in branch chart | dashboard/page.tsx |
| `14b773f` | feat: update icons for D-ID (truck) and Biohazard (alert), show actual logged in user email | dashboard-layout.tsx |
| `0bf1f10` | feat: add branch filter to D-ID and Biohazard pages | data-service.ts, d-id/page.tsx, biohazard/page.tsx |
| `4f0b707` | feat: add D-ID and Biohazard to sidebar menu and create biohazard page | dashboard-layout.tsx, biohazard/page.tsx |
| `88ed708` | fix: apply dark theme to document root for particles background to detect | login/page.tsx |
| `30d7c0a` | feat: add particles background component | particles-bg.tsx (new) |
| `84c08e1` | feat: auto-fill branch from selected user in job creation modal | create-job-modal.tsx |
| `5bf493d` | fix: add Job interface and data service methods for D-ID jobs | data-service.ts |
| `c641c85` | feat: add interactive particles background to login page | login/page.tsx |

---

## Summary of Changes

### 1. Login Page
- Added interactive particles background with hover/click interactions
- Fixed dark mode theme detection (particles colors now change with theme toggle)

### 2. Dashboard Layout
- D-ID menu: uses Truck icon (was Clipboard)
- Biohazard menu: uses AlertTriangle icon (was Clipboard)
- Branch chart badge: uses Building icon (was TrendingUp arrow)
- Shows actual logged-in user email from Firebase auth (was admin@example.com)

### 3. User Uploads Page (New)
- Filter dropdown: This Week, Last Week, This Month, Last Month
- Reads filter from URL parameter (?filter=...)
- Shows ALL users (limit increased to 10,000)
- Removed duplicate "User Details" header
- Table header changed to "User Details"

### 4. D-ID / Biohazard Pages
- Added branch filter to both pages
- Both pages added to sidebar menu

### 5. Create Job Modal
- Branch auto-fills when selecting a user

### 6. User Management (New)
- **User Modal Component**: Complete CRUD interface for user management
- **Add Users**: Click "Add User" button to create new accounts
- **Edit Users**: Click edit button to modify existing user information
- **Form Fields**: Full Name, Email, Role (Admin/Manager/User), Status (Active/Inactive), Branch assignment
- **Integration**: Proper Firestore integration with timestamps
- **Validation**: Form validation and loading states
- **Auto-refresh**: User list updates automatically after changes

### 7. Users Table Layout
- Reordered columns: Name, Email, Branch, Role, Status
- Removed avatar from name column for cleaner look
- Single edit button (removed view button)
- Role displayed as text without icons
- **Filters**: Status filter (All/Active/Inactive) instead of date range
- **Status Source**: Reads from Firestore `isDisabled` field (true = inactive)
- Status badge: green for active, red for inactive

---

## Notes
- All changes have been pushed to GitHub main branch
- Vercel deploys automatically on push
- Update this file after each commit