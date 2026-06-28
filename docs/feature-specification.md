# Feature Specification — Student Chatbox Platform

**Version:** 1.1  
**Date:** 2026-06-27  
**Status:** Approved for development

---

## Timezone Convention

All time-based logic in this platform uses **Asia/Ho_Chi_Minh (UTC+7)** as the reference timezone. This applies to:
- Calendar day boundaries (streak resets, daily card limit resets)
- Scheduled jobs (weekly study plan generation)
- Date display in API responses (timestamps are stored as UTC in DB and converted to ICT for display where noted)

Wherever this document previously said "UTC", replace with "Asia/Ho_Chi_Minh (ICT)" unless explicitly stated otherwise.

---

## Changes to Existing Features

### EF1 — Document Knowledge Base: Per Lecturer+Subject (Breaking Change)

#### Current Behaviour
Documents are uploaded per class. The Qdrant vector store is scoped by `class_id`. Each class has its own isolated knowledge base.

#### New Behaviour
Documents are uploaded per **lecturer+subject pair**. All classes taught by the same lecturer for the same subject share one knowledge base. Two lecturers teaching the same subject have **separate** knowledge bases.

#### Knowledge Base Key
The knowledge base is identified by the composite key `(lecturerId, subjectId)`:
- `lecturerId` = `uploadedBy` on the document (the lecturer's user ID)
- `subjectId` = the subject UUID

When a **student** accesses the knowledge base, the system resolves: `student → enrolled class → class.lecturerId` to determine which knowledge base to query.

#### Impact on Qdrant
- Each vector chunk's payload currently stores `class_id`. This changes to `lecturer_id` + `subject_id`.
- `_scope_filter` in `qdrant_service.py` changes from filtering by `class_id` to filtering by both `lecturer_id` AND `subject_id`.
- **Migration:** Existing vectors in Qdrant cannot be migrated automatically — all existing documents must be re-processed after deployment. The `documents` table `status` should be reset to `processing` for all existing documents, triggering re-indexing.

#### Impact on `documents` Table
- The `class_id` column on `documents` is **removed** (no longer needed — the lecturer identity comes from `uploaded_by`).
- DB migration: drop `class_id` from `documents`. No data migration needed since the knowledge base key is now derived from existing columns.

#### Impact on API Endpoints
| Endpoint | Change |
|----------|--------|
| `POST /subjects/:subjectId/documents` | Remove `classId` query param entirely |
| `GET /subjects/:subjectId/documents` | Lecturer sees their own docs for the subject. Student sees docs from their class's lecturer for the subject (resolved via class enrollment). Remove `classId` query param. |
| `DELETE /subjects/:subjectId/documents/:id` | No change |
| `POST /subjects/:subjectId/exams/generate` | Replace `classId` context with `lecturerId + subjectId` for Qdrant scoping |
| `POST /subjects/:subjectId/flashcard-sets/generate` | Same as above |
| `POST /chats/:id/messages` | RAG query scoped by `lecturerId + subjectId` instead of `classId` |

#### Impact on AI Service (Python/langchain)
- `ProcessDocumentRequest`: replace `classId: str` with `lecturerId: str`
- `process_document(document_id, file_path, subject_id, lecturer_id)`: store `lecturer_id` in chunk payload instead of `class_id`
- `_scope_filter(lecturer_id, subject_id)`: compound must-filter on both fields
- `search_similar(vector, lecturer_id, subject_id, ...)`: updated signature
- `get_random_chunks(lecturer_id, subject_id, ...)`: updated signature

#### ClassContextService Change
`ClassContextService.resolveClassId()` must be extended (or a new method added) to also return `lecturerId` for the resolved class, so upstream use cases can pass it to the AI service.

---

### EF2 — Lecturer-Created Official Exams

#### Current Behaviour
Exams can only be created via AI generation (`POST /subjects/:subjectId/exams/generate`). The `Exam.type` field already exists with values `official | ai_generated` but `official` is never set.

#### New Behaviour
Lecturers can manually create exams with hand-crafted questions. These exams are marked `type: 'official'`. AI-generated exams remain `type: 'ai_generated'`. Students can distinguish official exams (from their lecturer) from AI practice exams in the UI.

#### Business Rules
- BR-EF2-01: Only users with role `lecturer` or `admin` can create official exams.
- BR-EF2-02: An official exam must be created for a **specific class** (the `classId` is required). The lecturer must own that class.
- BR-EF2-03: An official exam must have a `title` (max 500 chars) and at least **1 question**.
- BR-EF2-04: Each question must have: `content` (required), exactly **4 options** with unique keys (`A`, `B`, `C`, `D`), a `correctAnswer` matching one of the keys, and an optional `explanation` and optional `topic`.
- BR-EF2-05: Official exams are **not public** by default (`isPublic: false`). The lecturer cannot change this — official exams are visible only to enrolled students of the target class.
- BR-EF2-06: Official exams cannot be deleted if any student has an active or completed attempt. The lecturer must abandon those attempts first (a separate moderation endpoint, V2).
- BR-EF2-07: The lecturer can **edit** an official exam (title, description, questions) only if **zero students have started an attempt**. Once any attempt exists, the exam is locked from editing.
- BR-EF2-08: AI-generated exams (`type: ai_generated`) are unaffected by these rules and follow the existing behaviour.

#### New API Endpoint

##### `POST /subjects/:subjectId/exams`
Create an official exam manually.

**Permission:** `exam:create-official` (lecturer, admin)

**Request body:**
```json
{
  "classId": "uuid",
  "title": "Midterm Exam — Data Structures",
  "description": "Covers Chapters 1–4",
  "durationMinutes": 60,
  "questions": [
    {
      "content": "What is the time complexity of binary search?",
      "options": [
        { "key": "A", "text": "O(n)" },
        { "key": "B", "text": "O(log n)" },
        { "key": "C", "text": "O(n²)" },
        { "key": "D", "text": "O(1)" }
      ],
      "correctAnswer": "B",
      "explanation": "Binary search halves the search space each step.",
      "topic": "Search Algorithms"
    }
  ]
}
```

**Response:** Created exam object with questions.

##### `PATCH /subjects/:subjectId/exams/:examId`
Edit an official exam (title, description, questions). Only allowed if zero attempts exist.

**Permission:** `exam:create-official` (must be the exam creator or admin)

**Errors:**
| Code | Condition |
|------|-----------|
| 403 | Caller is not the exam creator |
| 409 | One or more attempts already exist — exam is locked |
| 422 | Question count < 1, or question options not exactly 4, or correctAnswer not in option keys |

#### New Permission
| Permission | Roles |
|-----------|-------|
| `exam:create-official` | lecturer, admin |

---

## Overview

| # | Feature | Primary Audience | Depends On |
|---|---------|-----------------|------------|
| F1 | Spaced Repetition Study Sessions (FSRS) | Student | — |
| F2 | Student Engagement Stats | Lecturer | F1, F3, F6 |
| F3 | Community Flashcards — Stars & Leaderboard | Student | — |
| F4 | Achievements & Badges | Student | F1, F3 |
| F5 | Personalized Study Plan | Student | F1, F9 |
| F6 | Question Board | Student, Lecturer | — |
| F7 | Document Summary | Student, Lecturer | — |
| F8 | Weak Topic Detection | Student | Exam data |
| F9 | ~~Export Class Report~~ | ~~Lecturer~~ | Removed |

---

## F1 — Spaced Repetition Study Sessions (FSRS)

### Purpose
Allow students to study flashcard sets using the FSRS-4.5 spaced repetition algorithm. Cards are scheduled so the student reviews each card at the optimal moment — just before they would forget it — maximising long-term retention with minimum study time.

### Algorithm: FSRS-4.5
See algorithm spec in `docs/fsrs-algorithm.md`. Default pre-trained weights `W[0..18]` are used platform-wide (no per-user weight training in V1). Target retention: **90%**.

### Actors
- **Student** — studies cards, rates them, views their queue and streak
- **System** — schedules next review dates, tracks streaks, awards badges

### Business Rules

#### Daily New Card Limit
- BR-F1-01: Each student has a personal daily new card limit (`newCardsPerDay`). Default: **20**. Range: **1–100**.
- BR-F1-02: The limit resets at **00:00 Asia/Ho_Chi_Minh (ICT)** each day.
- BR-F1-03: "New card" = a card that has never been reviewed by this student (i.e. no `FlashcardProgress` row exists for that student+card pair).
- BR-F1-04: Due cards (cards where `nextReviewAt <= now`) are **not** counted against the daily new card limit.
- BR-F1-05: Once the daily new card limit is reached, the study queue returns only due cards for that day.

#### Study Queue
- BR-F1-06: The study queue for a given flashcard set is: `due_cards` (ordered by `nextReviewAt ASC`) + `new_cards` (ordered by `position ASC`) up to the remaining daily new card allowance.
- BR-F1-07: If both due cards and new cards are exhausted, the session cannot be started and the API returns an empty queue with `nextReviewAt` being the soonest upcoming due card.
- BR-F1-08: The queue is computed at session start. Cards added to a set during an active session are not included in that session.

#### Study Sessions
- BR-F1-09: A session is tied to **one flashcard set**.
- BR-F1-10: A session is considered **complete** when all cards in the queue have been rated at least once.
- BR-F1-11: A student may have at most **one active session per flashcard set** at a time. Starting a new session for a set that has an active session resumes that session.
- BR-F1-12: Sessions older than **24 hours** without completion are automatically marked `abandoned`.
- BR-F1-13: Ratings for an `abandoned` session are **not** saved to `FlashcardProgress`.

#### Card Rating & FSRS Scheduling
- BR-F1-14: Rating options: `again (1)` / `hard (2)` / `good (3)` / `easy (4)`.
- BR-F1-15: On rating, `FlashcardProgress` is created or updated using the FSRS-4.5 formula. The new `nextReviewAt`, `stability`, `difficulty`, and `interval` are persisted immediately.
- BR-F1-16: Within a single session, a card rated `again` is re-queued at the **end** of the current session's card list (not rescheduled to a future date). The session card list can therefore be longer than the initial queue size.
- BR-F1-17: A card rated `again` within a session may be re-queued **at most 2 additional times** in that session to prevent infinite loops.

#### Streak
- BR-F1-18: A study **streak day** = a calendar day in **Asia/Ho_Chi_Minh (ICT)** on which the student completed at least one study session (any flashcard set).
- BR-F1-19: Streak is counted in consecutive ICT calendar days. Missing one day resets the streak to 0.
- BR-F1-20: Streak is stored as `currentStreak` (int) and `longestStreak` (int) on the `StudentStudyStats` table, updated at session completion.
- BR-F1-21: `lastStudiedDate` (ICT date, stored as `date` type in DB interpreted as ICT) is stored. At streak check time, if `today(ICT) - lastStudiedDate >= 2 days`, `currentStreak` resets to 0.

#### Study Settings
- BR-F1-22: Settings are per-student, not per-set.
- BR-F1-23: Updating `newCardsPerDay` takes effect from the **next** calendar day (does not retroactively change today's remaining allowance).

### New DB Tables

#### `flashcard_progress`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users, NOT NULL |
| flashcard_id | uuid | FK → flashcards, NOT NULL |
| stability | float | NOT NULL |
| difficulty | float | NOT NULL, range 1–10 |
| interval | int | NOT NULL, days |
| reps | int | NOT NULL, default 0 |
| last_rating | smallint | NOT NULL, 1–4 |
| last_reviewed_at | timestamptz | NOT NULL |
| next_review_at | timestamptz | NOT NULL, **indexed** |
| UNIQUE | (user_id, flashcard_id) | |

#### `flashcard_study_sessions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users, NOT NULL |
| flashcard_set_id | uuid | FK → flashcard_sets, NOT NULL |
| status | enum | `active`, `completed`, `abandoned` |
| cards_studied | int | NOT NULL, default 0 |
| cards_again | int | NOT NULL, default 0 |
| cards_hard | int | NOT NULL, default 0 |
| cards_good | int | NOT NULL, default 0 |
| cards_easy | int | NOT NULL, default 0 |
| started_at | timestamptz | NOT NULL |
| completed_at | timestamptz | nullable |
| UNIQUE | (user_id, flashcard_set_id) where status = 'active' | partial index |

#### `student_study_stats`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| current_streak | int | NOT NULL, default 0 |
| longest_streak | int | NOT NULL, default 0 |
| total_sessions | int | NOT NULL, default 0 |
| total_cards_reviewed | int | NOT NULL, default 0 |
| last_studied_date | date | nullable, UTC |
| new_cards_studied_today | int | NOT NULL, default 0 |
| new_cards_today_date | date | nullable, ICT calendar date |

#### `student_study_settings`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | uuid | PK, FK → users |
| new_cards_per_day | int | NOT NULL, default 20, range 1–100 |
| updated_at | timestamptz | NOT NULL |

### API Endpoints

#### `GET /flashcard-sets/:setId/study-queue`
Returns the current study queue for the student.

**Permission:** `flashcard:study`  
**Response:**
```json
{
  "sessionId": "uuid | null",
  "dueCards": 5,
  "newCards": 3,
  "totalQueue": 8,
  "nextDueAt": "2026-06-28T00:00:00Z | null",
  "cards": [
    {
      "flashcardId": "uuid",
      "front": "...",
      "back": "...",
      "position": 0,
      "isNew": true,
      "currentStability": null,
      "currentDifficulty": null
    }
  ]
}
```

#### `POST /flashcard-sets/:setId/study-sessions`
Start or resume a study session.

**Permission:** `flashcard:study`  
**Business rule:** If an active session exists, returns it (does not create a new one).  
**Response:** `{ sessionId, status, cardsRemaining }`

#### `POST /study-sessions/:sessionId/reviews`
Rate a card.

**Permission:** `flashcard:study`  
**Request body:**
```json
{ "flashcardId": "uuid", "rating": 1 }
```
**Business rule:** `flashcardId` must belong to the session's set. Rating 1–4 only.  
**Response:** `{ nextReviewAt, interval, stability, difficulty, sessionComplete: bool }`

#### `GET /study-sessions/:sessionId`
Get session summary (for completed sessions).

**Permission:** `flashcard:study`  
**Response:** Full session stats + per-card breakdown.

#### `GET /study-settings`
Get current student's study settings.

**Permission:** `flashcard:study`

#### `PATCH /study-settings`
Update `newCardsPerDay`.

**Permission:** `flashcard:study`  
**Request:** `{ "newCardsPerDay": 30 }`  
**Validation:** Integer, 1–100 inclusive.

#### `GET /study-stats`
Get the student's own streak and cumulative stats.

**Permission:** `flashcard:study`

### New Permissions
| Permission | Roles |
|-----------|-------|
| `flashcard:study` | student |

### Error Cases
| Code | Condition |
|------|-----------|
| 404 | Flashcard set not found or student has no access |
| 409 | Rating submitted for a card not in the active session |
| 422 | Rating out of range (not 1–4) |
| 422 | `newCardsPerDay` out of range |

---

## F2 — Student Engagement Stats for Lecturers

### Purpose
Give lecturers an all-time view of how each student in their class is engaging with the platform — study sessions, flashcard reviews, exam performance, and question board activity — so lecturers can identify at-risk students and reward active ones.

### Actors
- **Lecturer** — views stats for students in their own class
- **Admin** — views stats for any class

### Business Rules
- BR-F2-01: A lecturer can only view stats for students in a class they own. Viewing another lecturer's class stats returns 403.
- BR-F2-02: Stats cover **all time** — no rolling window.
- BR-F2-03: Stats are **read-only**. No lecturer action modifies stats directly.
- BR-F2-04: The `lastActiveAt` timestamp is updated whenever a student: completes a study session, submits an exam attempt, posts a question, or posts an answer.
- BR-F2-05: Per-exam breakdown shows each attempt with score and timestamp, not just aggregate.
- BR-F2-06: Stats are computed on-read (no caching required in V1). If performance is an issue, caching is a V2 concern.

### API Endpoints

#### `GET /subjects/:subjectId/classes/:classId/students`
Enhanced endpoint — returns the student list with a `stats` object on each entry.

**Permission:** `class:manage`  
**Response:**
```json
{
  "items": [
    {
      "userId": "uuid",
      "fullName": "...",
      "email": "...",
      "enrolledAt": "...",
      "stats": {
        "lastActiveAt": "2026-06-25T14:00:00Z | null",
        "currentStreak": 5,
        "totalStudySessions": 12,
        "totalCardsReviewed": 340,
        "totalStarsReceived": 8,
        "questionsPosted": 3,
        "answersPosted": 7,
        "examAttempts": [
          { "examId": "uuid", "examTitle": "...", "score": 85, "attemptedAt": "..." }
        ],
        "avgExamScore": 82.5
      }
    }
  ]
}
```

#### `GET /subjects/:subjectId/classes/:classId/students/:studentId/stats`
Full stats for a single student.

**Permission:** `class:manage`  
**Response:** Same `stats` object as above, plus `weakTopics` array (from F8).

---

## F3 — Community Flashcards — Stars & Leaderboard

### Purpose
Allow students to share their flashcard sets publicly, discover high-quality sets from peers, and compete on a leaderboard ranked by stars received. This creates a social incentive to generate better flashcards.

### Actors
- **Student** — shares sets, stars sets, discovers sets, clones sets
- **Lecturer** — can discover and star sets (read-only participation)
- **Admin** — no special actions beyond normal user access

### Business Rules

#### Sharing
- BR-F3-01: Only the **creator** of a flashcard set can toggle its `isPublic` status.
- BR-F3-02: A set can be made private at any time by its creator, even after others have starred or cloned it.
- BR-F3-03: When a set is made private, it disappears from the discover feed and leaderboard count immediately. Existing clones are **not** deleted — they become independent copies.
- BR-F3-04: A set is private by default. The creator must explicitly publish it.
- BR-F3-05: A set must have **at least 3 cards** to be published. Publishing a set with fewer than 3 cards returns 422.

#### Starring
- BR-F3-06: Any authenticated user can star any public flashcard set, including their own.
- BR-F3-07: A user can star a set at most once. A second star request on an already-starred set returns 409.
- BR-F3-08: Unstarring removes the star and decrements `starCount` on the set.
- BR-F3-09: `starCount` on `flashcard_sets` is a denormalized integer, updated atomically (using a DB transaction) on star/unstar.
- BR-F3-10: If a set is deleted, all its stars are deleted via cascade. The creator's `totalStarsReceived` in the leaderboard is recalculated.

#### Discover Feed
- BR-F3-11: The discover feed shows only sets where `isPublic = true`.
- BR-F3-12: Filter options: `subjectId` (optional). If omitted, returns sets across all subjects.
- BR-F3-13: Sort options: `stars` (descending, default) or `newest` (createdAt descending).
- BR-F3-14: Pagination: **20 items per page**. Client provides `page` (default 1).
- BR-F3-15: Each item in the feed includes `isStarredByMe` (boolean) computed per requesting user.
- BR-F3-16: The feed does **not** filter by class. Any public set across the platform is discoverable.

#### Leaderboard
- BR-F3-17: Leaderboard ranks users by **total stars received** across all their public sets.
- BR-F3-18: Stars on private sets do **not** count toward the leaderboard.
- BR-F3-19: Two views: **global** (all subjects) and **per-subject** (filtered by `subjectId`).
- BR-F3-20: Leaderboard returns top **50** users.
- BR-F3-21: Ties in star count are broken by `totalPublicSets` descending, then by `firstPublishedAt` ascending (earliest publisher wins).
- BR-F3-22: The requesting user's own rank is always included in the response, even if outside top 50.

#### Cloning
- BR-F3-23: Any authenticated user can clone any public flashcard set.
- BR-F3-24: Cloning creates a **fully independent copy** of the set and all its cards under the cloning user's account.
- BR-F3-25: The cloned set's `isPublic` defaults to `false` regardless of the original's visibility.
- BR-F3-26: The cloned set's `title` is prefixed with `"Copy of "` automatically.
- BR-F3-27: The clone references the original via a non-enforced `clonedFromId` UUID column (for analytics only — no FK constraint so deleting the original does not affect clones).
- BR-F3-28: After cloning, the student can freely add, edit, and delete cards. The clone is entirely their property.
- BR-F3-29: A user can clone the same set multiple times (no uniqueness constraint on clones).

### DB Changes to `flashcard_sets`
| New Column | Type | Description |
|------------|------|-------------|
| star_count | int | NOT NULL, default 0, denormalized |
| cloned_from_id | uuid | nullable, no FK, for analytics |
| published_at | timestamptz | nullable, set when isPublic first set to true |

### New DB Table: `flashcard_set_stars`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| set_id | uuid | FK → flashcard_sets ON DELETE CASCADE, NOT NULL |
| user_id | uuid | FK → users, NOT NULL |
| created_at | timestamptz | NOT NULL |
| UNIQUE | (set_id, user_id) | |

### API Endpoints

#### `PATCH /flashcard-sets/:id/visibility`
Toggle public/private.

**Permission:** `flashcard:manage-own`  
**Request:** `{ "isPublic": true }`  
**Business rule:** Caller must be `createdBy`. Set must have ≥ 3 cards to set `isPublic: true`.

#### `GET /flashcard-sets/discover`
Browse public sets.

**Permission:** `flashcard:read` (all roles)  
**Query params:** `subjectId?`, `sort?: stars|newest`, `page?: number`  
**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "...",
      "subjectName": "...",
      "creatorName": "...",
      "cardCount": 20,
      "starCount": 47,
      "isStarredByMe": true,
      "publishedAt": "..."
    }
  ],
  "total": 120,
  "page": 1,
  "pageSize": 20
}
```

#### `POST /flashcard-sets/:id/stars`
Star a set.

**Permission:** `flashcard:read`  
**Response:** `{ starCount: 48 }`  
**Errors:** 409 if already starred, 404 if set not public.

#### `DELETE /flashcard-sets/:id/stars`
Unstar a set.

**Permission:** `flashcard:read`  
**Response:** `{ starCount: 46 }`  
**Errors:** 404 if not currently starred.

#### `POST /flashcard-sets/:id/clone`
Clone a public set.

**Permission:** `flashcard:manage-own`  
**Response:** The newly created set object with its cards.

#### `GET /flashcard-sets/leaderboard`
Get the star leaderboard.

**Permission:** `flashcard:read`  
**Query params:** `subjectId?` (if omitted → global)  
**Response:**
```json
{
  "scope": "global | subject",
  "items": [
    {
      "rank": 1,
      "userId": "uuid",
      "fullName": "...",
      "totalStars": 47,
      "totalPublicSets": 5
    }
  ],
  "myRank": { "rank": 23, "totalStars": 4, "totalPublicSets": 1 }
}
```

### New Permissions
| Permission | Roles |
|-----------|-------|
| `flashcard:manage-own` | student, lecturer |

---

## F4 — Achievements & Badges

### Purpose
Award students permanent badges for reaching meaningful milestones across the platform. Badges are public, visible on the user profile, and create a long-term collection incentive.

### Actors
- **Student** — earns and views badges
- **System** — evaluates badge conditions and awards them asynchronously

### Business Rules
- BR-F4-01: Badges are **system-defined** and hardcoded. No admin UI to add/remove badges in V1.
- BR-F4-02: Each badge is awarded **at most once** per user. Re-qualifying does not re-award.
- BR-F4-03: Badge evaluation happens **asynchronously** after the triggering event (not in the critical path of the action).
- BR-F4-04: Badges are **global** — thresholds count across all subjects and classes.
- BR-F4-05: Once awarded, a badge **cannot be revoked** by any actor (including admin) in V1.
- BR-F4-06: Badge conditions are evaluated only for the user who performed the triggering action — not retroactively for all users.
- BR-F4-07: On initial deployment, existing user data is **not** retroactively evaluated for badges. Only actions from deployment date onward trigger badge checks.

### Badge Catalogue

| ID | Name | Condition | Trigger Event |
|----|------|-----------|---------------|
| `first_session` | First Steps | Complete first study session | Session completed |
| `streak_3` | On a Roll | Reach 3-day study streak | Session completed |
| `streak_7` | Week Warrior | Reach 7-day study streak | Session completed |
| `streak_30` | Iron Will | Reach 30-day study streak | Session completed |
| `cards_100` | Card Shark | Review 100 cards total (lifetime) | Session completed |
| `cards_500` | Card Master | Review 500 cards total (lifetime) | Session completed |
| `first_share` | Knowledge Sharer | Publish first public flashcard set | Set made public |
| `stars_10_single` | Popular Set | Receive 10 stars on a single set | Star added |
| `stars_50_total` | Star Collector | Receive 50 total stars across all sets | Star added |
| `exam_perfect` | Exam Ace | Score 100% on any exam | Exam submitted |
| `exam_80_five` | High Achiever | Score ≥ 80% on 5 different exams | Exam submitted |
| `first_question` | Curious Mind | Post first question on the Question Board | Question posted |
| `answer_pinned` | Peer Expert | Have an answer pinned by a lecturer | Answer pinned |

### New DB Table: `user_badges`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users, NOT NULL |
| badge_id | varchar(50) | NOT NULL |
| awarded_at | timestamptz | NOT NULL |
| UNIQUE | (user_id, badge_id) | |

### API Endpoints

#### `GET /badges`
List all available badges in the system (catalogue).

**Permission:** public (authenticated)  
**Response:** `[{ id, name, description, iconKey }]`

#### `GET /users/:userId/badges`
Get badges earned by a specific user.

**Permission:** authenticated (any user can view another's badges)  
**Response:**
```json
{
  "earned": [
    { "badgeId": "streak_7", "name": "Week Warrior", "iconKey": "...", "awardedAt": "..." }
  ],
  "total": 3
}
```

#### `GET /me/badges`
Get the current user's own badges, including unearned ones with progress hints.

**Permission:** authenticated  
**Response:**
```json
{
  "earned": [...],
  "locked": [
    { "badgeId": "streak_30", "name": "Iron Will", "progress": "7 / 30 days" }
  ]
}
```

### Event Triggers (Internal)
After each triggering action, the application publishes an internal event to a badge evaluation service. The service checks badge conditions using existing DB data and inserts into `user_badges` if condition is met and badge not already awarded.

---

## F5 — Personalized Study Plan

### Purpose
Each Monday, the system generates a 7-day study plan for each student based on their weak topics (from F8) and flashcard review schedule. The plan gives students a clear daily study agenda so they return to the platform with purpose rather than browsing aimlessly.

### Actors
- **Student** — views their own plan
- **System** — generates plans every Monday at 00:00 UTC

### Business Rules
- BR-F5-01: Plans are generated every **Monday at 00:00 Asia/Ho_Chi_Minh (ICT)** via a scheduled job for all active students (students who have logged in within the past 30 days).
- BR-F5-02: A plan covers **Monday through Sunday** of the ICT week it is generated for.
- BR-F5-03: If a student has no plan for the current week (e.g. new user), a plan is generated on their **first request** to `GET /study-plan/current`.
- BR-F5-04: Only **one active plan** exists per student at a time. Generating a new plan for a student who already has one for the current week is a no-op (returns the existing plan).
- BR-F5-05: Plans are **read-only** for students. Students cannot edit, reorder, or dismiss tasks.
- BR-F5-06: Plans are **private** — only the student themselves can view their own plan. Lecturers and admins cannot access student plans.
- BR-F5-07: A plan contains exactly **7 daily entries** (one per day, Mon–Sun). A day may have zero tasks if no study is recommended.
- BR-F5-08: Each task has a `type` (`review_flashcards`, `study_topic`, `take_exam`) and an estimated duration in minutes.
- BR-F5-09: The AI prompt for plan generation receives: the student's weak topics (from F8), their flashcard sets with due card counts, and their recent exam scores. It does not receive chat history or personal messages.
- BR-F5-10: If the AI service is unavailable during the Monday batch job, plan generation for affected students is retried once after 1 hour. If still failing, those students receive no plan for the week (graceful degradation).
- BR-F5-11: Plans are stored as JSON in the DB. The plan schema is versioned (`planVersion`) to handle future schema evolution.
- BR-F5-12: A student who has no exam attempts and no flashcard progress receives a generic onboarding plan suggesting they upload documents, generate flashcards, and take an exam.

### New DB Table: `student_study_plans`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users, NOT NULL |
| week_start_date | date | NOT NULL (always a Monday) |
| plan_version | int | NOT NULL, default 1 |
| plan_data | jsonb | NOT NULL |
| generated_at | timestamptz | NOT NULL |
| UNIQUE | (user_id, week_start_date) | |

### Plan Data Schema (jsonb)
```json
{
  "days": [
    {
      "date": "2026-06-29",
      "dayName": "Monday",
      "tasks": [
        {
          "type": "review_flashcards",
          "title": "Review Flashcards: Data Structures",
          "description": "You have 12 cards due today.",
          "resourceType": "flashcard_set",
          "resourceId": "uuid",
          "estimatedMinutes": 10
        },
        {
          "type": "study_topic",
          "title": "Study: Linked Lists",
          "description": "You scored below 60% on Linked List questions. Focus on this topic.",
          "resourceType": "subject",
          "resourceId": "uuid",
          "estimatedMinutes": 20
        }
      ],
      "totalEstimatedMinutes": 30
    }
  ]
}
```

### API Endpoints

#### `GET /study-plan/current`
Get the current week's study plan for the authenticated student.

**Permission:** `flashcard:study` (student only)  
**Business rule:** If no plan exists for the current week, generate one synchronously and return it.  
**Response:** Full plan data object.

#### `GET /study-plan/history`
Get past study plans.

**Permission:** `flashcard:study`  
**Query params:** `limit?: number` (default 4, max 12)  
**Response:** List of plans in reverse chronological order.

---

## F6 — Question Board

### Purpose
Provide a per-class asynchronous discussion board where students can post questions about course material, peers can answer, and lecturers can pin the best answers. This creates a community knowledge base and gives students a reason to help each other.

### Actors
- **Student** — posts questions, posts answers, upvotes questions and answers
- **Lecturer** — posts answers, pins answers, closes questions, deletes any content in their class
- **Admin** — same powers as lecturer across all classes

### Business Rules

#### Scope
- BR-F6-01: The Question Board is scoped **per class**. A student in Class A cannot see Class B's board.
- BR-F6-02: A student must be enrolled in the class to view or post to its board.

#### Questions
- BR-F6-03: Question `title` max **200 characters**. Question `body` max **5,000 characters**. Both are required.
- BR-F6-04: A student can edit their own question **only if it has 0 answers**. Once an answer exists, the question is locked from editing.
- BR-F6-05: A student can delete their own question **only if it has 0 answers**.
- BR-F6-06: A question has a `status`: `open` (default), `answered` (set automatically when an answer is pinned), `closed` (set manually by lecturer).
- BR-F6-07: A `closed` question cannot receive new answers.
- BR-F6-08: Questions are paginated: **20 per page**. Default sort: `upvotes DESC, createdAt DESC`.
- BR-F6-09: Questions can be filtered by `status` (`open`, `answered`, `closed`).

#### Answers
- BR-F6-10: Answer `body` max **5,000 characters**.
- BR-F6-11: Any class member (student or lecturer) can post an answer to an `open` question.
- BR-F6-12: The question author cannot post an answer to their own question.
- BR-F6-13: A user can post **at most one answer per question**. Posting a second answer to the same question returns 409.
- BR-F6-14: An answer author can edit their own answer at any time, **unless it is pinned**.
- BR-F6-15: An answer author can delete their own answer at any time, **unless it is pinned**.

#### Pinning
- BR-F6-16: Only the **class lecturer** (the lecturer who created the class) or an admin can pin an answer.
- BR-F6-17: At most **one answer** per question can be pinned at a time. Pinning a new answer automatically unpins the previous one.
- BR-F6-18: When an answer is pinned, the question's `status` is automatically set to `answered`.
- BR-F6-19: When the pinned answer is unpinned (by pinning another, or by the lecturer explicitly unpinning), the question status reverts to `open` unless the lecturer manually closes it.

#### Upvotes
- BR-F6-20: Any class member can upvote a question or an answer. **One upvote per user per item.**
- BR-F6-21: Upvoting again removes the upvote (toggle behavior).
- BR-F6-22: Upvote count is denormalized on questions and answers for fast sorting.

#### Lecturer Moderation
- BR-F6-23: The class lecturer can delete **any** question or answer in their class without restriction.
- BR-F6-24: The class lecturer can close any question.
- BR-F6-25: Deleting a question cascades to all its answers.

### New DB Tables

#### `board_questions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| class_id | uuid | FK → classes, NOT NULL |
| author_id | uuid | FK → users, NOT NULL |
| title | varchar(200) | NOT NULL |
| body | text | NOT NULL, max 5000 chars (validated app-side) |
| status | enum | `open`, `answered`, `closed`, default `open` |
| upvote_count | int | NOT NULL, default 0 |
| answer_count | int | NOT NULL, default 0 |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

#### `board_answers`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| question_id | uuid | FK → board_questions ON DELETE CASCADE, NOT NULL |
| author_id | uuid | FK → users, NOT NULL |
| body | text | NOT NULL, max 5000 chars |
| is_pinned | bool | NOT NULL, default false |
| upvote_count | int | NOT NULL, default 0 |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| UNIQUE | (question_id, author_id) | one answer per user per question |

#### `board_upvotes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users, NOT NULL |
| target_type | enum | `question`, `answer` |
| target_id | uuid | NOT NULL |
| created_at | timestamptz | NOT NULL |
| UNIQUE | (user_id, target_type, target_id) | |

### API Endpoints

Base path: `/subjects/:subjectId/classes/:classId/board`

#### `GET /questions`
List questions for the class board.

**Permission:** `subject:read` (enrolled students and class lecturer)  
**Query:** `status?`, `page?` (default 1), `sort?: upvotes|newest`  
**Response:** Paginated question list with `isUpvotedByMe`.

#### `POST /questions`
Post a question.

**Permission:** `subject:read`  
**Request:** `{ title, body }`

#### `PATCH /questions/:questionId`
Edit a question.

**Permission:** `subject:read` (author only, 0 answers constraint)

#### `DELETE /questions/:questionId`
Delete a question.

**Permission:** author (0 answers) or lecturer/admin (any time)

#### `POST /questions/:questionId/upvote`
Toggle upvote on a question.

**Permission:** `subject:read`  
**Response:** `{ upvoteCount, isUpvotedByMe }`

#### `GET /questions/:questionId/answers`
Get all answers for a question.

**Permission:** `subject:read`  
**Response:** Answers list, pinned answer first, then by upvotes.

#### `POST /questions/:questionId/answers`
Post an answer.

**Permission:** `subject:read` (non-author of question, status must be `open`)

#### `PATCH /questions/:questionId/answers/:answerId`
Edit an answer.

**Permission:** author only (not pinned constraint)

#### `DELETE /questions/:questionId/answers/:answerId`
Delete an answer.

**Permission:** author (not pinned) or lecturer/admin

#### `POST /questions/:questionId/answers/:answerId/pin`
Pin an answer (toggle — second call unpins).

**Permission:** `class:manage` (lecturer or admin only)  
**Business rule:** Automatically unpins previous pinned answer and sets question status.

#### `POST /questions/:questionId/answers/:answerId/upvote`
Toggle upvote on an answer.

**Permission:** `subject:read`

#### `PATCH /questions/:questionId/close`
Close a question.

**Permission:** `class:manage`

### New Permissions
| Permission | Roles |
|-----------|-------|
| No new permissions — reuses `subject:read` and `class:manage` | |

---

## F7 — Document Summary

### Purpose
Provide a one-click AI-generated bullet-point summary of any uploaded document. Students get the key points without reading the full PDF. The summary is generated once and stored permanently.

### Actors
- **Student** — requests and reads summaries for documents in their class
- **Lecturer** — requests and reads summaries for documents they manage
- **AI service** — generates the summary

### Business Rules
- BR-F7-01: A summary is generated **once** on first request and stored in the DB. Subsequent requests return the stored summary instantly (no AI call).
- BR-F7-02: Any user with `document:read` permission for the document's class can request a summary.
- BR-F7-03: If the document's `status` is not `ready` (still processing or failed), requesting a summary returns 409 with message "Document is not ready for summarization."
- BR-F7-04: Summary generation is subject to the **same AI rate limiter** as other AI features (`ai:summarize-document` feature key).
- BR-F7-05: The summary is a maximum of **500 words** of plain text formatted as bullet points. The AI prompt enforces this constraint.
- BR-F7-06: If summary generation fails (AI service error), no summary is stored. The next request will retry the AI call. The failure does not count against the rate limit.
- BR-F7-07: There is **no manual refresh** of summaries in V1. Once generated, the summary is permanent, even if the document content changes (documents are immutable after upload anyway).
- BR-F7-08: Summary language matches the detected language of the document (the AI prompt instructs the model to respond in the same language as the document).

### DB Change to `documents`
| New Column | Type | Description |
|------------|------|-------------|
| summary | text | nullable, stored after first generation |
| summary_generated_at | timestamptz | nullable |

### API Endpoints

#### `GET /subjects/:subjectId/documents/:documentId/summary`
Get or generate the document summary.

**Permission:** `document:read`  
**Behavior:** If `summary` is already stored, return it immediately. If not, call AI service, store result, and return it.  
**Response:**
```json
{
  "documentId": "uuid",
  "summary": "• Key point 1\n• Key point 2\n...",
  "generatedAt": "2026-06-27T10:00:00Z",
  "cached": true
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 409 | Document status is not `ready` |
| 429 | AI rate limit exceeded |
| 502 | AI service unavailable (and no cached summary exists) |

### New Permissions
| Permission | Roles |
|-----------|-------|
| `ai:summarize-document` | student, lecturer |

---

## F8 — Weak Topic Detection

### Purpose
After each exam submission, analyze the student's performance per topic and flag topics where they score below 60%. Results are stored and surfaced in the student dashboard and used by F5 (Personalized Study Plan) to recommend targeted study.

### Actors
- **System** — runs detection after each exam submission (synchronous, in the submit-attempt flow)
- **Student** — views their weak topics
- **Lecturer** — views weak topics for students in their class (via F2)

### Business Rules
- BR-F8-01: Weak topic detection runs **synchronously** at the end of `SubmitAttemptUseCase`, after the score is calculated.
- BR-F8-02: A topic is classified as **weak** if the student's all-time correct rate for questions tagged to that topic is **below 60%**.
- BR-F8-03: A topic is classified as **strong** if the all-time correct rate is **≥ 80%**.
- BR-F8-04: Topics between 60–79% are classified as **developing** (not weak, not strong).
- BR-F8-05: Topic classification uses **all-time** data across all exams in the subject, not just the most recent attempt.
- BR-F8-06: The `weak_topics` table is **upserted** (not appended) after each exam — the classification for a topic can change from `weak` → `developing` → `strong` as a student improves.
- BR-F8-07: If a student has attempted fewer than **5 questions** tagged to a topic across all exams, that topic is classified as `insufficient_data` and is excluded from weak topic recommendations.
- BR-F8-08: Exam questions must have a `topic` field. Questions generated by the AI are expected to include a `topic` tag. Questions without a `topic` tag are excluded from weak topic analysis.

### DB Change to `questions`
| New Column | Type | Description |
|------------|------|-------------|
| topic | varchar(100) | nullable, topic tag assigned by AI at generation time |

### New DB Table: `student_weak_topics`
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users, NOT NULL |
| subject_id | uuid | FK → subjects, NOT NULL |
| topic | varchar(100) | NOT NULL |
| classification | enum | `weak`, `developing`, `strong` |
| total_questions | int | NOT NULL |
| correct_count | int | NOT NULL |
| correct_rate | float | NOT NULL, 0.0–1.0 |
| last_updated_at | timestamptz | NOT NULL |
| UNIQUE | (user_id, subject_id, topic) | |

### API Endpoints

#### `GET /subjects/:subjectId/my-weak-topics`
Get the current student's weak topic profile for a subject.

**Permission:** `exam:take`  
**Response:**
```json
{
  "subjectId": "uuid",
  "topics": [
    {
      "topic": "Linked Lists",
      "classification": "weak",
      "correctRate": 0.42,
      "totalQuestions": 12,
      "correctCount": 5,
      "suggestedFlashcardSets": [
        { "id": "uuid", "title": "Flashcards: Linked Lists", "starCount": 15 }
      ]
    }
  ],
  "lastUpdatedAt": "2026-06-27T10:00:00Z"
}
```

**Business rule:** `suggestedFlashcardSets` returns up to 3 public flashcard sets whose `title` contains the topic keyword, sorted by `starCount DESC`.

### AI Prompt Change for Exam Generation
The `generate-exam` AI prompt must be updated to instruct the model to include a `topic` field on each generated question. The expected question format changes from:
```json
{ "content": "...", "options": [...], "correctAnswer": "...", "explanation": "..." }
```
to:
```json
{ "content": "...", "options": [...], "correctAnswer": "...", "explanation": "...", "topic": "Linked Lists" }
```

---

## Cross-Cutting Concerns

### Rate Limiting
All AI-backed endpoints (`ai:summarize-document`, `ai:generate-flashcard`, `ai:generate-exam`, `ai:chat-rag`) share the existing `AiRateLimitGuard`. New AI feature keys must be registered in the guard's feature key map.

### Permissions Summary (New)
| Permission | Feature | Roles |
|-----------|---------|-------|
| `flashcard:study` | F1 | student |
| `flashcard:manage-own` | F3 | student, lecturer |
| `ai:summarize-document` | F7 | student, lecturer |

### DB Migration Order
Migrations must be applied in this order to respect FK dependencies:
1. **Drop `class_id` from `documents`** (EF1 — knowledge base re-architecture)
2. Add `topic` column to `questions` (EF2 + F8)
3. Add `star_count`, `cloned_from_id`, `published_at` to `flashcard_sets` (F3)
4. Add `summary`, `summary_generated_at` to `documents` (F7)
5. Create `flashcard_set_stars` (F3)
6. Create `flashcard_progress` (F1)
7. Create `flashcard_study_sessions` (F1)
8. Create `student_study_stats` (F1)
9. Create `student_study_settings` (F1)
10. Create `user_badges` (F4)
11. Create `board_questions` (F6)
12. Create `board_answers` (F6)
13. Create `board_upvotes` (F6)
14. Create `student_weak_topics` (F8)
15. Create `student_study_plans` (F5)

> **Post-migration re-indexing:** After migration #1, all existing document vectors in Qdrant are stale (they have `class_id` payload but no `lecturer_id`). Reset all `documents.status` to `processing` and re-trigger `processDocument` for each document to re-index with the new `lecturer_id` payload.
