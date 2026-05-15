# EduChat — Tài Liệu Đặc Tả Chi Tiết (Full Spec)

> **Quan hệ với MVP**: File này mở rộng `spec_mvp.md`. Toàn bộ nội dung trong MVP vẫn còn hiệu lực. Chỉ các phần **thêm mới** hoặc **mở rộng** mới được ghi lại ở đây để tránh trùng lặp.
>
> **Đọc theo thứ tự**: `spec_mvp.md` trước → sau đó `spec_detail.md` cho phần bổ sung.

---

## 1. Tổng Quan Hệ Thống (Full)

| Mục | MVP | Full Spec (bổ sung) |
|---|---|---|
| **Tính năng** | Auth, Subjects, Documents, RAG Chat | + Flashcards, Exams, Bookmarks, Admin Analytics |
| **RBAC** | Permission check từ JWT payload | + Admin UI để manage roles/permissions trong DB |
| **AI features** | RAG Chat | + AI Generate Flashcard, AI Generate Exam |
| **Analytics** | Audit Log cơ bản | + Dashboard thống kê chi tiết |
| **Pagination** | Cơ bản | Đầy đủ: filter, sort, cursor-based pagination |

---

## 2. Actors & Phân Quyền (Full)

### 2.1 Permission Matrix (Đầy đủ — bổ sung vào MVP)

| Permission | admin | lecturer | student |
|---|:---:|:---:|:---:|
| *(tất cả permissions MVP)* | ✅ | theo MVP | theo MVP |
| `flashcard:create` | ✅ | ✅ (subject được assign) | ❌ |
| `flashcard:delete` | ✅ | ✅ (set mình tạo) | ❌ |
| `flashcard:read` | ✅ | ✅ | ✅ |
| `ai:generate-flashcard` | ✅ (unlimited) | ✅ (rate limited) | ✅ (rate limited) |
| `exam:create-official` | ✅ | ❌ *(để dành Phase 2)* | ❌ |
| `exam:read` | ✅ | ✅ | ✅ |
| `exam:take` | ✅ | ✅ | ✅ |
| `ai:generate-exam` | ✅ (unlimited) | ✅ (rate limited) | ✅ (rate limited) |
| `bookmark:manage` | ✅ | ✅ | ✅ |
| `analytics:read-own` | ✅ | ✅ (chỉ subject của mình) | ❌ |
| `analytics:read-all` | ✅ | ❌ | ❌ |
| `rbac:manage` | ✅ | ❌ | ❌ |

### 2.2 System Settings Bổ Sung

Bổ sung thêm các key vào bảng `system_settings`:

```sql
INSERT INTO system_settings (key, value, description) VALUES
  -- Flashcard limits
  ('ai_daily_limit.student.generate_flashcard',  '5',   'Số lần generate flashcard / ngày cho SV'),
  ('ai_daily_limit.lecturer.generate_flashcard', '20',  'Số lần generate flashcard / ngày cho GV'),
  ('ai_daily_limit.admin.generate_flashcard',    '-1',  'unlimited'),

  -- Exam limits
  ('ai_daily_limit.student.generate_exam',       '3',   'Số lần gen đề thi / ngày cho SV'),
  ('ai_daily_limit.lecturer.generate_exam',      '10',  'Số lần gen đề thi / ngày cho GV'),
  ('ai_daily_limit.admin.generate_exam',         '-1',  'unlimited'),

  -- AI model config
  ('ai.chat_model',           '"gpt-4o"',          'Model cho RAG chat'),
  ('ai.flashcard_model',      '"gpt-4o-mini"',     'Model cho generate flashcard'),
  ('ai.exam_model',           '"gpt-4o-mini"',     'Model cho generate exam'),
  ('ai.embedding_model',      '"text-embedding-3-small"', 'Model embedding'),

  -- RAG advanced
  ('rag.system_prompt',       '"Bạn là trợ lý học tập nội bộ..."', 'System prompt cho RAG'),
  ('rag.no_context_message',  '"Không tìm thấy thông tin liên quan trong tài liệu môn học này."', 'Thông báo khi không có context');
```

---

## 3. Domain Model Bổ Sung — PostgreSQL

### 3.1 Sơ đồ quan hệ (bổ sung)

```
subjects ──< flashcard_sets ──< flashcards
subjects ──< exams ──< questions
exams ──< exam_attempts
users ──< exam_attempts
users ──< bookmarks
```

### 3.2 Bảng Bổ Sung

```sql
-- ============================================================
-- FLASHCARDS
-- ============================================================

CREATE TABLE flashcard_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT true,  -- tất cả enrolled students đều thấy
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flashcards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id     UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front      TEXT NOT NULL,  -- câu hỏi / từ khoá
  back       TEXT NOT NULL,  -- đáp án / giải thích
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);

-- ============================================================
-- EXAMS
-- ============================================================

CREATE TABLE exams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  type             VARCHAR(30) NOT NULL
                     CHECK (type IN ('official', 'ai_generated')),
  -- 'official'      : Giảng viên tạo (Phase 2)
  -- 'ai_generated'  : AI sinh ra cho user (student/lecturer/admin)
  difficulty       VARCHAR(10)
                     CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER DEFAULT 0,  -- 0 = không giới hạn thời gian
  question_count   INTEGER DEFAULT 10,
  is_public        BOOLEAN DEFAULT false,
  -- ai_generated exam: is_public = false (private cho người tạo)
  -- official exam: is_public = true (tất cả enrolled students thấy)
  created_by       UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id        UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  options        JSONB NOT NULL,
  -- [{"key":"A","text":"Option A text"}, {"key":"B","text":"..."}, ...]
  correct_answer VARCHAR(5) NOT NULL,  -- 'A', 'B', 'C', 'D'
  explanation    TEXT,
  position       INTEGER DEFAULT 0
);

CREATE TABLE exam_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES exams(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  answers         JSONB,
  -- { "<questionId>": "A", "<questionId2>": "C", ... }
  score           DECIMAL(5,2),  -- 0.00 - 10.00
  total_questions INTEGER,
  correct_count   INTEGER,
  status          VARCHAR(20) DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  time_spent_secs INTEGER
);

CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================

CREATE TABLE bookmarks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(30) NOT NULL
                  CHECK (resource_type IN ('document', 'flashcard_set', 'exam', 'message')),
  resource_id   UUID NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
```

---

## 4. AI Pipeline Bổ Sung

### 4.1 Flashcard Generation Flow

```
[User chọn "Generate Flashcards" trong một môn học]
        │
        ▼
[1. Kiểm tra rate limit]
   feature: 'generate_flashcard'
        │
        ▼
[2. Lấy N chunks ngẫu nhiên/liên quan từ Qdrant]
   Nếu user cung cấp topic → embed topic → similarity search
   Nếu không → lấy random chunks của subject
   N = min(20, total_chunks_in_subject)
        │
        ▼
[3. Gọi OpenAI (gpt-4o-mini)]
   System prompt: "Tạo {count} flashcards từ nội dung học tập bên dưới.
                   Format JSON: [{front, back}]. front là câu hỏi/khái niệm,
                   back là giải thích ngắn gọn."
   Content: chunks đã lấy
        │
        ▼
[4. Parse JSON response]
        │
        ▼
[5. Lưu vào DB]
   flashcard_sets (title tự động từ topic/subject)
   flashcards (N records)
        │
        ▼
[6. Increment ai_usage_logs]
   feature: 'generate_flashcard'
```

### 4.2 Exam Generation Flow

```
[User chọn "Tạo đề thi AI" trong một môn học]
        │
        ▼
[Request body: { questionCount, difficulty, topic? }]
        │
        ▼
[1. Kiểm tra rate limit]
   feature: 'generate_exam'
        │
        ▼
[2. Lấy chunks từ Qdrant]
   Nếu có topic → embed topic → similarity search
   Ngược lại → lấy top chunks của subject
        │
        ▼
[3. Gọi OpenAI (gpt-4o-mini)]
   System prompt: "Tạo {questionCount} câu hỏi trắc nghiệm {difficulty}.
                   Mỗi câu có 4 lựa chọn A/B/C/D. Format JSON:
                   [{ content, options:[{key,text}], correct_answer, explanation }]
                   Chỉ dựa trên nội dung tài liệu bên dưới."
        │
        ▼
[4. Parse và validate JSON]
        │
        ▼
[5. Lưu vào DB]
   exams (type='ai_generated', is_public=false, created_by=userId)
   questions (N records)
        │
        ▼
[6. Increment ai_usage_logs]
   feature: 'generate_exam'
```

---

## 5. API Contract Bổ Sung

### 5.1 Flashcard Sets

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| GET | `/subjects/:subjectId/flashcard-sets` | Danh sách bộ thẻ | `flashcard:read` |
| POST | `/subjects/:subjectId/flashcard-sets/generate` | AI gen bộ thẻ mới | `ai:generate-flashcard` |
| GET | `/subjects/:subjectId/flashcard-sets/:id` | Chi tiết bộ thẻ + cards | `flashcard:read` |
| DELETE | `/subjects/:subjectId/flashcard-sets/:id` | Xoá bộ thẻ | `flashcard:delete` |

**POST /subjects/:subjectId/flashcard-sets/generate**
```json
// Request
{
  "topic": "Dependency Injection",  // optional
  "cardCount": 15                   // optional, default: 10
}

// Response 201
{
  "data": {
    "id": "uuid",
    "title": "Flashcards: Dependency Injection",
    "cardCount": 15,
    "cards": [
      { "id": "uuid", "front": "Dependency Injection là gì?", "back": "Là design pattern...", "position": 0 }
    ]
  }
}
```

**GET /subjects/:subjectId/flashcard-sets/:id**
```json
{
  "data": {
    "id": "uuid",
    "title": "Flashcards: Design Patterns",
    "subjectId": "uuid",
    "createdBy": { "id": "uuid", "fullName": "Dr. Nguyen" },
    "cards": [
      { "id": "uuid", "front": "...", "back": "...", "position": 0 }
    ],
    "createdAt": "2026-06-11T10:00:00Z"
  }
}
```

### 5.2 Exams

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| GET | `/subjects/:subjectId/exams` | Danh sách đề thi | `exam:read` |
| POST | `/subjects/:subjectId/exams/generate` | AI gen đề thi | `ai:generate-exam` |
| GET | `/subjects/:subjectId/exams/:id` | Chi tiết đề (KHÔNG có đáp án) | `exam:read` |
| POST | `/subjects/:subjectId/exams/:id/attempts` | Bắt đầu làm bài | `exam:take` |
| PATCH | `/subjects/:subjectId/exams/:id/attempts/:attemptId` | Nộp bài / lưu tiến độ | `exam:take` |
| GET | `/exam-attempts` | Lịch sử thi của tôi | `exam:take` |
| GET | `/exam-attempts/:id` | Chi tiết kết quả (có đáp án) | `exam:take` |

**POST /subjects/:subjectId/exams/generate**
```json
// Request
{
  "questionCount": 10,
  "difficulty": "medium",
  "topic": "Clean Architecture"  // optional
}

// Response 201
{
  "data": {
    "id": "uuid",
    "title": "Đề thi AI: Clean Architecture (medium)",
    "type": "ai_generated",
    "difficulty": "medium",
    "questionCount": 10,
    "durationMinutes": 0
  }
}
// Lưu ý: questions KHÔNG trả về ở đây, chỉ lấy khi bắt đầu attempt
```

**POST /subjects/:subjectId/exams/:id/attempts**
```json
// Request: body rỗng (bắt đầu bài thi)

// Response 201
{
  "data": {
    "attemptId": "uuid",
    "startedAt": "2026-06-11T10:00:00Z",
    "exam": {
      "id": "uuid",
      "title": "...",
      "durationMinutes": 30,
      "questions": [
        {
          "id": "uuid",
          "content": "Clean Architecture có bao nhiêu layer?",
          "options": [
            { "key": "A", "text": "2" },
            { "key": "B", "text": "4" },
            { "key": "C", "text": "6" },
            { "key": "D", "text": "8" }
          ],
          "position": 0
          // correct_answer KHÔNG có ở đây
        }
      ]
    }
  }
}
```

**PATCH /subjects/:subjectId/exams/:id/attempts/:attemptId**
```json
// Request — nộp bài
{
  "answers": {
    "<questionId-1>": "B",
    "<questionId-2>": "A",
    "<questionId-3>": "C"
  },
  "action": "submit"  // "save_progress" | "submit"
}

// Response 200
{
  "data": {
    "attemptId": "uuid",
    "score": 7.5,
    "totalQuestions": 10,
    "correctCount": 7,
    "completedAt": "2026-06-11T10:35:00Z",
    "timeSpentSecs": 2100
  }
}
```

**GET /exam-attempts/:id — Chi tiết kết quả**
```json
{
  "data": {
    "id": "uuid",
    "score": 7.5,
    "answers": { "<questionId>": "B" },
    "exam": {
      "title": "...",
      "questions": [
        {
          "id": "uuid",
          "content": "...",
          "options": [...],
          "correct_answer": "B",  // hiển thị sau khi nộp bài
          "explanation": "Vì Clean Architecture có 4 layer chính..."
        }
      ]
    }
  }
}
```

### 5.3 Bookmarks

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| GET | `/bookmarks` | Danh sách bookmarks của tôi | `bookmark:manage` |
| POST | `/bookmarks` | Thêm bookmark | `bookmark:manage` |
| DELETE | `/bookmarks/:id` | Xoá bookmark | `bookmark:manage` |

**POST /bookmarks**
```json
// Request
{
  "resourceType": "flashcard_set",  // "document" | "flashcard_set" | "exam" | "message"
  "resourceId": "uuid",
  "note": "Bộ thẻ quan trọng cho thi cuối kỳ"
}

// Response 201
{ "data": { "id": "uuid", "resourceType": "flashcard_set", "resourceId": "uuid", "note": "...", "createdAt": "..." } }
```

**GET /bookmarks**
```
Query: ?resourceType=flashcard_set&page=1&limit=20
```

### 5.4 Admin Analytics

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| GET | `/analytics/overview` | Dashboard tổng quan | `analytics:read-all` |
| GET | `/analytics/ai-usage` | Thống kê sử dụng AI | `analytics:read-all` |
| GET | `/subjects/:id/analytics` | Analytics theo môn | `analytics:read-own` |

**GET /analytics/overview**
```json
{
  "data": {
    "totalUsers": { "admin": 2, "lecturer": 15, "student": 450 },
    "totalSubjects": 12,
    "totalDocuments": 89,
    "totalChats": 2341,
    "totalMessages": 15200,
    "aiUsageToday": {
      "chat_rag": 340,
      "generate_flashcard": 45,
      "generate_exam": 23
    },
    "topSubjectsByActivity": [
      { "subjectId": "uuid", "name": "SWD392 Software Design", "messageCount": 1200 }
    ]
  }
}
```

### 5.5 RBAC Management (Admin)

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| GET | `/rbac/roles` | Danh sách roles | `rbac:manage` |
| POST | `/rbac/roles` | Tạo role mới | `rbac:manage` |
| GET | `/rbac/permissions` | Danh sách tất cả permissions | `rbac:manage` |
| PUT | `/rbac/roles/:id/permissions` | Cập nhật permissions của role | `rbac:manage` |

> **Mục đích (B2)**: Admin có thể tạo role mới (e.g. `teaching_assistant`) và assign permissions cho role đó. Không cần sửa code. Lần sau khi login, user có role đó sẽ tự động nhận được permissions mới trong JWT.

**POST /rbac/roles**
```json
{
  "name": "teaching_assistant",
  "description": "Trợ giảng — có thể upload tài liệu và trả lời chat"
}
```

**PUT /rbac/roles/:id/permissions**
```json
{
  "permissionNames": [
    "subject:read",
    "document:upload",
    "document:read",
    "chat:create",
    "chat:read-own",
    "ai:chat-rag",
    "flashcard:read"
  ]
}
```

---

## 6. Clean Architecture — Bổ Sung Module

### 6.1 Các Module Bổ Sung

```
educhat/server/src/

├── domain/
│   ├── flashcard/
│   │   ├── entities/flashcard-set.entity.ts
│   │   ├── entities/flashcard.entity.ts
│   │   └── repositories/flashcard.repository.interface.ts
│   ├── exam/
│   │   ├── entities/exam.entity.ts
│   │   ├── entities/question.entity.ts
│   │   ├── entities/exam-attempt.entity.ts
│   │   └── repositories/exam.repository.interface.ts
│   └── bookmark/
│       ├── entities/bookmark.entity.ts
│       └── repositories/bookmark.repository.interface.ts
│
├── application/
│   ├── flashcard/
│   │   ├── use-cases/generate-flashcards.use-case.ts
│   │   ├── use-cases/list-flashcard-sets.use-case.ts
│   │   └── dtos/
│   ├── exam/
│   │   ├── use-cases/generate-exam.use-case.ts
│   │   ├── use-cases/start-attempt.use-case.ts
│   │   ├── use-cases/submit-attempt.use-case.ts
│   │   ├── use-cases/get-attempt-result.use-case.ts
│   │   └── dtos/
│   ├── bookmark/
│   │   ├── use-cases/add-bookmark.use-case.ts
│   │   ├── use-cases/list-bookmarks.use-case.ts
│   │   └── dtos/
│   ├── analytics/
│   │   ├── use-cases/get-overview.use-case.ts
│   │   └── use-cases/get-ai-usage.use-case.ts
│   └── rbac/
│       ├── use-cases/create-role.use-case.ts
│       └── use-cases/update-role-permissions.use-case.ts
│
└── interface/
    └── http/
        ├── flashcard/
        │   ├── flashcard.module.ts
        │   └── flashcard.controller.ts
        ├── exam/
        │   ├── exam.module.ts
        │   └── exam.controller.ts
        ├── bookmark/
        │   ├── bookmark.module.ts
        │   └── bookmark.controller.ts
        ├── analytics/
        │   ├── analytics.module.ts
        │   └── analytics.controller.ts
        └── rbac/
            ├── rbac.module.ts
            └── rbac.controller.ts
```

---

## 7. Frontend — Bổ Sung Routes & Components

### 7.1 Routes Bổ Sung

```
[Student]
/student/subjects/:id/flashcards       → Flashcards (danh sách bộ thẻ)
/student/subjects/:id/flashcards/:setId → FlashcardStudy (luyện tập)
/student/subjects/:id/exams            → Exams (danh sách đề thi)
/student/subjects/:id/exams/:examId    → TakeExam (làm bài)
/student/exam-history                  → ExamHistory (lịch sử)
/student/exam-history/:attemptId       → ExamResult (kết quả chi tiết)
/student/bookmarks                     → Bookmarks

[Lecturer — thêm vào]
/lecturer/subjects/:id/flashcards      → FlashcardManage (quản lý + generate)
/lecturer/analytics                    → LecturerAnalytics (thống kê môn học của mình)

[Admin — thêm vào]
/admin/analytics                       → AdminAnalytics (dashboard đầy đủ)
/admin/rbac                            → RbacManagement (quản lý roles/permissions)
```

### 7.2 Components Bổ Sung (Tái sử dụng từ dự án cũ)

| Component cũ | Component mới | Thay đổi |
|---|---|---|
| `Flashcards.jsx` | `FlashcardStudy.tsx` | Convert TS, kết nối API mới |
| `Exams.jsx` | `Exams.tsx` | Convert TS, bỏ Pro gating |
| `TakeExam.jsx` | `TakeExam.tsx` | Convert TS, hỗ trợ SSE timer |
| `ExamHistory.jsx` | `ExamHistory.tsx` | Convert TS |
| `Bookmarks.jsx` | `Bookmarks.tsx` | Convert TS, thêm filter theo resourceType |

### 7.3 Flashcard Study UX

```
FlashcardStudy page:
- Hiển thị card flip animation (front ↔ back)
- Điều hướng: Previous / Next
- Keyboard shortcuts: Space = flip, ← → = navigate
- Progress: "Card 3 / 15"
- Tùy chọn shuffle
- Nút "Bookmark this set"
```

### 7.4 Exam UX

```
TakeExam page:
- Sidebar: danh sách câu hỏi với trạng thái (chưa trả lời / đã trả lời)
- Timer countdown (nếu có duration_minutes > 0)
- Auto-submit khi hết giờ
- Confirm dialog trước khi nộp bài
- "Save progress" tự động mỗi 30 giây
```

---

## 8. Non-functional Requirements (Full)

| Yêu cầu | MVP Target | Full Spec Target |
|---|---|---|
| **Concurrent users** | ~50 | ~500 (scale VPS hoặc thêm caching layer) |
| **AI response first chunk** | < 3s | < 2s (optimize prompt + top_k) |
| **Flashcard generation** | N/A | < 10s cho 15 cards |
| **Exam generation** | N/A | < 15s cho 10 câu |
| **DB query latency** | < 100ms | < 50ms (thêm index, connection pool tuning) |
| **Caching** | Không | System settings cached in-memory (TTL 5 phút) |
| **Token expiry handling** | Manual refresh | Axios interceptor tự động refresh |
| **Offline support** | Không | Không (in-scope: PWA cơ bản) |

---

## 9. Mở Rộng Hệ Thống Trong Tương Lai (Out of Scope)

Phần này ghi lại các hướng mở rộng đã được xác định, để các quyết định kiến trúc hiện tại không chặn chúng.

| Tính năng tương lai | Lý do chưa làm | Điều cần chuẩn bị ngay |
|---|---|---|
| **Lecturer tạo Official Exam** | Chưa có yêu cầu rõ ràng | Schema `exams.type = 'official'` đã sẵn sàng |
| **Thêm role mới (e.g. TA)** | Chưa có nhu cầu | RBAC DB-backed đã thiết kế cho điều này |
| **SSO / LDAP integration** | Không trong scope học kỳ | `users.password_hash` nullable sẵn để hỗ trợ OAuth |
| **Real-time notifications** | Phức tạp, chưa cần | Có thể thêm WebSocket module sau vào NestJS |
| **Multi-language support** | Chưa có yêu cầu | System prompt dùng key từ `system_settings` |
| **Redis caching** | Chưa cần ở scale hiện tại | Infrastructure layer có `cache/` placeholder |
| **File storage cloud (S3)** | Overkill cho VPS đơn | `local-file.service.ts` implement interface `IFileService` → swap được |
| **Rate limiting per-IP** | Không cần cho internal | Global rate limit middleware dễ mở rộng |

---

## 10. Glossary

| Thuật ngữ | Định nghĩa trong hệ thống |
|---|---|
| **Subject** | Môn học (ví dụ: SWD392) — đơn vị tổ chức chính của tài liệu và chat |
| **Knowledge Base** | Tập hợp các chunks được embed từ tài liệu của một subject, lưu trong Qdrant |
| **RAG** | Retrieval-Augmented Generation — AI trả lời dựa trên context lấy từ knowledge base |
| **Chunk** | Đoạn văn bản được tách từ tài liệu (1000 chars, overlap 200) |
| **Attempt** | Một lần làm bài thi cụ thể của một user |
| **Enrollment** | Việc student đăng ký theo học một subject |
| **Assignment** | Việc admin giao một subject cho một lecturer quản lý |
| **SSE** | Server-Sent Events — cơ chế streaming one-way từ server về client |
| **Strict RAG** | Chế độ AI chỉ trả lời dựa trên context lấy được, không dùng general knowledge |
| **Permission** | Một hành động cụ thể trong hệ thống (e.g. `document:upload`) |
| **Role** | Tập hợp permissions được đặt tên (e.g. `student`, `lecturer`) |

---

## 11. Tóm Tắt Sự Khác Biệt Giữa MVP và Full Spec

| Hạng mục | MVP | Full Spec |
|---|---|---|
| **Phạm vi tính năng** | Auth + Subject + Document + RAG Chat | + Flashcards + Exams + Bookmarks + Analytics |
| **AI features** | RAG Chat (có rate limit) | + Generate Flashcard + Generate Exam |
| **Admin tools** | User/Subject mgmt + Settings + Audit log | + Analytics Dashboard + RBAC Management |
| **RBAC** | Permission check từ JWT, roles hardcoded ở seed | + API quản lý roles/permissions trong DB |
| **Frontend pages** | ~13 trang | ~20 trang |
| **DB tables** | 11 bảng | 16 bảng |
| **API endpoints** | ~30 endpoints | ~50 endpoints |
| **Thứ tự xây dựng** | Xây dựng trước | Xây dựng sau khi MVP ổn định |
