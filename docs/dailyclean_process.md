# Daily Cleans Process

## Overview
The Daily Cleans feature tracks vehicle clean records across branches.

## 1. View Records
- Navigate to `/dashboard/daily-cleans`
- Filter by **Branch** and **Date Range** (Today, Yesterday, This Week, This Month, etc.)
- Table displays: Branch, Picture, Insurance, Make, Model, Year, Stock#, User, VIN, Day Added

## 2. Edit a Record
- Click the **Edit (pencil)** icon on any row
- Opens modal with: vehicle photo (left) + editable form (right)

## 3. Edit Options
| Button | Function |
|--------|----------|
| Rotate | Manually rotate image 90° |
| Magic Fix | AI auto-detects orientation (runs automatically on open) |

The **AI Scanner Line** animates across the image while Magic Fix is running.

## 4. Save Changes
- Click **Save Changes**
- Saves to Firebase Firestore (`ScannedCheckIN` collection)
- Modal closes, table refreshes
