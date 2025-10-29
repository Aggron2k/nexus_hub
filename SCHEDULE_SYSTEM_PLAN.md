# Schedule Management System - Implementation Plan

## Document Information
- **Created:** 2025-10-29
- **Last Updated:** 2025-10-29
- **Status:** Draft / Planning Phase
- **Version:** 1.0

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Design](#database-design)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Workflow Diagrams](#workflow-diagrams)
5. [UI/UX Design](#uiux-design)
6. [API Endpoints](#api-endpoints)
7. [Validation Rules](#validation-rules)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Testing Strategy](#testing-strategy)

---

## 1. System Overview

### Purpose
A comprehensive schedule management system where:
- **Employees** can submit shift requests and time-off requests
- **Managers** have the same rights as employees + can view all schedules
- **General Managers & CEOs** can review requests, create shifts, publish schedules, and track actual work hours

### Key Features
1. **Shift Request System** - Employees request shifts 1+ weeks in advance
2. **Request Deadline** - Requests close on Friday before the scheduled week
3. **Three-Tier Display** - Request → Planned Shift → Actual Hours
4. **Time Off Management** - Request and approve time off
5. **Work Hour Tracking** - Compare requested, planned, and actual hours vs. weekly requirement
6. **Overlap Prevention** - Users cannot work two shifts simultaneously

### Current vs. New System

| Feature | Current | New |
|---------|---------|-----|
| Shift Creation | GM/CEO only | GM/CEO creates, but based on Employee requests |
| Employee Input | None | Can request shifts, time off, availability |
| Calendar View | 1 row per user | 3 rows per user (request, planned, actual) |
| Time Tracking | Only planned | Planned + actual with status (present/sick/absent) |
| Publishing | isPublished flag | Same, but with request workflow |

---

## 2. Database Design

### 2.1 New Models

#### ShiftRequest Model
```prisma
model ShiftRequest {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId

  // Relationships
  weekScheduleId  String   @db.ObjectId
  weekSchedule    WeekSchedule @relation(fields: [weekScheduleId], references: [id], onDelete: Cascade)

  userId          String   @db.ObjectId
  user            User     @relation("ShiftRequests", fields: [userId], references: [id])

  // Request Type
  type            ShiftRequestType
  // SPECIFIC_TIME: Employee requests specific hours (e.g., 8:00-16:00)
  // AVAILABLE: Employee is available all day (manager decides time)
  // TIME_OFF: Employee requests time off (no work that day)

  // Date and Time
  date            DateTime         // Which day
  startTime       DateTime?        // null if AVAILABLE or TIME_OFF
  endTime         DateTime?        // null if AVAILABLE or TIME_OFF

  // Status
  status          ShiftRequestStatus @default(PENDING)

  // Approval/Rejection
  shiftId         String?  @db.ObjectId
  shift           Shift?   @relation(fields: [shiftId], references: [id])

  reviewedBy      String?  @db.ObjectId
  reviewedByUser  User?    @relation("ReviewedRequests", fields: [reviewedBy], references: [id])
  reviewedAt      DateTime?
  rejectionReason String?

  // Employee notes
  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([weekScheduleId])
  @@index([userId])
  @@index([date])
  @@index([status])
  @@unique([userId, date]) // One request per user per day
}

enum ShiftRequestType {
  SPECIFIC_TIME // Concrete time slot (e.g., Monday 8:00-16:00)
  AVAILABLE     // Available all day (manager decides)
  TIME_OFF      // Time off / unavailable
}

enum ShiftRequestStatus {
  PENDING   // Waiting for approval
  APPROVED  // Approved by GM/CEO
  REJECTED  // Rejected by GM/CEO
}
```

#### WeekSchedule Modifications
```prisma
model WeekSchedule {
  // ... existing fields ...

  // NEW: Request submission deadline
  requestDeadline DateTime? // Friday before the week (e.g., Oct 31 for Nov 3-9)

  // NEW: Relationship to requests
  shiftRequests   ShiftRequest[]

  // Existing
  shifts          Shift[]
  isPublished     Boolean @default(false)
}
```

#### Shift Modifications
```prisma
model Shift {
  // ... existing fields ...

  // NEW: Actual work hours tracking
  actualStartTime DateTime?
  actualEndTime   DateTime?
  actualStatus    ActualWorkStatus? // PRESENT, SICK, ABSENT

  // NEW: Relationship to request
  shiftRequests   ShiftRequest[]
}

enum ActualWorkStatus {
  PRESENT  // Employee was present and worked
  SICK     // Employee was sick
  ABSENT   // Employee was absent (unexcused)
}
```

#### User Modifications
```prisma
model User {
  // ... existing fields ...

  // NEW: Shift request relationships
  shiftRequests      ShiftRequest[] @relation("ShiftRequests")
  reviewedRequests   ShiftRequest[] @relation("ReviewedRequests")
}
```

### 2.2 Database Migration Strategy

1. Create new enums: `ShiftRequestType`, `ShiftRequestStatus`, `ActualWorkStatus`
2. Create new model: `ShiftRequest`
3. Add fields to existing models: `WeekSchedule`, `Shift`, `User`
4. Run Prisma migration: `npx prisma migrate dev --name add-shift-request-system`
5. Generate Prisma client: `npx prisma generate`

---

## 3. User Roles & Permissions

### 3.1 Employee

**Can:**
- Submit shift requests (SPECIFIC_TIME, AVAILABLE, TIME_OFF)
- Modify/delete own requests (before deadline)
- View own requests and their status
- View published schedules (own shifts only)
- See work hour summary (requested vs. weekly requirement)

**Cannot:**
- Choose position (only time)
- View other employees' requests
- Approve/reject requests
- Create shifts
- View unpublished schedules

### 3.2 Manager

**Can:**
- Everything Employee can do
- View all employees' published schedules
- View all shift requests (read-only)

**Cannot:**
- Approve/reject requests
- Create/modify shifts
- Publish schedules

### 3.3 General Manager & CEO

**Can:**
- Everything Manager can do
- Create week schedules
- View all shift requests in calendar (3-row view)
- Approve/reject shift requests
- Create shifts (manual or from approved requests)
- Assign positions to shifts
- Publish/unpublish schedules
- Record actual work hours
- Mark employees as present/sick/absent

**Cannot:**
- Submit shift requests on behalf of employees (they must request themselves)

---

## 4. Workflow Diagrams

### 4.1 Request Submission Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPLOYEE WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

1. GM/CEO creates WeekSchedule
   ↓
   weekScheduleId: "abc123"
   weekStart: Nov 3, 2025
   weekEnd: Nov 9, 2025
   requestDeadline: Oct 31, 2025 23:59
   isPublished: false

2. Employee navigates to "My Requests" page
   ↓
   Sees: Nov 3-9 week (deadline: Oct 31)
   Status: "Open for requests"

3. Employee clicks on Monday, Nov 3
   ↓
   Modal opens with options:
   [ ] Specific Time: 8:00 - 16:00
   [ ] Available All Day
   [ ] Time Off
   Notes: [optional message]

4. Employee submits request
   ↓
   ShiftRequest created:
   - userId: employee ID
   - date: Nov 3
   - type: SPECIFIC_TIME
   - startTime: 8:00
   - endTime: 16:00
   - status: PENDING

5. Employee sees hour summary
   ↓
   Weekly requirement: 40 hours
   Requested this week: 8 hours (Monday only)
   ⚠️ Warning: 32 hours short!

6. Deadline passes (Nov 1, 00:00)
   ↓
   Employee can no longer modify/delete requests
```

### 4.2 Request Review Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   GM/CEO WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘

1. GM/CEO opens week schedule (Nov 3-9)
   ↓
   Calendar displays 3 rows per employee:

   Nagy Anna
   ┌────────────────────────────────────────┐
   │ Row 1: 🟦 Request: 8:00-16:00 (PENDING)│ ← ShiftRequest
   ├────────────────────────────────────────┤
   │ Row 2: (empty)                         │ ← Shift (not created yet)
   ├────────────────────────────────────────┤
   │ Row 3: (empty)                         │ ← Actual hours (future)
   └────────────────────────────────────────┘

2. GM/CEO clicks on Row 1 (request)
   ↓
   Modal opens:
   "Nagy Anna requests Monday 8:00-16:00"
   Notes: "I can work storage or cashier"

   [Approve] [Reject]

3a. GM/CEO clicks "Approve"
    ↓
    Position selection modal:
    "Assign position to Nagy Anna (Mon 8:00-16:00)"
    Position: [Storage ▼]

    [Create Shift]

    ↓
    Shift created:
    - userId: Nagy Anna
    - positionId: Storage
    - date: Nov 3
    - startTime: 8:00
    - endTime: 16:00

    ShiftRequest updated:
    - status: APPROVED
    - shiftId: (linked to new shift)
    - reviewedBy: GM/CEO ID
    - reviewedAt: now

    ↓
    Calendar updates:
    Nagy Anna
    ┌────────────────────────────────────────┐
    │ Row 1: 🟩 Request: 8:00-16:00 (APPROVED)│ ← Green border
    ├────────────────────────────────────────┤
    │ Row 2: 🔵 Storage: 8:00-16:00          │ ← Shift created (blue = storage color)
    └────────────────────────────────────────┘

3b. GM/CEO clicks "Reject"
    ↓
    Rejection reason modal:
    Reason: [We need you on Tuesday instead]

    [Reject Request]

    ↓
    ShiftRequest updated:
    - status: REJECTED
    - rejectionReason: "We need you on Tuesday instead"
    - reviewedBy: GM/CEO ID
    - reviewedAt: now

    ↓
    Calendar updates:
    Nagy Anna
    ┌────────────────────────────────────────┐
    │ Row 1: 🔴 Request: 8:00-16:00 (REJECTED)│ ← Red color
    └────────────────────────────────────────┘

4. GM/CEO publishes schedule
   ↓
   WeekSchedule.isPublished = true

   ↓
   Employees can now view their shifts
```

### 4.3 Time Off Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    TIME OFF WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Employee requests Time Off for Monday
   ↓
   ShiftRequest created:
   - type: TIME_OFF
   - date: Nov 3
   - startTime: null
   - endTime: null
   - status: PENDING

2. GM/CEO reviews
   ↓
   Modal: "Nagy Anna requests TIME OFF on Monday"
   [Approve] [Reject]

3a. Approved
    ↓
    ShiftRequest.status = APPROVED
    NO Shift is created (time off means no work)

    Validation added:
    - Cannot create Shift for Nagy Anna on Nov 3
    - Calendar shows: "TIME OFF (Approved)"

3b. Rejected
    ↓
    ShiftRequest.status = REJECTED
    GM/CEO can create shift for that day
```

### 4.4 Actual Work Hours Workflow

```
┌─────────────────────────────────────────────────────────────┐
│               ACTUAL HOURS TRACKING WORKFLOW                 │
└─────────────────────────────────────────────────────────────┘

SCENARIO: Nagy Anna has shift Monday 8:00-16:00

1. During shift (8:00 - 16:00)
   ↓
   Current time: 10:30 AM
   GM/CEO CANNOT record actual hours yet
   Modal shows: "⏰ Shift is still in progress"

2. After shift ends (16:00+)
   ↓
   Current time: 4:05 PM
   GM/CEO clicks on Row 2 (Shift)

   Modal opens:
   "Record actual hours for Nagy Anna (Monday)"

   Status:
   ( ) Present - worked as scheduled
   ( ) Sick - was sick, did not work
   ( ) Absent - did not show up

   [If Present selected:]
   Actual Start: [08:15] (can modify)
   Actual End:   [15:45] (can modify)

   [Save]

3a. If PRESENT
    ↓
    Shift updated:
    - actualStartTime: 8:15
    - actualEndTime: 15:45
    - actualStatus: PRESENT

    Calendar updates:
    Nagy Anna
    ┌────────────────────────────────────────┐
    │ Row 2: 🔵 Storage: 8:00-16:00          │ ← Planned
    ├────────────────────────────────────────┤
    │ Row 3: ⬛ Worked: 8:15-15:45 (7.5h)    │ ← Actual (dark gray)
    └────────────────────────────────────────┘

3b. If SICK
    ↓
    Shift updated:
    - actualStartTime: null
    - actualEndTime: null
    - actualStatus: SICK

    Calendar updates:
    Nagy Anna
    ┌────────────────────────────────────────┐
    │ Row 3: 🟡 SICK                         │ ← Yellow indicator
    └────────────────────────────────────────┘

3c. If ABSENT
    ↓
    Shift updated:
    - actualStartTime: null
    - actualEndTime: null
    - actualStatus: ABSENT

    Calendar updates:
    Nagy Anna
    ┌────────────────────────────────────────┐
    │ Row 3: 🔴 ABSENT                       │ ← Red indicator
    └────────────────────────────────────────┘
```

---

## 5. UI/UX Design

### 5.1 Employee: Request Submission Page

**URL:** `/schedule/requests`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│                        My Shift Requests                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Week Selector: [< Nov 3-9, 2025 >]                         │
│  Deadline: Oct 31, 2025 23:59  Status: 🟢 Open              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Mon   Tue   Wed   Thu   Fri   Sat   Sun     │   │
│  │  Nov 3    [+]   [+]   [+]   [+]   [+]   [+]   [+]   │   │
│  │           8-16                                        │   │
│  │          PENDING                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Hour Summary:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Weekly Requirement: 40 hours                         │   │
│  │ ────────────────────────────────────────────────    │   │
│  │ Requested this week: 8 hours                         │   │
│  │ ⚠️ Warning: You are 32 hours short!                 │   │
│  │                                                       │   │
│  │ Progress: ████░░░░░░░░░░░ 20%                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  My Requests:                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Monday, Nov 3                                         │   │
│  │ 🟦 8:00 - 16:00  (PENDING)                           │   │
│  │ Notes: Can work storage or cashier                   │   │
│  │ [Edit] [Delete]                                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Tuesday, Nov 4                                        │   │
│  │ 🟩 TIME OFF  (APPROVED)                              │   │
│  │ Reviewed by: John CEO                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Request Modal (Click on [+]):**
```
┌──────────────────────────────────────────┐
│  Request Shift - Monday, Nov 3           │
├──────────────────────────────────────────┤
│                                           │
│  Request Type:                            │
│  ( ) Specific Time                        │
│      Start: [08:00]  End: [16:00]        │
│                                           │
│  ( ) Available All Day                    │
│      "I'm available anytime"              │
│                                           │
│  ( ) Time Off                             │
│      "I need this day off"                │
│                                           │
│  Notes (optional):                        │
│  ┌────────────────────────────────────┐ │
│  │ I prefer morning shifts            │ │
│  └────────────────────────────────────┘ │
│                                           │
│  [Cancel]  [Submit Request]              │
└──────────────────────────────────────────┘
```

### 5.2 Employee: My Published Schedules

**URL:** `/schedule/my-schedule`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│                        My Schedule                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Week: [< Nov 3-9, 2025 >]                                   │
│  Status: 📢 Published                                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Mon   Tue   Wed   Thu   Fri   Sat   Sun     │   │
│  │          ──────────────────────────────────────────  │   │
│  │  Planned 🔵    🟢                                     │   │
│  │          Stor  Cash                                   │   │
│  │          8-16  10-18                                  │   │
│  │                                                       │   │
│  │  Actual  ⬛                                            │   │
│  │          8:15  (Not yet)                              │   │
│  │          15:45                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Work Summary:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Planned hours this week: 16 hours                    │   │
│  │ Actually worked: 7.5 hours (Monday)                  │   │
│  │ Remaining shifts: Tuesday                             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 GM/CEO: Three-Row Schedule Calendar

**URL:** `/schedule/[scheduleId]` (existing, enhanced)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Week Nov 3-9, 2025  [Publish Schedule]                      │
│  Request Deadline: Oct 31, 2025 (closed)                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  DayPilot Scheduler:                                          │
│                                                               │
│  Nagy Anna                                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │ ROW 1 (Requests):                                   │     │
│  │ 🟦 8:00-16:00 (PENDING) │ 🟩 TIME OFF (APPROVED)   │     │
│  │      Monday                    Tuesday               │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ ROW 2 (Planned Shifts):                             │     │
│  │ 🔵 Storage: 8:00-16:00  │ (no shift)               │     │
│  │      Monday                   Tuesday                │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ ROW 3 (Actual Hours):                               │     │
│  │ ⬛ 8:15-15:45 PRESENT    │ (future)                 │     │
│  │      Monday                  Tuesday                 │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Márk Kovács                                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │ ROW 1: 🔴 10:00-14:00 (REJECTED)                    │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ ROW 2: 🟢 Kitchen: 6:00-14:00                       │     │
│  ├────────────────────────────────────────────────────┤     │
│  │ ROW 3: 🟡 SICK                                       │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

**Color Legend:**
- **Row 1 (Requests):**
  - 🟦 Light Gray: PENDING
  - 🟩 Green border: APPROVED
  - 🔴 Red: REJECTED
  - 🟠 Orange: TIME_OFF (special)

- **Row 2 (Planned Shifts):**
  - Position color (e.g., 🔵 Blue for Storage, 🟢 Green for Cashier)

- **Row 3 (Actual Hours):**
  - ⬛ Dark Gray: PRESENT (with times)
  - 🟡 Yellow: SICK
  - 🔴 Red: ABSENT

### 5.4 GM/CEO: Request Review Modal

**Triggered by:** Click on Row 1 (request)

**Layout:**
```
┌──────────────────────────────────────────┐
│  Shift Request Review                     │
├──────────────────────────────────────────┤
│                                           │
│  Employee: Nagy Anna                      │
│  Date: Monday, November 3, 2025           │
│  Type: Specific Time                      │
│  Requested Hours: 8:00 - 16:00            │
│                                           │
│  Employee Notes:                          │
│  ┌────────────────────────────────────┐ │
│  │ I can work storage or cashier.     │ │
│  │ Prefer morning shifts.             │ │
│  └────────────────────────────────────┘ │
│                                           │
│  Status: PENDING                          │
│  Submitted: Oct 28, 2025 14:30           │
│                                           │
│  ─────────────────────────────────────── │
│                                           │
│  [Reject Request]  [Approve & Assign]    │
└──────────────────────────────────────────┘
```

**If "Approve & Assign" clicked:**
```
┌──────────────────────────────────────────┐
│  Assign Position to Shift                 │
├──────────────────────────────────────────┤
│                                           │
│  Employee: Nagy Anna                      │
│  Date: Monday, Nov 3, 2025                │
│  Time: 8:00 - 16:00                       │
│                                           │
│  Available Positions (Nagy Anna):         │
│  ( ) Storage                              │
│  ( ) Cashier                              │
│                                           │
│  Adjust Time (optional):                  │
│  Start: [08:00]  End: [16:00]            │
│                                           │
│  Notes:                                   │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                           │
│  [Cancel]  [Create Shift]                │
└──────────────────────────────────────────┘
```

**If "Reject Request" clicked:**
```
┌──────────────────────────────────────────┐
│  Reject Shift Request                     │
├──────────────────────────────────────────┤
│                                           │
│  Employee: Nagy Anna                      │
│  Date: Monday, Nov 3, 2025                │
│  Requested: 8:00 - 16:00                  │
│                                           │
│  Reason for rejection:                    │
│  ┌────────────────────────────────────┐ │
│  │ We need you on Tuesday instead.   │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                           │
│  [Cancel]  [Reject Request]              │
└──────────────────────────────────────────┘
```

### 5.5 GM/CEO: Actual Hours Recording Modal

**Triggered by:** Click on Row 2 (shift), after shift end time

**Layout:**
```
┌──────────────────────────────────────────┐
│  Record Actual Work Hours                 │
├──────────────────────────────────────────┤
│                                           │
│  Employee: Nagy Anna                      │
│  Position: Storage                        │
│  Date: Monday, Nov 3, 2025                │
│                                           │
│  Planned Time: 8:00 - 16:00 (8 hours)    │
│                                           │
│  ─────────────────────────────────────── │
│                                           │
│  Actual Status:                           │
│  ( ) Present - Employee worked            │
│  ( ) Sick - Employee was sick             │
│  ( ) Absent - Employee did not show up    │
│                                           │
│  [If Present selected:]                   │
│                                           │
│  Actual Time:                             │
│  Start: [08:15]  End: [15:45]            │
│                                           │
│  Total: 7.5 hours                         │
│  Difference: -0.5 hours vs. planned       │
│                                           │
│  Notes:                                   │
│  ┌────────────────────────────────────┐ │
│  │ Left early due to low traffic      │ │
│  └────────────────────────────────────┘ │
│                                           │
│  [Cancel]  [Save Actual Hours]           │
└──────────────────────────────────────────┘
```

**Validation:**
- If current time < shift end time: "⏰ Cannot record hours until shift ends"
- If actualStartTime >= actualEndTime: "Invalid time range"
- If SICK or ABSENT selected: No time input needed

---

## 6. API Endpoints

### 6.1 Shift Request Endpoints

#### `POST /api/shift-requests`
**Description:** Create a new shift request (Employee)

**Body:**
```json
{
  "weekScheduleId": "abc123",
  "date": "2025-11-03T00:00:00.000Z",
  "type": "SPECIFIC_TIME", // or "AVAILABLE" or "TIME_OFF"
  "startTime": "2025-11-03T08:00:00.000Z", // null if not SPECIFIC_TIME
  "endTime": "2025-11-03T16:00:00.000Z",   // null if not SPECIFIC_TIME
  "notes": "I prefer storage or cashier"
}
```

**Response:** `201 Created`
```json
{
  "id": "req123",
  "userId": "user123",
  "weekScheduleId": "abc123",
  "date": "2025-11-03T00:00:00.000Z",
  "type": "SPECIFIC_TIME",
  "startTime": "2025-11-03T08:00:00.000Z",
  "endTime": "2025-11-03T16:00:00.000Z",
  "status": "PENDING",
  "notes": "I prefer storage or cashier",
  "createdAt": "2025-10-28T14:30:00.000Z"
}
```

**Validations:**
- User must be authenticated
- `requestDeadline` must not have passed
- User cannot have another request for the same date
- If `type === SPECIFIC_TIME`: `startTime` and `endTime` required
- If `type !== SPECIFIC_TIME`: `startTime` and `endTime` must be null
- `startTime` < `endTime`

---

#### `GET /api/shift-requests?weekScheduleId={id}`
**Description:** Get all shift requests for a week

**Query Params:**
- `weekScheduleId` (required): Week schedule ID
- `userId` (optional): Filter by user (Employee sees own, GM/CEO sees all)
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)

**Response:** `200 OK`
```json
[
  {
    "id": "req123",
    "userId": "user123",
    "user": {
      "id": "user123",
      "name": "Nagy Anna",
      "email": "anna@example.com"
    },
    "date": "2025-11-03T00:00:00.000Z",
    "type": "SPECIFIC_TIME",
    "startTime": "2025-11-03T08:00:00.000Z",
    "endTime": "2025-11-03T16:00:00.000Z",
    "status": "PENDING",
    "notes": "I prefer storage or cashier"
  }
]
```

---

#### `PATCH /api/shift-requests/[requestId]`
**Description:** Update a shift request (Employee) or review a request (GM/CEO)

**Employee Update (before deadline):**
```json
{
  "startTime": "2025-11-03T09:00:00.000Z",
  "endTime": "2025-11-03T17:00:00.000Z",
  "notes": "Changed to afternoon"
}
```

**GM/CEO Approval:**
```json
{
  "action": "approve",
  "shiftData": {
    "positionId": "pos123",
    "startTime": "2025-11-03T08:00:00.000Z", // Can adjust
    "endTime": "2025-11-03T16:00:00.000Z"
  }
}
```

**GM/CEO Rejection:**
```json
{
  "action": "reject",
  "rejectionReason": "We need you on Tuesday instead"
}
```

**Response:** `200 OK`
```json
{
  "id": "req123",
  "status": "APPROVED",
  "shiftId": "shift123",
  "reviewedBy": "ceo123",
  "reviewedAt": "2025-10-29T10:00:00.000Z"
}
```

**Validations:**
- Employee: Can only update own requests before deadline
- Employee: Cannot change status (only notes/time)
- GM/CEO: Can approve/reject any request
- Approval: Must provide `positionId` and shift times
- Approval: Creates Shift record automatically
- Rejection: Must provide `rejectionReason`

---

#### `DELETE /api/shift-requests/[requestId]`
**Description:** Delete (withdraw) a shift request (Employee only, before deadline)

**Response:** `200 OK`
```json
{
  "message": "Request withdrawn successfully"
}
```

**Validations:**
- User must own the request
- `requestDeadline` must not have passed
- Request must be PENDING (cannot delete APPROVED/REJECTED)
- HARD DELETE (permanently removed from database)

---

### 6.2 Week Schedule Endpoints (Enhanced)

#### `POST /api/schedule` (existing, enhanced)
**Description:** Create a new week schedule (GM/CEO)

**Body:**
```json
{
  "weekStart": "2025-11-03T00:00:00.000Z",
  "weekEnd": "2025-11-09T23:59:59.999Z",
  "requestDeadline": "2025-10-31T23:59:59.999Z" // NEW field
}
```

**Response:** `201 Created`

**Validations:**
- `requestDeadline` must be before `weekStart`
- Typically: `requestDeadline` = Friday before `weekStart`

---

#### `GET /api/schedule?published=true` (existing, enhanced)
**Description:** Get published schedules (Employee view)

**Response:** Shows only weeks with `isPublished: true`

---

### 6.3 Shift Endpoints (Enhanced)

#### `POST /api/shifts` (existing, enhanced)
**Description:** Create a shift (GM/CEO)

**Additional Validation:**
- Check if user has APPROVED TIME_OFF on that date
- If yes: Return `409 Conflict` with message "User has approved time off"

---

#### `PATCH /api/shifts/[shiftId]` (existing, enhanced)
**Description:** Update shift or record actual hours (GM/CEO)

**Body (Actual Hours):**
```json
{
  "actualStartTime": "2025-11-03T08:15:00.000Z",
  "actualEndTime": "2025-11-03T15:45:00.000Z",
  "actualStatus": "PRESENT" // or "SICK" or "ABSENT"
}
```

**Validations:**
- Cannot record actual hours before shift end time
- If `actualStatus === "SICK"` or `"ABSENT"`: `actualStartTime` and `actualEndTime` must be null
- If `actualStatus === "PRESENT"`: `actualStartTime` and `actualEndTime` required

---

### 6.4 Work Hour Summary Endpoint (NEW)

#### `GET /api/work-hours/summary?userId={id}&weekScheduleId={id}`
**Description:** Get work hour summary for a user in a week

**Response:** `200 OK`
```json
{
  "userId": "user123",
  "weekScheduleId": "abc123",
  "weeklyRequirement": 40, // From user.weeklyWorkHours
  "requested": {
    "hours": 35,
    "count": 5 // Number of requests
  },
  "planned": {
    "hours": 32,
    "count": 4 // Number of shifts
  },
  "actual": {
    "hours": 7.5,
    "count": 1, // Number of completed shifts
    "present": 1,
    "sick": 0,
    "absent": 0
  },
  "warnings": [
    "You requested 5 hours less than your weekly requirement",
    "You have not requested shifts for Wednesday, Thursday"
  ]
}
```

---

## 7. Validation Rules

### 7.1 Request Submission (Employee)

| Rule | Description | Error Message |
|------|-------------|---------------|
| Deadline | Request must be before `requestDeadline` | "Request deadline has passed (Oct 31)" |
| Unique | One request per user per day | "You already have a request for this day" |
| Time Logic | `startTime` < `endTime` | "End time must be after start time" |
| Time Required | If SPECIFIC_TIME: times required | "Please specify start and end time" |
| Time Forbidden | If not SPECIFIC_TIME: times must be null | "Times not allowed for this request type" |
| Future | Date must be in the future | "Cannot request shifts for past dates" |
| Overlap | Cannot request if already has shift that day | "You already have a shift on this day" |

### 7.2 Request Review (GM/CEO)

| Rule | Description | Error Message |
|------|-------------|---------------|
| Authorization | Only GM/CEO can review | "Unauthorized" (403) |
| Status | Can only review PENDING requests | "Request already reviewed" |
| Position Required | Approval must include position | "Please select a position" |
| Position Valid | Position must be in user's `userPositions` | "User is not assigned to this position" |
| Time Off Conflict | Cannot create shift if APPROVED TIME_OFF exists | "User has approved time off on this date" |
| Reason Required | Rejection must include reason | "Please provide a rejection reason" |

### 7.3 Shift Creation (GM/CEO)

| Rule | Description | Error Message |
|------|-------------|---------------|
| Time Off Check | Cannot create if user has APPROVED TIME_OFF | "User has approved time off on this date" |
| Overlap | Cannot overlap with existing shifts | "User already has a shift at this time" |
| Active User | User must have `employmentStatus: ACTIVE` | "User is not active" |
| Future Only | (Optional) Only create future shifts | "Cannot create shifts for past dates" |

### 7.4 Actual Hours Recording (GM/CEO)

| Rule | Description | Error Message |
|------|-------------|---------------|
| Time Check | Cannot record until after shift end | "Cannot record hours until shift ends" |
| Time Logic | `actualStartTime` < `actualEndTime` | "Invalid time range" |
| Status Required | Must select status (PRESENT/SICK/ABSENT) | "Please select actual status" |
| Times Required | If PRESENT: times required | "Please specify actual work times" |
| Times Forbidden | If SICK/ABSENT: times must be null | "Do not specify times for sick/absent" |

---

## 8. Implementation Roadmap

### Phase 1: Database & Infrastructure (Estimated: 2-3 days)

#### 1.1 Database Schema
- [ ] **Task:** Create Prisma enums (`ShiftRequestType`, `ShiftRequestStatus`, `ActualWorkStatus`)
  - File: `prisma/schema.prisma`
  - Dependencies: None
  - Acceptance: Enums defined correctly

- [ ] **Task:** Create `ShiftRequest` model with all fields and relationships
  - File: `prisma/schema.prisma`
  - Dependencies: Enums created
  - Acceptance: Model compiles, relationships correct

- [ ] **Task:** Add `requestDeadline` to `WeekSchedule`
  - File: `prisma/schema.prisma`
  - Dependencies: None
  - Acceptance: Field added, optional DateTime

- [ ] **Task:** Add `actualStartTime`, `actualEndTime`, `actualStatus` to `Shift`
  - File: `prisma/schema.prisma`
  - Dependencies: `ActualWorkStatus` enum
  - Acceptance: Fields added, all nullable

- [ ] **Task:** Update `User` with request relationships
  - File: `prisma/schema.prisma`
  - Dependencies: `ShiftRequest` model
  - Acceptance: Relations defined

- [ ] **Task:** Run Prisma migration
  - Command: `npx prisma migrate dev --name add-shift-request-system`
  - Dependencies: All schema changes
  - Acceptance: Migration successful, no errors

- [ ] **Task:** Generate Prisma client
  - Command: `npx prisma generate`
  - Dependencies: Migration
  - Acceptance: Types available in IDE

- [ ] **Task:** Test database schema with sample data
  - Create test records in each table
  - Dependencies: Prisma client
  - Acceptance: CRUD operations work

---

### Phase 2: Employee Features (Estimated: 4-5 days)

#### 2.1 Request Submission API

- [ ] **Task:** Create `POST /api/shift-requests` endpoint
  - File: `app/api/shift-requests/route.ts`
  - Dependencies: Database Phase 1
  - Acceptance: Can create SPECIFIC_TIME, AVAILABLE, TIME_OFF requests

- [ ] **Task:** Add validations to POST endpoint
  - Deadline check, uniqueness, time logic, etc.
  - Dependencies: POST endpoint
  - Acceptance: All validation rules enforced

- [ ] **Task:** Create `GET /api/shift-requests` endpoint
  - Query params: `weekScheduleId`, `userId`, `status`
  - Dependencies: Database Phase 1
  - Acceptance: Returns filtered requests with user data

- [ ] **Task:** Create `PATCH /api/shift-requests/[requestId]` endpoint
  - Employee update and GM/CEO review actions
  - Dependencies: GET endpoint
  - Acceptance: Can update request fields and change status

- [ ] **Task:** Create `DELETE /api/shift-requests/[requestId]` endpoint
  - Hard delete with validations
  - Dependencies: GET endpoint
  - Acceptance: Deletes request if before deadline

- [ ] **Task:** Add TIME_OFF validation to shift creation
  - Update `POST /api/shifts` to check for approved time off
  - Dependencies: Shift request endpoints
  - Acceptance: Returns 409 if time off exists

#### 2.2 Request Submission UI

- [ ] **Task:** Create `/schedule/requests` page layout
  - Week selector, deadline display, request grid
  - Dependencies: API Phase 2.1
  - File: `app/schedule/requests/page.tsx`
  - Acceptance: Page renders, fetches requests

- [ ] **Task:** Create request submission modal
  - Radio buttons for 3 types, time pickers, notes
  - File: `app/schedule/requests/components/RequestModal.tsx`
  - Dependencies: Requests page
  - Acceptance: Can submit all 3 request types

- [ ] **Task:** Implement request list with edit/delete
  - Show existing requests, status colors
  - Dependencies: Request modal
  - Acceptance: Can view, edit, delete requests

- [ ] **Task:** Create work hour summary widget
  - Calculate requested vs. required hours
  - File: `app/schedule/requests/components/HourSummary.tsx`
  - Dependencies: GET /api/work-hours/summary (see Phase 2.3)
  - Acceptance: Shows accurate hour counts and warnings

#### 2.3 Work Hour Calculations

- [ ] **Task:** Create `GET /api/work-hours/summary` endpoint
  - Calculate requested, planned, actual hours
  - File: `app/api/work-hours/summary/route.ts`
  - Dependencies: Shift request data
  - Acceptance: Returns accurate summary object

- [ ] **Task:** Integrate hour summary into requests page
  - Display at bottom of page
  - Dependencies: Hour summary widget, API endpoint
  - Acceptance: Updates when requests change

#### 2.4 My Schedule View (Employee)

- [ ] **Task:** Create `/schedule/my-schedule` page
  - Show published weeks only
  - File: `app/schedule/my-schedule/page.tsx`
  - Dependencies: API Phase 2.1
  - Acceptance: Displays user's shifts with actual hours

- [ ] **Task:** Display 2-row view (planned + actual)
  - DayPilot or custom calendar
  - Dependencies: My schedule page
  - Acceptance: Shows shifts and recorded hours

---

### Phase 3: GM/CEO Features (Estimated: 5-6 days)

#### 3.1 Request Display in Calendar

- [ ] **Task:** Modify DayPilot scheduler to show 3 rows per user
  - Row 1: ShiftRequests
  - Row 2: Shifts (existing)
  - Row 3: Actual hours
  - File: `app/schedule/[scheduleId]/page.tsx`
  - Dependencies: Database Phase 1
  - Acceptance: 3 distinct rows visible

- [ ] **Task:** Fetch and display ShiftRequests in Row 1
  - Light gray for PENDING, green border for APPROVED, red for REJECTED
  - Dependencies: 3-row layout
  - Acceptance: Requests display with correct colors

- [ ] **Task:** Implement color coding for request statuses
  - PENDING: light gray, APPROVED: green, REJECTED: red
  - Dependencies: ShiftRequest display
  - Acceptance: Colors match design

- [ ] **Task:** Add TIME_OFF indicator
  - Special display for time off requests
  - Dependencies: Request display
  - Acceptance: TIME_OFF shows as orange block

#### 3.2 Request Review System

- [ ] **Task:** Create request review modal (GM/CEO)
  - Shows request details, employee notes
  - File: `app/schedule/[scheduleId]/components/ReviewRequestModal.tsx`
  - Dependencies: Request display in calendar
  - Acceptance: Modal opens on Row 1 click

- [ ] **Task:** Implement "Approve" flow
  - Position selection modal
  - Creates Shift record
  - Updates ShiftRequest status
  - Dependencies: Review modal
  - Acceptance: Approval creates shift, updates request

- [ ] **Task:** Implement "Reject" flow
  - Rejection reason textarea
  - Updates ShiftRequest status
  - Dependencies: Review modal
  - Acceptance: Rejection updates request with reason

- [ ] **Task:** Add request approval to AddShiftModal
  - Option to approve request while creating shift
  - File: `app/schedule/components/AddShiftModal.tsx`
  - Dependencies: Approval flow
  - Acceptance: Can link shift to approved request

#### 3.3 Actual Hours Recording

- [ ] **Task:** Create actual hours modal
  - Status selector (PRESENT/SICK/ABSENT)
  - Time pickers (if PRESENT)
  - File: `app/schedule/[scheduleId]/components/ActualHoursModal.tsx`
  - Dependencies: Row 3 display
  - Acceptance: Modal opens on Row 2 click (after shift end)

- [ ] **Task:** Add validation for time recording
  - Cannot record before shift ends
  - actualStart < actualEnd
  - Dependencies: Actual hours modal
  - Acceptance: Validations enforce rules

- [ ] **Task:** Implement PRESENT flow
  - Record actual start/end times
  - Calculate actual hours worked
  - Dependencies: Actual hours modal
  - Acceptance: Updates shift with actual times

- [ ] **Task:** Implement SICK/ABSENT flow
  - Set status without times
  - Dependencies: Actual hours modal
  - Acceptance: Updates shift with status, no times

- [ ] **Task:** Display actual hours in Row 3
  - Dark gray for PRESENT, yellow for SICK, red for ABSENT
  - Dependencies: Actual hours recording
  - Acceptance: Row 3 shows accurate actual hours

#### 3.4 Week Schedule Management

- [ ] **Task:** Add `requestDeadline` field to week creation modal
  - Date picker, default to Friday before week
  - File: `app/schedule/page.tsx` (week creation modal)
  - Dependencies: Database Phase 1
  - Acceptance: Can set custom deadline

- [ ] **Task:** Display deadline status in schedule view
  - Show if requests are open/closed
  - Dependencies: Week creation with deadline
  - Acceptance: Deadline displayed, status indicator

---

### Phase 4: Actual Work Hours Tracking (Estimated: 2-3 days)

#### 4.1 Shift API Enhancements

- [ ] **Task:** Enhance `PATCH /api/shifts/[shiftId]` for actual hours
  - Accept `actualStartTime`, `actualEndTime`, `actualStatus`
  - File: `app/api/shifts/[shiftId]/route.ts`
  - Dependencies: Database Phase 1
  - Acceptance: Can update actual hours fields

- [ ] **Task:** Add validations for actual hours
  - Time check (cannot record before shift ends)
  - Status-dependent fields (times required if PRESENT)
  - Dependencies: Enhanced PATCH endpoint
  - Acceptance: Validations enforce rules

#### 4.2 Actual Hours UI Integration

- [ ] **Task:** Integrate actual hours modal into schedule calendar
  - Open modal on Row 2 click (shift)
  - Dependencies: Phase 3.3 actual hours modal
  - Acceptance: Modal opens and saves actual hours

- [ ] **Task:** Update Row 3 display after recording
  - Refresh calendar after save
  - Dependencies: Actual hours integration
  - Acceptance: Row 3 updates immediately

#### 4.3 Hour Summary with Actual Hours

- [ ] **Task:** Update `GET /api/work-hours/summary` to include actual hours
  - Add actual hours breakdown (present/sick/absent)
  - File: `app/api/work-hours/summary/route.ts`
  - Dependencies: Actual hours tracking
  - Acceptance: Summary includes actual hours

- [ ] **Task:** Display actual hours in employee summary widget
  - Show actual vs. planned comparison
  - Dependencies: Updated summary API
  - Acceptance: Widget shows all 3 hour types

---

### Phase 5: Testing & Refinement (Estimated: 2-3 days)

#### 5.1 Integration Testing

- [ ] **Task:** Test full employee workflow
  - Request → Edit → Delete → Request again
  - Dependencies: All employee features
  - Acceptance: All flows work end-to-end

- [ ] **Task:** Test full GM/CEO workflow
  - Create week → Review requests → Approve/Reject → Record hours
  - Dependencies: All GM/CEO features
  - Acceptance: All flows work end-to-end

- [ ] **Task:** Test deadline enforcement
  - Try to submit/edit after deadline
  - Dependencies: Request submission and edit
  - Acceptance: Blocked after deadline

- [ ] **Task:** Test TIME_OFF validation
  - Approve time off → Try to create shift → Should fail
  - Dependencies: Time off approval and shift creation
  - Acceptance: Cannot create shift on time off day

- [ ] **Task:** Test overlap prevention
  - Create shift → Try to approve overlapping request → Should fail
  - Dependencies: Shift creation and request approval
  - Acceptance: Overlap detected and prevented

#### 5.2 Documentation

- [ ] **Task:** Update this document with implementation notes
  - Record any changes to plan
  - Add screenshots of final UI
  - Dependencies: All features complete
  - Acceptance: Document reflects actual implementation

- [ ] **Task:** Create user guide for employees
  - How to submit requests
  - How to view schedule
  - Dependencies: All features complete
  - Acceptance: Clear step-by-step guide

- [ ] **Task:** Create user guide for GM/CEO
  - How to review requests
  - How to record actual hours
  - Dependencies: All features complete
  - Acceptance: Clear step-by-step guide

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Test all API endpoints with various inputs
- Test validation rules independently
- Test date/time calculations

### 9.2 Integration Tests
- Employee creates request → GM approves → Shift created
- Employee creates TIME_OFF → GM approves → Cannot create shift
- Employee creates request after deadline → Should fail

### 9.3 Manual Testing Scenarios

#### Scenario 1: Happy Path (Employee)
1. Employee logs in
2. Navigates to "My Requests"
3. Selects week Nov 3-9
4. Clicks Monday [+]
5. Selects "Specific Time"
6. Enters 8:00 - 16:00
7. Adds note "I can work storage or cashier"
8. Submits
9. Sees request in list (PENDING)
10. Hour summary shows "8 hours requested"

#### Scenario 2: Request Modification (Employee)
1. Employee has existing request for Monday
2. Clicks "Edit"
3. Changes time to 9:00 - 17:00
4. Saves
5. Request updated
6. Hour summary recalculates

#### Scenario 3: Time Off Request (Employee)
1. Employee clicks Tuesday [+]
2. Selects "Time Off"
3. Adds note "Family event"
4. Submits
5. Request shows "TIME_OFF (PENDING)"

#### Scenario 4: Request Approval (GM/CEO)
1. GM opens schedule for Nov 3-9
2. Sees Nagy Anna's request in Row 1 (light gray)
3. Clicks on request
4. Modal shows details
5. Clicks "Approve & Assign"
6. Selects "Storage" position
7. Clicks "Create Shift"
8. Row 1 turns green (APPROVED)
9. Row 2 shows blue "Storage: 8:00-16:00"

#### Scenario 5: Time Off Approval (GM/CEO)
1. GM sees Tuesday TIME_OFF request
2. Clicks on request
3. Clicks "Approve"
4. Request approved (no shift created)
5. Tries to create shift for Tuesday → Gets error "User has approved time off"

#### Scenario 6: Request Rejection (GM/CEO)
1. GM clicks on pending request
2. Clicks "Reject"
3. Enters reason "We need you on Wednesday instead"
4. Submits
5. Row 1 turns red (REJECTED)
6. Employee sees rejection reason

#### Scenario 7: Actual Hours Recording (GM/CEO)
1. Monday shift ends (16:00)
2. Current time is 16:05
3. GM clicks on Row 2 (Storage shift)
4. Modal opens "Record Actual Hours"
5. Selects "Present"
6. Enters actual times: 8:15 - 15:45
7. Saves
8. Row 3 shows "Worked: 8:15-15:45 (7.5h)" in dark gray

#### Scenario 8: Sick Day Recording (GM/CEO)
1. GM clicks on shift for employee
2. Selects "Sick"
3. (No time input)
4. Saves
5. Row 3 shows "SICK" in yellow

#### Scenario 9: Deadline Enforcement
1. Current date: Nov 1
2. requestDeadline: Oct 31
3. Employee tries to submit request for Nov 3-9
4. Gets error "Request deadline has passed"
5. Cannot edit existing requests
6. Can only view

#### Scenario 10: Overlap Prevention
1. Employee has shift Monday 8:00-12:00
2. Employee tries to request Monday 10:00-14:00
3. Gets error "You already have a shift on this day"

---

## Implementation Status Tracking

**Last Updated:** 2025-10-29

### Phase 1: Database & Infrastructure ✅
- [x] 8/8 tasks complete **(100%)**
  - [x] Create ShiftRequestType enum (SPECIFIC_TIME, AVAILABLE_ALL_DAY, TIME_OFF)
  - [x] Create ShiftRequestStatus enum (PENDING, APPROVED, REJECTED, CONVERTED_TO_SHIFT)
  - [x] Create ActualWorkStatus enum (PRESENT, SICK, ABSENT)
  - [x] Create ShiftRequest model in Prisma schema
  - [x] Create ActualWorkHours model in Prisma schema
  - [x] Update WeekSchedule model with requestDeadline field (made nullable for existing data)
  - [x] Update Shift model with shiftRequestId reference
  - [x] Update User model with weeklyRequiredHours field
  - [x] Run `prisma generate` and `npx prisma db push`

**Files Modified:**
- `prisma/schema.prisma` - Added new enums, ShiftRequest model, ActualWorkHours model, and updated existing models

**Note:** `requestDeadline` was made nullable (`DateTime?`) to support existing WeekSchedule records without breaking the app. New schedules should include this field.

---

### Phase 2: Employee Features - API
- [x] 4/4 API tasks complete **(100%)**
  - [x] POST /api/shift-requests - Create shift request with validations
  - [x] GET /api/shift-requests - Fetch user's requests (employees see own, GM/CEO see all)
  - [x] PUT /api/shift-requests/[requestId] - Update own PENDING request
  - [x] DELETE /api/shift-requests/[requestId] - Delete own PENDING request

**Files Created:**
- `app/api/shift-requests/route.ts` - POST & GET endpoints
- `app/api/shift-requests/[requestId]/route.ts` - PUT & DELETE endpoints

**Validations Implemented:**
- Deadline enforcement (can't submit after requestDeadline)
- TIME_OFF conflict prevention (can't have shift request on same day)
- Duplicate request prevention (one request per position per day)
- Time validation (start < end for SPECIFIC_TIME)
- Only PENDING requests can be edited/deleted

---

### Phase 2: Employee Features - UI
- [x] 3/3 UI tasks complete **(100%)**
  - [x] ShiftRequestModal component - Submit shift requests
  - [x] My Requests page - View and manage requests
  - [x] Navigation menu updated with "My Requests" link

**Files Created:**
- `app/schedule/components/ShiftRequestModal.tsx` - Modal for submitting requests
- `app/my-requests/page.tsx` - Employee view of their requests

**Files Modified:**
- `app/hooks/useRoutes.ts` - Added "My Requests" / "Kéréseim" navigation item

**Features:**
- 3 request types: Specific Time, Available All Day, Time Off
- Position selection dropdown
- Date and time pickers
- Deadline warning in UI (handles null requestDeadline gracefully)
- Status badges (Pending, Approved, Rejected, Converted)
- Delete button for PENDING requests
- Available schedules list with deadline info
- Bilingual support (EN/HU)

---

### Phase 3: GM/CEO Features - API
- [x] 2/2 Review API tasks complete **(100%)**
  - [x] PATCH /api/shift-requests/[requestId]/review - Approve/Reject requests
  - [x] POST /api/shift-requests/[requestId]/convert - Convert approved request to shift

**Files Created:**
- `app/api/shift-requests/[requestId]/review/route.ts` - Review endpoint
- `app/api/shift-requests/[requestId]/convert/route.ts` - Convert endpoint

**Validations Implemented:**
- Only GM/CEO can review/convert
- Only PENDING requests can be reviewed
- Only APPROVED requests can be converted
- TIME_OFF cannot be converted to shift
- Shift overlap prevention when converting
- Rejection requires reason
- Transaction-based conversion (shift creation + request status update)

---

### Phase 3: GM/CEO Features - UI
- [ ] 0/3 UI tasks complete **(0%)**
  - [ ] Add shift request review panel to schedule detail page
  - [ ] Add "Convert to Shift" button/modal for approved requests
  - [ ] Update calendar to show 3 rows per user (requests, shifts, actual hours)

---

### Phase 4: Actual Work Hours
- [ ] 0/6 tasks complete **(0%)**
  - [ ] POST /api/actual-work-hours endpoint
  - [ ] PUT /api/actual-work-hours/[id] endpoint
  - [ ] GET /api/actual-work-hours endpoint
  - [ ] Actual Hours Recording Modal (GM/CEO only)
  - [ ] Display actual hours in 3-row calendar
  - [ ] Work hours summary calculation

---

### Phase 5: Testing & Refinement
- [ ] 0/8 tasks complete **(0%)**
  - [ ] Integration testing
  - [ ] UI/UX refinements
  - [ ] Performance optimization
  - [ ] Error handling improvements
  - [ ] User documentation
  - [ ] Navigation menu updates
  - [ ] Role-based access testing
  - [ ] Edge case handling

---

**Total Progress: 17/49 tasks (35%)**

### Current Status Summary

✅ **Completed:**
- Full database schema with 3 new models
- **positionId made nullable in ShiftRequest** - Employee doesn't choose position
- Complete Employee API with status validation (only ACTIVE can request)
- Employee must have at least 1 UserPosition to request shifts
- Complete GM/CEO Review API (approve, reject)
- Employee UI for request submission (no position dropdown)
- "My Requests" navigation added
- Request deadline system with null handling
- Overlap prevention
- Conflict detection (TIME_OFF vs shifts)

🚧 **In Progress:**
- GM/CEO Convert to Shift with position selection

⏳ **Next Up:**
- ConvertRequestModal component (GM/CEO selects position from employee's UserPositions)
- Update Convert API to require positionId in request body
- 3-row calendar display
- Actual work hours recording

---

## Notes & Decisions

### Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-10-29 | Use `requestDeadline` instead of automatic calculation | Provides flexibility for GM/CEO to set custom deadlines |
| 2025-10-29 | HARD DELETE for withdrawn requests | Keeps database clean, employee can re-request if needed |
| 2025-10-29 | Three request types (SPECIFIC_TIME, AVAILABLE, TIME_OFF) | Covers all use cases clearly |
| 2025-10-29 | Separate `actualStatus` enum instead of nullable times | Explicit status is clearer than inferring from null times |
| 2025-10-29 | Unique constraint on [userId, date] for ShiftRequest | One request per user per day simplifies logic |

### Open Questions

1. **Auto-publish schedules:** Should there be an option to auto-publish on a certain date?
2. **Notification system:** Email/push notifications when requests are approved/rejected?
3. **Bulk operations:** Should GM/CEO be able to approve multiple requests at once?
4. **Historical data:** How long should we keep old schedules and requests?
5. **Reporting:** Do we need reports on attendance, sick days, etc.?

---

## Appendix

### A. Database Entity Relationship Diagram

```
User ─┬─ ShiftRequest (Many)
      │   ├─ WeekSchedule (One)
      │   └─ Shift (One, optional - only if APPROVED)
      │
      └─ Shift (Many)
          ├─ WeekSchedule (One)
          ├─ Position (One)
          └─ ShiftRequest (Many, optional)

WeekSchedule ─┬─ ShiftRequest (Many)
              └─ Shift (Many)

Position ─── Shift (Many)
```

### B. Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| PENDING Request | Light Gray | #E5E7EB |
| APPROVED Request Border | Green | #10B981 |
| REJECTED Request | Red | #EF4444 |
| TIME_OFF Request | Orange | #F59E0B |
| Actual Hours (PRESENT) | Dark Gray | #4B5563 |
| Actual Hours (SICK) | Yellow | #FBBF24 |
| Actual Hours (ABSENT) | Red | #EF4444 |
| Position Colors | Various | (from Position.color) |

### C. Example API Response: Full Week Schedule

```json
{
  "weekSchedule": {
    "id": "abc123",
    "weekStart": "2025-11-03T00:00:00.000Z",
    "weekEnd": "2025-11-09T23:59:59.999Z",
    "requestDeadline": "2025-10-31T23:59:59.999Z",
    "isPublished": true,
    "createdBy": { "id": "ceo123", "name": "John CEO" }
  },
  "users": [
    {
      "id": "user123",
      "name": "Nagy Anna",
      "weeklyWorkHours": 40,
      "requests": [
        {
          "id": "req123",
          "date": "2025-11-03T00:00:00.000Z",
          "type": "SPECIFIC_TIME",
          "startTime": "2025-11-03T08:00:00.000Z",
          "endTime": "2025-11-03T16:00:00.000Z",
          "status": "APPROVED",
          "shiftId": "shift123"
        },
        {
          "id": "req124",
          "date": "2025-11-04T00:00:00.000Z",
          "type": "TIME_OFF",
          "status": "APPROVED"
        }
      ],
      "shifts": [
        {
          "id": "shift123",
          "date": "2025-11-03T00:00:00.000Z",
          "startTime": "2025-11-03T08:00:00.000Z",
          "endTime": "2025-11-03T16:00:00.000Z",
          "position": {
            "id": "pos123",
            "name": "storage",
            "displayNames": { "en": "Storage", "hu": "Raktár" },
            "color": "#3B82F6"
          },
          "actualStartTime": "2025-11-03T08:15:00.000Z",
          "actualEndTime": "2025-11-03T15:45:00.000Z",
          "actualStatus": "PRESENT"
        }
      ],
      "hourSummary": {
        "requested": 8,
        "planned": 8,
        "actual": 7.5
      }
    }
  ]
}
```

---

## End of Document

This document will be updated throughout implementation to reflect actual progress and any changes to the plan.
