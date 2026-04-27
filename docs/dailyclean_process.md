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
| Magic Fix | AI auto-detects orientation AND extracts car details |
| Extract Details | AI extracts details without changing rotation |

## 4. Save Changes
- Click **Save Changes**
- Saves to Firebase Firestore (`ScannedCheckIN` collection)
- Modal closes, table refreshes

## AI Detection
Magic Fix uses Tesseract OCR to:
1. Test 4 rotation angles
2. Find best orientation (prioritizes original photo)
3. Extract: Stock#, Insurance, Make, Model, Year, VIN
4. Auto-fill empty fields only
