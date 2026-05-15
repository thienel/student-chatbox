# EduChat — Tài Liệu Đặc Tả MVP

> **Phạm vi MVP**: Vòng lặp cốt lõi hoạt động end-to-end — Admin tạo tài khoản & môn học, Giảng viên upload tài liệu vào knowledge base, Sinh viên chat RAG với AI theo từng môn học. Chưa bao gồm: Flashcards, Exams, Bookmarks (xem `spec_detail.md`).

---

## 1. Tổng Quan Hệ Thống

| Mục | Giá trị |
|---|---|
| **Tên dự án** | EduChat |
| **Loại hệ thống** | Internal RAG Chatbot — môi trường Đại học |
| **Backend** | NestJS + TypeScript |
| **Frontend** | React + Vite + TypeScript + TailwindCSS |
| **Primary DB** | PostgreSQL 16 |
| **Vector DB** | Qdrant |
| **RAG Framework** | LangChain (TypeScript) |
| **LLM Provider** | OpenAI (GPT-4o cho generation, text-embedding-3-small cho embeddings) |
| **Auth** | JWT (Access Token 15 phút + Refresh Token 7 ngày) |
| **File Streaming** | SSE (Server-Sent Events) |
| **Deployment** | VPS (Docker Compose + Nginx) |

---

## 2. Actors & Phân Quyền

### 2.1 Danh sách Role MVP

| Role | Mô tả | Cách tạo tài khoản |
|---|---|---|
| `admin` | Quản trị toàn hệ thống | Seed khi khởi tạo hệ thống |
| `lecturer` | Giảng viên — quản lý tài liệu của môn được assign | Admin tạo trực tiếp |
| `student` | Sinh viên — sử dụng RAG chat | Admin tạo trực tiếp |

> **Không có self-register.** Mọi tài khoản đều do Admin tạo.

### 2.2 Permission Matrix (MVP)

| Permission | admin | lecturer | student |
|---|:---:|:---:|:---:|
| `user:create` | ✅ | ❌ | ❌ |
| `user:read-list` | ✅ | ❌ | ❌ |
| `user:update` | ✅ | ❌ | ❌ |
| `user:suspend` | ✅ | ❌ | ❌ |
| `subject:create` | ✅ | ❌ | ❌ |
| `subject:update` | ✅ | ❌ | ❌ |
| `subject:delete` | ✅ | ❌ | ❌ |
| `subject:read` | ✅ | ✅ | ✅ |
| `subject:assign-lecturer` | ✅ | ❌ | ❌ |
| `subject:enroll` | ❌ | ❌ | ✅ |
| `document:upload` | ✅ | ✅ (chỉ subject được assign) | ❌ |
| `document:delete` | ✅ | ✅ (chỉ doc mình upload) | ❌ |
| `document:read` | ✅ | ✅ | ✅ |
| `chat:create` | ✅ | ✅ | ✅ |
| `chat:read-own` | ✅ | ✅ | ✅ |
| `ai:chat-rag` | ✅ (unlimited) | ✅ (rate limited) | ✅ (rate limited) |
| `system:manage-settings` | ✅ | ❌ | ❌ |
| `system:read-audit-log` | ✅ | ❌ | ❌ |

> **Thiết kế quan trọng (B2):** Permission được lưu trong database, không hardcode trong logic. Guard kiểm tra permission, không kiểm tra role trực tiếp. Thêm role mới = thao tác admin trên DB, không cần sửa code.

---

## 3. Tính Năng Chi Tiết (MVP)

### 3.1 Admin

#### Quản lý Người dùng
- Tạo tài khoản (email, full name, role, mật khẩu tạm thời)
- Xem danh sách người dùng (có filter role, status; có phân trang)
- Xem chi tiết hồ sơ
- Cập nhật thông tin (tên, role)
- Kích hoạt / Tạm khóa tài khoản (`status: active | suspended`)
- Reset mật khẩu cho user

#### Quản lý Môn học
- Tạo môn học mới (mã môn, tên, mô tả)
- Xem danh sách môn học
- Cập nhật / Ẩn môn học
- Assign giảng viên vào môn học (nhiều giảng viên / 1 môn)
- Gỡ giảng viên khỏi môn học

#### Cài đặt Hệ thống
- Xem và cập nhật giới hạn sử dụng AI theo ngày, theo role
- Các key cài đặt MVP:
  - `ai_daily_limit.student.chat_rag` (default: 20)
  - `ai_daily_limit.lecturer.chat_rag` (default: 100)
  - `ai_daily_limit.admin.chat_rag` (default: -1, unlimited)
  - `rag.top_k` (default: 5)
  - `rag.min_score` (default: 0.7)

#### Audit Log
- Xem nhật ký hoạt động: đăng nhập, upload tài liệu, tạo user, thay đổi settings
- Filter theo user, action, khoảng thời gian

### 3.2 Lecturer

- Xem danh sách các môn học được assign
- Xem danh sách tài liệu đã upload vào từng môn học
- Upload tài liệu (PDF, DOCX, PPTX) vào môn học được assign
  - Hệ thống tự động: extract text → chunk → embed → lưu vào Qdrant
  - Document hiển thị trạng thái: `processing | ready | failed`
- Xóa tài liệu mình đã upload (kèm xóa vectors trong Qdrant)
- Xem và chat với AI trong môn học của mình (cùng RAG pipeline với student)

### 3.3 Student

- Xem danh sách tất cả môn học đang active
- Enroll / Unenroll môn học
- Xem danh sách các chat session của mình trong một môn học
- Tạo chat session mới trong một môn học
- Gửi tin nhắn và nhận phản hồi AI qua SSE streaming
  - AI chỉ trả lời dựa trên tài liệu của môn học đó (strict RAG)
  - Nếu không tìm thấy thông tin liên quan, AI trả lời rõ ràng: "Không tìm thấy thông tin này trong tài liệu môn học"
  - Response kèm `sources` (trích dẫn từ tài liệu nguồn)
- Xóa chat session
- Bị chặn khi đạt giới hạn lượt/ngày (hiện thị thông báo rõ ràng)

---

## 4. Domain Model — PostgreSQL

### 4.1 Sơ đồ quan hệ (mô tả)

```
roles ──< role_permissions >── permissions
  │
  └─── users ──────< refresh_tokens
         │
         ├──< subject_lecturers >── subjects ──< subject_enrollments >── users
         │                              │
         │                              └──< documents
         │
         └──< chats ──< messages
         └──< audit_logs
         └──< ai_usage_logs

system_settings (key-value, standalone)
```

### 4.2 Định nghĩa bảng

```sql
-- ============================================================
-- RBAC
-- ============================================================

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'lecturer', 'student'
  description TEXT,
  is_system   BOOLEAN DEFAULT false,        -- system roles không xóa được
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL, -- 'user:create', 'ai:chat-rag'
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role_id       UUID NOT NULL REFERENCES roles(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended')),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBJECTS
-- ============================================================

CREATE TABLE subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,  -- 'SWD392', 'PRN231'
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subject_lecturers (
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  lecturer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (subject_id, lecturer_id)
);

CREATE TABLE subject_enrollments (
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (subject_id, student_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  original_name   VARCHAR(500) NOT NULL,
  stored_path     VARCHAR(1000) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER,
  status          VARCHAR(20) DEFAULT 'processing'
                    CHECK (status IN ('processing', 'ready', 'failed')),
  chunk_count     INTEGER DEFAULT 0,
  error_message   TEXT,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT & RAG
-- ============================================================

CREATE TABLE chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  title      VARCHAR(500) DEFAULT 'Cuộc trò chuyện mới',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  sources    JSONB,  -- [{ "documentId": "...", "originalName": "...", "excerpt": "...", "score": 0.85 }]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_user_id    ON chats(user_id);
CREATE INDEX idx_chats_subject_id ON chats(subject_id);

-- ============================================================
-- AI USAGE & RATE LIMITING
-- ============================================================

CREATE TABLE ai_usage_logs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature   VARCHAR(30) NOT NULL
              CHECK (feature IN ('chat_rag', 'generate_flashcard', 'generate_exam')),
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count     INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, feature, used_date)
);

-- ============================================================
-- SYSTEM
-- ============================================================

CREATE TABLE system_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL, -- 'USER_LOGIN', 'DOCUMENT_UPLOAD', 'USER_CREATED', ...
  resource_type VARCHAR(50),
  resource_id   UUID,
  details       JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
```

### 4.3 Seed Data

```sql
-- Roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin',    'Quản trị viên hệ thống', true),
  ('lecturer', 'Giảng viên',             true),
  ('student',  'Sinh viên',              true);

-- Permissions
INSERT INTO permissions (name, description) VALUES
  ('user:create',            'Tạo tài khoản người dùng'),
  ('user:read-list',         'Xem danh sách người dùng'),
  ('user:update',            'Cập nhật thông tin người dùng'),
  ('user:suspend',           'Khoá/mở khoá tài khoản'),
  ('subject:create',         'Tạo môn học'),
  ('subject:update',         'Cập nhật môn học'),
  ('subject:delete',         'Xoá môn học'),
  ('subject:read',           'Xem thông tin môn học'),
  ('subject:assign-lecturer','Assign giảng viên vào môn học'),
  ('subject:enroll',         'Tự đăng ký môn học'),
  ('document:upload',        'Upload tài liệu'),
  ('document:delete',        'Xoá tài liệu'),
  ('document:read',          'Xem danh sách tài liệu'),
  ('chat:create',            'Tạo chat session'),
  ('chat:read-own',          'Xem chat của mình'),
  ('ai:chat-rag',            'Sử dụng AI chat RAG'),
  ('system:manage-settings', 'Quản lý cài đặt hệ thống'),
  ('system:read-audit-log',  'Xem audit log');

-- System Settings (defaults)
INSERT INTO system_settings (key, value, description) VALUES
  ('ai_daily_limit.student.chat_rag',   '20',   'Số lượt chat RAG / ngày cho sinh viên'),
  ('ai_daily_limit.lecturer.chat_rag',  '100',  'Số lượt chat RAG / ngày cho giảng viên'),
  ('ai_daily_limit.admin.chat_rag',     '-1',   '-1 = unlimited'),
  ('rag.top_k',                         '5',    'Số chunks lấy từ Qdrant'),
  ('rag.min_score',                     '0.7',  'Ngưỡng score tối thiểu của chunk');
```

---

## 5. Vector Database — Qdrant

### 5.1 Collection

| Thuộc tính | Giá trị |
|---|---|
| Collection name | `documents` |
| Vector size | `1536` (OpenAI `text-embedding-3-small`) |
| Distance metric | `Cosine` |

### 5.2 Point Payload Schema

```json
{
  "document_id":   "uuid",
  "subject_id":    "uuid",
  "chunk_index":   0,
  "text":          "nội dung đoạn văn bản chunk",
  "original_name": "ten_file.pdf"
}
```

### 5.3 Filtering khi RAG Query

```json
{
  "filter": {
    "must": [{ "key": "subject_id", "match": { "value": "<subject_id>" } }]
  },
  "limit": 5,
  "with_payload": true
}
```

---

## 6. RAG Pipeline

### 6.1 Document Ingestion Flow

```
[Lecturer uploads file]
        │
        ▼
[1. Save to local disk]          stores/uploads/{subjectId}/{uuid}_{originalName}
        │
        ▼
[2. Create DB record]            documents.status = 'processing'
        │
        ▼
[3. Extract text]
   PDF  → pdf-parse
   DOCX → mammoth
   PPTX → officeparser
        │
        ▼
[4. Split into chunks]
   RecursiveCharacterTextSplitter
   chunkSize: 1000, overlap: 200
        │
        ▼
[5. Generate embeddings]
   OpenAI text-embedding-3-small
   Batch tất cả chunks
        │
        ▼
[6. Upsert vào Qdrant]
   Collection: documents
   Payload: { document_id, subject_id, chunk_index, text, original_name }
        │
        ▼
[7. Update DB record]            documents.status = 'ready', chunk_count = N
```

### 6.2 RAG Query Flow (SSE Streaming)

```
[Student gửi message]
        │
        ▼
[1. Kiểm tra rate limit]
   ai_usage_logs — nếu count >= limit → 429 Too Many Requests
        │
        ▼
[2. Embed user query]
   OpenAI text-embedding-3-small
        │
        ▼
[3. Similarity search trong Qdrant]
   filter: { subject_id: <id> }
   top_k: system_settings['rag.top_k']
   min_score: system_settings['rag.min_score']
        │
        ▼
[4. Build context prompt]
   System prompt: "Bạn là trợ lý học tập. Chỉ trả lời dựa trên context bên dưới.
                   Nếu không có thông tin, hãy thông báo rõ ràng."
   Context: ghép nối text của các chunks tìm được
        │
        ▼
[5. OpenAI Chat Completion — streaming]
   Model: gpt-4o
   stream: true
        │
        ▼
[6. SSE stream về client]
   data: {"type":"chunk","content":"..."}
   data: {"type":"done","sources":[...]}
        │
        ▼
[7. Lưu message vào DB]          Lưu cả user message và assistant response
        │
        ▼
[8. Increment ai_usage_logs]
   INSERT ... ON CONFLICT DO UPDATE SET count = count + 1
```

---

## 7. API Contract

### Base

- Base URL: `/api/v1`
- Auth header: `Authorization: Bearer <accessToken>`
- Response envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```
- Error envelope:
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Bạn không có quyền thực hiện hành động này"
  }
}
```

### 7.1 Auth

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/refresh` | Làm mới access token | ❌ |
| POST | `/auth/logout` | Đăng xuất (revoke refresh token) | ✅ |
| GET | `/auth/me` | Lấy thông tin user hiện tại | ✅ |

**POST /auth/login**
```json
// Request
{ "email": "user@fpt.edu.vn", "password": "..." }

// Response 200
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@fpt.edu.vn",
      "fullName": "Nguyen Van A",
      "role": "student",
      "permissions": ["subject:read", "chat:create", "ai:chat-rag", ...]
    }
  }
}
```

**POST /auth/refresh**
```json
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "data": { "accessToken": "eyJ..." } }
```

### 7.2 Users (Admin only)

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| POST | `/users` | Tạo tài khoản | `user:create` |
| GET | `/users` | Danh sách users | `user:read-list` |
| GET | `/users/:id` | Chi tiết user | `user:read-list` |
| PATCH | `/users/:id` | Cập nhật user | `user:update` |
| PATCH | `/users/:id/status` | Khoá/mở khoá | `user:suspend` |
| POST | `/users/:id/reset-password` | Reset mật khẩu | `user:update` |

**POST /users**
```json
// Request
{
  "email": "sv001@fpt.edu.vn",
  "fullName": "Nguyen Van B",
  "role": "student",
  "temporaryPassword": "Welcome@123"
}

// Response 201
{ "data": { "id": "uuid", "email": "...", "fullName": "...", "role": "student", "status": "active" } }
```

**GET /users**
```
Query: ?role=student&status=active&page=1&limit=20&search=nguyen
```

**PATCH /users/:id/status**
```json
{ "status": "suspended", "reason": "Vi phạm nội quy" }
```

### 7.3 Subjects

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| POST | `/subjects` | Tạo môn học | `subject:create` |
| GET | `/subjects` | Danh sách môn học | `subject:read` |
| GET | `/subjects/:id` | Chi tiết môn học | `subject:read` |
| PATCH | `/subjects/:id` | Cập nhật | `subject:update` |
| DELETE | `/subjects/:id` | Xoá môn học | `subject:delete` |
| POST | `/subjects/:id/lecturers` | Assign giảng viên | `subject:assign-lecturer` |
| DELETE | `/subjects/:id/lecturers/:lecturerId` | Gỡ giảng viên | `subject:assign-lecturer` |
| POST | `/subjects/:id/enroll` | Sinh viên tự đăng ký | `subject:enroll` |
| DELETE | `/subjects/:id/enroll` | Huỷ đăng ký | `subject:enroll` |

> **Lưu ý phân quyền**: `GET /subjects` — student chỉ thấy subjects `status=active`; lecturer thấy subjects được assign; admin thấy tất cả.

**POST /subjects**
```json
{
  "code": "SWD392",
  "name": "Software Design",
  "description": "Môn học thiết kế phần mềm"
}
```

### 7.4 Documents

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| POST | `/subjects/:subjectId/documents` | Upload tài liệu | `document:upload` |
| GET | `/subjects/:subjectId/documents` | Danh sách tài liệu | `document:read` |
| DELETE | `/subjects/:subjectId/documents/:id` | Xoá tài liệu | `document:delete` |

**POST /subjects/:subjectId/documents**
```
Content-Type: multipart/form-data
Body: file (PDF/DOCX/PPTX, max 50MB)

Response 202 (Accepted — processing bắt đầu async)
{
  "data": {
    "id": "uuid",
    "originalName": "chapter1.pdf",
    "status": "processing"
  }
}
```

**GET /subjects/:subjectId/documents**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "originalName": "chapter1.pdf",
        "mimeType": "application/pdf",
        "fileSizeBytes": 2048000,
        "status": "ready",
        "chunkCount": 42,
        "uploadedBy": { "id": "uuid", "fullName": "Dr. Nguyen" },
        "createdAt": "2026-06-11T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

### 7.5 Chats & RAG

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| POST | `/chats` | Tạo chat session mới | `chat:create` |
| GET | `/chats` | Danh sách chats của tôi | `chat:read-own` |
| GET | `/chats/:id` | Chi tiết chat + messages | `chat:read-own` |
| DELETE | `/chats/:id` | Xoá chat | `chat:read-own` |
| POST | `/chats/:id/messages` | Gửi tin nhắn (SSE streaming) | `ai:chat-rag` |

**POST /chats**
```json
// Request
{ "subjectId": "uuid", "title": "Hỏi về Chapter 3" }

// Response 201
{ "data": { "id": "uuid", "subjectId": "uuid", "title": "Hỏi về Chapter 3", "createdAt": "..." } }
```

**POST /chats/:id/messages — SSE Streaming**
```
Request:
POST /api/v1/chats/{chatId}/messages
Content-Type: application/json
Accept: text/event-stream

Body: { "content": "Giải thích khái niệm dependency injection?" }

Response stream (Content-Type: text/event-stream):
data: {"type":"start","messageId":"uuid"}

data: {"type":"chunk","content":"Dependency Injection"}

data: {"type":"chunk","content":" là một design pattern"}

data: {"type":"chunk","content":" trong đó..."}

data: {"type":"done","sources":[{"documentId":"uuid","originalName":"chapter3.pdf","excerpt":"DI là...","score":0.92}]}

data: [DONE]
```

**Lỗi rate limit (429)**
```json
{
  "success": false,
  "error": {
    "code": "AI_RATE_LIMIT_EXCEEDED",
    "message": "Bạn đã sử dụng hết 20 lượt chat hôm nay. Hạn mức sẽ được đặt lại vào 00:00 ngày mai.",
    "data": { "limit": 20, "used": 20, "resetsAt": "2026-06-12T00:00:00Z" }
  }
}
```

### 7.6 System Settings (Admin)

| Method | Endpoint | Mô tả | Permission |
|---|---|---|---|
| GET | `/system/settings` | Xem tất cả settings | `system:manage-settings` |
| PATCH | `/system/settings` | Cập nhật settings | `system:manage-settings` |
| GET | `/system/audit-logs` | Xem audit logs | `system:read-audit-log` |

**PATCH /system/settings**
```json
{
  "ai_daily_limit.student.chat_rag": 30,
  "rag.top_k": 7
}
```

**GET /system/audit-logs**
```
Query: ?userId=&action=USER_LOGIN&from=2026-06-01&to=2026-06-11&page=1&limit=50
```

---

## 8. Clean Architecture — NestJS

### 8.1 Cấu Trúc Thư Mục Server

```
educhat/server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── domain/                         # Layer 1: Enterprise Business Rules
│   │   ├── user/
│   │   │   ├── entities/user.entity.ts
│   │   │   └── repositories/user.repository.interface.ts
│   │   ├── subject/
│   │   │   ├── entities/subject.entity.ts
│   │   │   └── repositories/subject.repository.interface.ts
│   │   ├── document/
│   │   │   ├── entities/document.entity.ts
│   │   │   └── repositories/document.repository.interface.ts
│   │   ├── chat/
│   │   │   ├── entities/chat.entity.ts
│   │   │   ├── entities/message.entity.ts
│   │   │   └── repositories/chat.repository.interface.ts
│   │   └── shared/
│   │       ├── base.entity.ts
│   │       └── pagination.value-object.ts
│   │
│   ├── application/                    # Layer 2: Application Business Rules
│   │   ├── auth/
│   │   │   ├── use-cases/login.use-case.ts
│   │   │   ├── use-cases/refresh-token.use-case.ts
│   │   │   └── dtos/
│   │   ├── user/
│   │   │   ├── use-cases/create-user.use-case.ts
│   │   │   ├── use-cases/list-users.use-case.ts
│   │   │   ├── use-cases/update-user-status.use-case.ts
│   │   │   └── dtos/
│   │   ├── subject/
│   │   │   ├── use-cases/create-subject.use-case.ts
│   │   │   ├── use-cases/assign-lecturer.use-case.ts
│   │   │   ├── use-cases/enroll-student.use-case.ts
│   │   │   └── dtos/
│   │   ├── document/
│   │   │   ├── use-cases/upload-document.use-case.ts
│   │   │   ├── use-cases/ingest-document.use-case.ts  ← RAG ingestion
│   │   │   └── dtos/
│   │   └── rag/
│   │       ├── use-cases/chat-with-rag.use-case.ts
│   │       └── dtos/
│   │
│   ├── infrastructure/                 # Layer 3: Frameworks & Drivers
│   │   ├── database/
│   │   │   ├── typeorm/
│   │   │   │   ├── typeorm.module.ts
│   │   │   │   ├── migrations/
│   │   │   │   ├── orm-entities/       ← @Entity decorated classes
│   │   │   │   └── repositories/      ← implements domain interfaces
│   │   │   └── qdrant/
│   │   │       ├── qdrant.module.ts
│   │   │       └── qdrant.service.ts
│   │   ├── ai/
│   │   │   ├── openai.service.ts
│   │   │   └── langchain-rag.service.ts
│   │   └── storage/
│   │       └── local-file.service.ts
│   │
│   └── interface/                      # Layer 4: Interface Adapters
│       ├── http/
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   └── auth.controller.ts
│       │   ├── user/
│       │   │   ├── user.module.ts
│       │   │   └── user.controller.ts
│       │   ├── subject/
│       │   ├── document/
│       │   ├── chat/
│       │   │   └── chat.controller.ts  ← chứa SSE endpoint
│       │   └── system/
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   ├── permission.guard.ts     ← đọc từ JWT payload, không query DB
│       │   └── ai-rate-limit.guard.ts
│       ├── decorators/
│       │   ├── require-permission.decorator.ts
│       │   └── current-user.decorator.ts
│       └── interceptors/
│           ├── response-transform.interceptor.ts
│           └── audit-log.interceptor.ts
│
├── test/
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### 8.2 Nguyên tắc phân tầng

| Layer | Phụ thuộc vào | Không biết đến |
|---|---|---|
| `domain/` | Không có dependency ngoài | ORM, NestJS, HTTP |
| `application/` | `domain/` | HTTP, DB, Framework |
| `infrastructure/` | `domain/`, `application/` | HTTP controllers |
| `interface/` | `application/` | DB internals |

### 8.3 RBAC Guard — Cơ chế hoạt động

```typescript
// 1. Khi login → permissions được nhúng vào JWT payload
// JWT payload: { sub: userId, email, role: 'student', permissions: ['subject:read', 'chat:create', ...] }

// 2. Decorator khai báo permission cần thiết
@Post()
@RequirePermission('subject:create')
createSubject(@Body() dto: CreateSubjectDto) { ... }

// 3. PermissionGuard đọc từ JWT — không cần query DB mỗi request
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string>('permission', context.getHandler());
    const user = context.switchToHttp().getRequest().user; // từ JWT
    return user.permissions.includes(required);
  }
}

// 4. Resource-level check xử lý ở Service layer
// Ví dụ: lecturer chỉ upload vào subject được assign
async uploadDocument(uploaderId: string, subjectId: string, file: ...) {
  const isAssigned = await this.subjectRepo.isLecturerAssigned(subjectId, uploaderId);
  if (!isAssigned) throw new ForbiddenException();
  // ...
}
```

---

## 9. Frontend Architecture (MVP)

### 9.1 Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Styling | TailwindCSS |
| State management | Zustand |
| Routing | React Router v6 |
| HTTP client | Axios |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |

### 9.2 Cấu Trúc Thư Mục Client

```
educhat/client/src/
├── api/
│   ├── axiosInstance.ts        ← tái sử dụng từ dự án cũ (đổi base URL)
│   ├── auth.api.ts
│   ├── user.api.ts
│   ├── subject.api.ts
│   ├── document.api.ts
│   └── chat.api.ts
├── store/
│   └── useAuthStore.ts         ← tái sử dụng pattern của useChatStore
├── hooks/
│   └── useChatStream.ts        ← hook xử lý SSE streaming
├── components/
│   ├── MessageList.tsx         ← tái sử dụng (convert từ .jsx)
│   ├── MessageInput.tsx        ← tái sử dụng
│   ├── ChatContainer.tsx       ← tái sử dụng
│   └── BackButton.tsx          ← tái sử dụng
├── layouts/
│   ├── StudentLayout.tsx       ← tái sử dụng (rút gọn nav links)
│   ├── LecturerLayout.tsx      ← tái sử dụng
│   └── AdminLayout.tsx         ← tái sử dụng
├── pages/
│   ├── Login.tsx               ← tái sử dụng
│   │   [Student]
│   ├── StudentDashboard.tsx    ← tái sử dụng
│   ├── Subjects.tsx            ← tái sử dụng từ Courses.jsx
│   ├── SubjectDetail.tsx       ← tái sử dụng từ CourseDetail.jsx
│   ├── SubjectChat.tsx         ← tái sử dụng từ CourseChat.jsx
│   │   [Lecturer]
│   ├── LecturerDashboard.tsx   ← tái sử dụng
│   ├── LecturerDocuments.tsx   ← tái sử dụng từ LecturerResources.jsx
│   │   [Admin]
│   ├── AdminDashboard.tsx      ← tái sử dụng
│   ├── AdminUsers.tsx          ← tái sử dụng từ AdminDashboard.jsx
│   ├── AdminUserDetail.tsx     ← tái sử dụng
│   ├── AdminSubjects.tsx       ← mới
│   └── AdminSettings.tsx       ← mới
└── routes/
    └── AppRoutes.tsx           ← tái sử dụng, bỏ route Community/Exams/Flashcards
```

### 9.3 Component Tái Sử Dụng Từ Dự Án Cũ

| Component cũ | Component mới | Thay đổi |
|---|---|---|
| `MessageList.jsx` | `MessageList.tsx` | Convert TypeScript, thêm hiển thị `sources` |
| `MessageInput.jsx` | `MessageInput.tsx` | Convert TypeScript |
| `ChatContainer.jsx` | `ChatContainer.tsx` | Convert TypeScript |
| `BackButton.jsx` | `BackButton.tsx` | Convert TypeScript |
| `StudentLayout.jsx` | `StudentLayout.tsx` | Bỏ nav: Community, Exams, Flashcards |
| `LecturerLayout.jsx` | `LecturerLayout.tsx` | Bỏ nav: Community, Sandbox |
| `AdminLayout.jsx` | `AdminLayout.tsx` | Thêm nav: Subjects, Settings |
| `api/axiosInstance.js` | `api/axiosInstance.ts` | Đổi base URL |
| `useChat.js` | `useChatStream.ts` | Rewrite cho SSE |

**Xoá hoàn toàn (không tái sử dụng):**
- `ProUpgradeModal.jsx` — không có monetization
- `Community.jsx` — bỏ Community feature
- `SandboxChat.jsx` — bỏ Sandbox
- `Exams.jsx`, `TakeExam.jsx`, `ExamHistory.jsx` — để phần sau (Full Spec)
- `Flashcards.jsx` — để phần sau (Full Spec)

### 9.4 Route Map (MVP)

```
/login                          → Login (public)

/student/dashboard              → StudentDashboard
/student/subjects               → Subjects (danh sách môn học + enroll)
/student/subjects/:id           → SubjectDetail (thông tin môn + danh sách chat)
/student/subjects/:id/chat/:chatId → SubjectChat (giao diện chat RAG)

/lecturer/dashboard             → LecturerDashboard
/lecturer/subjects/:id/documents → LecturerDocuments (upload + manage docs)
/lecturer/subjects/:id/chat/:chatId → SubjectChat (reuse)

/admin/dashboard                → AdminDashboard
/admin/users                    → AdminUsers
/admin/users/:id                → AdminUserDetail
/admin/subjects                 → AdminSubjects
/admin/settings                 → AdminSettings
/admin/audit-logs               → AdminAuditLogs
```

---

## 10. Non-functional Requirements (MVP)

| Yêu cầu | Mục tiêu |
|---|---|
| **Availability** | 99% uptime trên VPS |
| **Latency (non-AI)** | < 200ms cho API calls thông thường |
| **RAG first-chunk latency** | < 3 giây (tính từ khi gửi tin nhắn) |
| **File upload** | Max 50MB, accept: PDF/DOCX/PPTX |
| **Security** | Bcrypt rounds=12, JWT HS256, HTTPS bắt buộc, rate limiting global |
| **Logging** | Audit log cho tất cả hành động nhạy cảm |
| **Error handling** | Không expose stack trace ra client |

---

## 11. Deployment (VPS + Docker Compose)

### 11.1 Services

```yaml
# docker-compose.yml (tham khảo)
services:
  api:
    build: ./server
    environment:
      - DATABASE_URL=postgresql://...
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=...
      - JWT_SECRET=...
      - JWT_REFRESH_SECRET=...
    volumes:
      - ./uploads:/app/uploads

  client:
    build: ./client
    # Build static files, served bởi nginx

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - qdrant_data:/qdrant/storage

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### 11.2 Environment Variables (Server)

```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/educhat

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=documents

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# JWT
JWT_SECRET=<random-256-bit>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=<random-256-bit>
JWT_REFRESH_EXPIRES=7d

# App
PORT=3000
NODE_ENV=production
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=50
```

---

## 12. Audit Actions Reference

| Action | Trigger |
|---|---|
| `USER_LOGIN` | Đăng nhập thành công |
| `USER_LOGIN_FAILED` | Đăng nhập sai mật khẩu |
| `USER_CREATED` | Admin tạo tài khoản |
| `USER_SUSPENDED` | Admin khoá tài khoản |
| `USER_ACTIVATED` | Admin mở khoá |
| `DOCUMENT_UPLOADED` | Upload tài liệu |
| `DOCUMENT_DELETED` | Xoá tài liệu |
| `SUBJECT_CREATED` | Tạo môn học |
| `LECTURER_ASSIGNED` | Assign giảng viên |
| `SETTINGS_UPDATED` | Cập nhật system settings |
| `AI_RATE_LIMIT_HIT` | User bị chặn vì quá giới hạn |
