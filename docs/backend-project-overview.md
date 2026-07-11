# EduChat — Backend Project Overview

> **Tài liệu này được tạo ở chế độ documentation-only.**
> Không có bất kỳ thay đổi nào trên source code. Chỉ đọc và mô tả.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tech Stack](#2-tech-stack)
3. [Entry Point: `main.ts`](#3-entry-point-maints)
4. [Root Module: `app.module.ts`](#4-root-module-appmodulets)
5. [Kiến trúc tổng quan](#5-kiến-trúc-tổng-quan)
6. [Layer: Domain](#6-layer-domain)
7. [Layer: Application](#7-layer-application)
8. [Layer: Infrastructure](#8-layer-infrastructure)
9. [Layer: Interface](#9-layer-interface)
10. [Layer: Shared](#10-layer-shared)
11. [Mô tả chi tiết từng Module](#11-mô-tả-chi-tiết-từng-module)
12. [Flow nghiệp vụ từ đầu đến cuối](#12-flow-nghiệp-vụ-từ-đầu-đến-cuối)
13. [API Overview](#13-api-overview)
14. [Database Overview](#14-database-overview)
15. [Authentication & Authorization](#15-authentication--authorization)
16. [Error Handling & Validation](#16-error-handling--validation)
17. [Environment Variables](#17-environment-variables)
18. [Setup & Run Project](#18-setup--run-project)
19. [Hướng dẫn đọc source code cho developer mới](#19-hướng-dẫn-đọc-source-code-cho-developer-mới)
20. [Đánh giá kiến trúc hiện tại](#20-đánh-giá-kiến-trúc-hiện-tại)

---

## 1. Tổng quan dự án

**EduChat** là một hệ thống **RAG Chatbot nội bộ** (Retrieval-Augmented Generation) dành cho trường đại học.

### Dự án giải quyết bài toán gì?

- Sinh viên và giảng viên cần tra cứu thông tin từ tài liệu học thuật (giáo trình, bài giảng) một cách nhanh chóng.
- Thay vì tìm kiếm thủ công, EduChat cho phép người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên, AI sẽ tìm kiếm trong các tài liệu đã được index và trả lời có trích dẫn nguồn.
- Ngoài chatbot RAG, hệ thống còn hỗ trợ tạo flashcard và đề thi bằng AI, quản lý lớp học, diễn đàn hỏi đáp cộng đồng, và theo dõi tiến trình học tập của sinh viên.

### Các tính năng chính

| Tính năng | Mô tả |
|---|---|
| RAG Chatbot | Đặt câu hỏi, AI trả lời dựa trên tài liệu môn học (streaming SSE) |
| Quản lý tài liệu | Upload PDF/file → AI tự động xử lý embeddings → lưu vào vector database |
| AI Flashcard | Tạo bộ thẻ ghi nhớ tự động từ tài liệu bằng AI |
| AI Exam | Tạo đề thi trắc nghiệm tự động từ tài liệu bằng AI |
| Lớp học | Quản lý lớp học, đăng ký, phân nhóm sinh viên theo giảng viên |
| Board (Q&A) | Diễn đàn hỏi đáp cộng đồng (upvote, trả lời) |
| Study Stats | Theo dõi tiến trình học tập, điểm yếu, kế hoạch học tập |
| Badge | Hệ thống huy hiệu gamification |
| Bookmark | Đánh dấu tài liệu yêu thích |
| RBAC | Phân quyền theo role (admin, lecturer, student) |

---

## 2. Tech Stack

| Thành phần | Công nghệ |
|---|---|
| **Backend Framework** | [NestJS](https://nestjs.com/) v10 (TypeScript) |
| **Database** | PostgreSQL 16 |
| **ORM** | TypeORM 0.3 |
| **Authentication** | JWT (access token 15m + refresh token 7d), Passport.js |
| **Password Hashing** | bcrypt |
| **File Storage** | Local filesystem (Multer) |
| **AI Service** | Python LangChain (service riêng) + Qdrant (vector DB) |
| **AI Models** | OpenAI GPT-4o (chat), text-embedding-3-small (embedding), GPT-4o-mini (flashcard/exam) |
| **API Documentation** | Swagger/OpenAPI (tại `/api/docs`) |
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |
| **Validation** | class-validator + class-transformer |

---

## 3. Entry Point: `main.ts`

**File**: `src/main.ts`

`main.ts` là điểm khởi động chính của NestJS application.

### Luồng bootstrap

1. Tạo Nest application từ `AppModule`.
2. Bật **CORS** cho phép origin `http://localhost:5173` và `http://localhost:3000`.
3. Đặt **global prefix** `/api/v1` — mọi API đều có prefix này.
4. Đăng ký **Global ValidationPipe** (`whitelist: true`, `transform: true`).
5. Đăng ký **GlobalExceptionFilter** — bắt và format tất cả lỗi.
6. Đăng ký **ResponseTransformInterceptor** — wrap response thành `{ success, data, message }`.
7. Cấu hình **Swagger** tại `/api/docs` với Bearer Auth.
8. Lắng nghe ở port lấy từ `process.env.PORT` (mặc định `3000`).

### Các middleware global

| Middleware | Loại | Mục đích |
|---|---|---|
| `ValidationPipe` | Pipe | Validate và transform request DTO |
| `GlobalExceptionFilter` | Filter | Format lỗi thành JSON chuẩn |
| `ResponseTransformInterceptor` | Interceptor | Wrap response thành cấu trúc chuẩn |

### File liên quan

- `src/main.ts`
- `src/app.module.ts`
- `src/interface/filters/http-exception.filter.ts`
- `src/interface/interceptors/response-transform.interceptor.ts`

---

## 4. Root Module: `app.module.ts`

**File**: `src/app.module.ts`

`AppModule` là module gốc của backend. File này chịu trách nhiệm import tất cả module chính của hệ thống.

### Các module được import

```
AppModule
├── ConfigModule (global, đọc .env)
├── AuthModule
├── UserModule
├── SubjectModule
├── ClassModule
├── DocumentModule
├── ChatModule
├── SystemModule
├── InternalModule
├── FlashcardModule
├── StudyModule
├── BadgeModule
├── BoardModule
├── ExamModule
├── BookmarkModule
├── AnalyticsModule
└── RbacModule
```

Controller duy nhất được khai báo trực tiếp: `HealthController` (endpoint `/api/v1/health`).

---

## 5. Kiến trúc tổng quan

Project áp dụng **Clean Architecture / Layered Architecture**, phân tách code theo 5 layer chính:

```
┌──────────────────────────────────────┐
│              Client                   │
│  (Browser / Mobile / Postman)        │
└────────────────┬─────────────────────┘
                 │ HTTP Request
                 ▼
┌──────────────────────────────────────┐
│         Interface Layer              │
│  src/interface/http/                 │
│  • Controllers                       │
│  • Route handlers                    │
│  • Request/Response DTOs             │
│  • Guards, Decorators, Interceptors  │
└────────────────┬─────────────────────┘
                 │ Gọi Use Case
                 ▼
┌──────────────────────────────────────┐
│        Application Layer            │
│  src/application/                   │
│  • Use Cases                         │
│  • Application Services             │
│  • Business Workflows               │
└────────────────┬─────────────────────┘
                 │ Gọi Domain / Repository
                 ▼
┌──────────────────────────────────────┐
│          Domain Layer               │
│  src/domain/                        │
│  • Entities (plain classes)          │
│  • Repository Interfaces            │
│  • Enums, Business Rules            │
└────────────────┬─────────────────────┘
                 │ Implement Repository Interface
                 ▼
┌──────────────────────────────────────┐
│       Infrastructure Layer          │
│  src/infrastructure/                │
│  • TypeORM (PostgreSQL)              │
│  • Repository Implementations       │
│  • AI Service Client (LangChain)    │
│  • Local File Storage               │
└────────────────┬─────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   PostgreSQL         AI Service
  (Database)       (LangChain + Qdrant)
```

### Mermaid — Architecture Diagram

```mermaid
graph TD
    Client["🌐 Client (Browser/Mobile)"]
    Interface["📡 Interface Layer\nsrc/interface/\nControllers, Guards, DTOs"]
    Application["⚙️ Application Layer\nsrc/application/\nUse Cases, Services"]
    Domain["🏛️ Domain Layer\nsrc/domain/\nEntities, Repository Interfaces"]
    Infrastructure["🔧 Infrastructure Layer\nsrc/infrastructure/\nTypeORM, AI Client, File Storage"]
    PostgreSQL[("🐘 PostgreSQL")]
    Qdrant[("🔵 Qdrant\nVector DB")]
    LangChain["🤖 LangChain Service\n(Python, port 8000)"]
    Shared["🔨 Shared Layer\nsrc/shared/\nConstants, Utils"]

    Client --> Interface
    Interface --> Application
    Application --> Domain
    Application --> Infrastructure
    Infrastructure --> PostgreSQL
    Infrastructure --> LangChain
    LangChain --> Qdrant
    Shared -.-> Interface
    Shared -.-> Application
    Shared -.-> Infrastructure
```

---

## 6. Layer: Domain

**Path**: `src/domain/`

### Mục đích

Domain layer chứa phần **nghiệp vụ cốt lõi** của hệ thống. Đây là layer không phụ thuộc vào framework (NestJS), database (TypeORM), hay bất kỳ external service nào.

### Thành phần tìm thấy

| Thành phần | File | Mô tả |
|---|---|---|
| Entity | `src/domain/user/entities/user.entity.ts` | Plain class User |
| Entity | `src/domain/user/entities/role.entity.ts` | Plain class Role |
| Entity | `src/domain/user/entities/refresh-token.entity.ts` | Plain class RefreshToken |
| Enum | `src/domain/user/entities/user.entity.ts` | `UserStatus` (active/suspended) |
| Repository Interface | `src/domain/user/repositories/user.repository.interface.ts` | Interface IUserRepository |
| Repository Interface | `src/domain/chat/repositories/chat.repository.interface.ts` | Interface IChatRepository |
| Repository Interface | `src/domain/system/repositories/...` | Interface cho system settings, AI usage log |

### Cấu trúc thư mục domain

```
src/domain/
├── badge/          — Huy hiệu
├── board/          — Diễn đàn hỏi đáp
├── bookmark/       — Bookmark
├── chat/           — Chat session + messages
├── class/          — Lớp học + enrollment
├── document/       — Tài liệu học thuật
├── exam/           — Đề thi + câu hỏi + attempt
├── flashcard/      — Flashcard set + progress
├── shared/         — Value objects dùng chung (Pagination)
├── study/          — Study stats, study plan, weak topics
├── subject/        — Môn học
├── system/         — System settings, AI usage log, Audit log
└── user/           — User, Role, RefreshToken
```

### Vai trò trong kiến trúc

Domain entities là plain TypeScript class, không chứa decorator của NestJS hay TypeORM. Repository interfaces định nghĩa contract (hợp đồng) mà infrastructure layer phải implement.

> **Ghi chú**: Một số use case trong `application/` import trực tiếp `AiServiceClient` từ `infrastructure/`, đây là điểm không hoàn toàn theo Clean Architecture nghiêm ngặt — xem [Đánh giá kiến trúc](#20-đánh-giá-kiến-trúc-hiện-tại).

---

## 7. Layer: Application

**Path**: `src/application/`

### Mục đích

Application layer điều phối **use cases** và **application services**. Nhận dữ liệu từ interface layer, xử lý nghiệp vụ, và gọi repository/domain service phù hợp.

### Use cases theo module

| Module | Use Case | File | Mô tả |
|---|---|---|---|
| auth | LoginUseCase | `application/auth/use-cases/login.use-case.ts` | Đăng nhập, tạo JWT |
| auth | RefreshTokenUseCase | `application/auth/use-cases/refresh-token.use-case.ts` | Làm mới access token |
| auth | LogoutUseCase | `application/auth/use-cases/logout.use-case.ts` | Xóa refresh token |
| auth | GetMeUseCase | `application/auth/use-cases/get-me.use-case.ts` | Lấy thông tin user hiện tại |
| rag | CreateChatUseCase | `application/rag/use-cases/create-chat.use-case.ts` | Tạo chat session |
| rag | PrepareRagStreamUseCase | `application/rag/use-cases/prepare-rag-stream.use-case.ts` | Chuẩn bị stream token cho AI |
| rag | SaveAssistantMessageUseCase | `application/rag/use-cases/save-assistant-message.use-case.ts` | Lưu response từ AI |
| rag | ListChatsUseCase | `application/rag/use-cases/list-chats.use-case.ts` | Liệt kê chat sessions |
| rag | GetChatUseCase | `application/rag/use-cases/get-chat.use-case.ts` | Lấy chi tiết chat |
| rag | DeleteChatUseCase | `application/rag/use-cases/delete-chat.use-case.ts` | Xóa chat |
| document | UploadDocumentUseCase | `application/document/use-cases/upload-document.use-case.ts` | Upload + gửi AI xử lý |
| document | ListDocumentsUseCase | `application/document/use-cases/list-documents.use-case.ts` | Liệt kê tài liệu |
| document | DeleteDocumentUseCase | `application/document/use-cases/delete-document.use-case.ts` | Xóa tài liệu |
| document | SummarizeDocumentUseCase | `application/document/use-cases/summarize-document.use-case.ts` | AI tóm tắt tài liệu |

### Application Services (không phải use case)

| Service | File | Mô tả |
|---|---|---|
| AuditLogService | `application/system/services/audit-log.service.ts` | Ghi nhật ký hành động người dùng |
| ClassContextService | `application/class/services/class-context.service.ts` | Giải quyết lecturerId từ class/subject |

### Cách hoạt động

1. Controller ở `interface/` nhận request.
2. Controller gọi use case/application service.
3. Application layer kiểm tra nghiệp vụ (ví dụ: user có bị suspended không, chat có thuộc về user không).
4. Application layer inject repository interface qua `@Inject(TOKENS.XXX_REPO)`.
5. Infrastructure layer thực thi thao tác database/external service.

---

## 8. Layer: Infrastructure

**Path**: `src/infrastructure/`

### Mục đích

Infrastructure layer chịu trách nhiệm **kết nối với thế giới bên ngoài**: database, file storage, AI service.

### Thành phần chính

| Thành phần | Path | Mô tả |
|---|---|---|
| TypeORM Database Module | `infrastructure/database/typeorm/typeorm.module.ts` | Cấu hình kết nối PostgreSQL, đăng ký tất cả entities |
| ORM Entities (30 file) | `infrastructure/database/typeorm/orm-entities/` | TypeORM entity classes |
| Repository Implementations | `infrastructure/database/typeorm/repositories/` | Implement repository interfaces từ domain |
| Database Seeder | `infrastructure/database/typeorm/seeds/` | Seed data ban đầu |
| AI Service Client | `infrastructure/ai/ai-service.client.ts` | Giao tiếp với Python LangChain service |
| AI Module | `infrastructure/ai/ai.module.ts` | NestJS module cung cấp AiServiceClient |
| Local File Service | `infrastructure/storage/local-file.service.ts` | Lưu/xóa file trên local filesystem |

### Dependency Injection Token

Infrastructure dùng pattern **Dependency Injection Token** để bind repository implementation với interface:

```typescript
// Khai báo trong typeorm.module.ts
{ provide: TOKENS.USER_REPO, useClass: UserTypeOrmRepository }

// Inject trong application layer
@Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository
```

Danh sách tokens: `USER_REPO`, `SUBJECT_REPO`, `CLASS_REPO`, `DOCUMENT_REPO`, `CHAT_REPO`, `ROLE_REPO`, `REFRESH_TOKEN_REPO`, `AI_USAGE_LOG_REPO`, `SYSTEM_SETTING_REPO`, `AUDIT_LOG_REPO`, `FLASHCARD_REPO`, `EXAM_REPO`, `BOOKMARK_REPO`, `STUDY_REPO`, `WEAK_TOPIC_REPO`, `STUDY_PLAN_REPO`, `BADGE_REPO`, `BOARD_REPO`.

### AI Service Client

`AiServiceClient` giao tiếp với Python LangChain service qua HTTP:

| Method | Endpoint AI | Mô tả |
|---|---|---|
| `issueStreamToken()` | — | Tạo JWT ngắn hạn (5 phút) để xác thực stream |
| `streamChat()` | `POST /chat/stream` | Stream SSE response từ AI |
| `processDocument()` | `POST /documents/process` | Gửi file để AI xử lý embeddings |
| `summarizeDocument()` | `POST /documents/summarize` | Yêu cầu AI tóm tắt tài liệu |
| `deleteDocumentVectors()` | `DELETE /documents/:id` | Xóa vectors khỏi Qdrant |
| `generateFlashcards()` | `POST /flashcards/generate` | AI tạo flashcard |
| `generateExam()` | `POST /exams/generate` | AI tạo đề thi |

---

## 9. Layer: Interface

**Path**: `src/interface/`

### Mục đích

Interface layer là **API layer** của backend — nơi nhận HTTP request từ client và chuyển vào application layer.

### Controllers/Modules

| Module | Controller | Route base | File |
|---|---|---|---|
| Auth | AuthController | `/api/v1/auth` | `interface/http/auth/auth.controller.ts` |
| User | UserController | `/api/v1/users` | `interface/http/user/user.controller.ts` |
| Subject | SubjectController | `/api/v1/subjects` | `interface/http/subject/subject.controller.ts` |
| Class | ClassController | `/api/v1/classes` | `interface/http/class/class.controller.ts` |
| Document | DocumentController | `/api/v1/subjects/:subjectId/documents` | `interface/http/document/document.controller.ts` |
| Chat | ChatController | `/api/v1/chats` | `interface/http/chat/chat.controller.ts` |
| Flashcard | FlashcardController | `/api/v1/flashcard-sets` | `interface/http/flashcard/flashcard.controller.ts` |
| Flashcard Community | FlashcardCommunityController | `/api/v1/flashcard-sets/community` | `interface/http/flashcard/flashcard-community.controller.ts` |
| Exam | ExamController | `/api/v1/subjects/:subjectId/exams` | `interface/http/exam/exam.controller.ts` |
| Weak Topic | WeakTopicController | `/api/v1/...` | `interface/http/exam/weak-topic.controller.ts` |
| Study | StudyController | `/api/v1/study` | `interface/http/study/...` |
| Badge | BadgeController | `/api/v1/badges` | `interface/http/badge/...` |
| Board | BoardController | `/api/v1/board` | `interface/http/board/board.controller.ts` |
| Bookmark | BookmarkController | `/api/v1/bookmarks` | `interface/http/bookmark/...` |
| Analytics | AnalyticsController | `/api/v1/analytics` | `interface/http/analytics/analytics.controller.ts` |
| RBAC | RbacController | `/api/v1/rbac` | `interface/http/rbac/rbac.controller.ts` |
| System | SystemController | `/api/v1/system` | `interface/http/system/...` |
| Internal | InternalController | `/api/v1/internal` | `interface/http/internal/...` |
| Health | HealthController | `/api/v1/health` | `interface/http/health/health.controller.ts` |

### Luồng request

```
Client HTTP Request
      │
      ▼
NestJS Router (route matching theo controller path)
      │
      ▼
Guards (JwtAuthGuard → PermissionGuard → AiRateLimitGuard nếu có)
      │
      ▼
ValidationPipe (validate DTO)
      │
      ▼
Controller method
      │
      ▼
Gọi Use Case / Application Service
      │
      ▼
ResponseTransformInterceptor (wrap { success, data, message })
      │
      ▼
HTTP Response → Client
```

---

## 10. Layer: Shared

**Path**: `src/shared/` và `src/interface/` (guards/decorators/filters/interceptors)

### Mục đích

Chứa các thành phần **dùng chung** toàn hệ thống.

### Thành phần chính

| Thành phần | File | Mô tả |
|---|---|---|
| DI Tokens | `src/shared/constants/tokens.ts` | Chuỗi token cho Dependency Injection |
| Pagination Value Object | `src/domain/shared/pagination.value-object.ts` | Value object phân trang |
| Exception Filter | `src/interface/filters/http-exception.filter.ts` | Bắt và format tất cả lỗi toàn cục |
| JWT Auth Guard | `src/interface/guards/jwt-auth.guard.ts` | Kiểm tra JWT access token |
| Permission Guard | `src/interface/guards/permission.guard.ts` | Kiểm tra permission theo `@RequirePermission()` |
| AI Rate Limit Guard | `src/interface/guards/ai-rate-limit.guard.ts` | Giới hạn số lần gọi AI mỗi ngày theo role |
| JWT Strategy | `src/interface/guards/jwt.strategy.ts` | Cấu hình Passport JWT strategy |
| Internal Key Guard | `src/interface/guards/internal-key.guard.ts` | Bảo vệ API nội bộ bằng `x-internal-key` |
| CurrentUser Decorator | `src/interface/decorators/current-user.decorator.ts` | Lấy user object từ request |
| RequirePermission Decorator | `src/interface/decorators/require-permission.decorator.ts` | Đánh dấu permission cần thiết cho endpoint |
| AiFeature Decorator | `src/interface/decorators/ai-feature.decorator.ts` | Đánh dấu loại AI feature để rate limiting |
| Response Interceptor | `src/interface/interceptors/response-transform.interceptor.ts` | Wrap response thành cấu trúc chuẩn |

---

## 11. Mô tả chi tiết từng Module

### Module: Auth

#### Mục đích

Xử lý đăng nhập, làm mới token, đăng xuất, và lấy thông tin user hiện tại.

#### File liên quan

| Layer | File | Vai trò |
|---|---|---|
| Interface | `src/interface/http/auth/auth.controller.ts` | Controller/API |
| Application | `src/application/auth/use-cases/login.use-case.ts` | Xử lý login |
| Application | `src/application/auth/use-cases/refresh-token.use-case.ts` | Xử lý refresh |
| Application | `src/application/auth/use-cases/logout.use-case.ts` | Xử lý logout |
| Application | `src/application/auth/use-cases/get-me.use-case.ts` | Lấy thông tin user |
| Domain | `src/domain/user/entities/user.entity.ts` | User entity, UserStatus enum |
| Domain | `src/domain/user/repositories/user.repository.interface.ts` | IUserRepository |
| Infrastructure | `src/infrastructure/database/typeorm/repositories/user.typeorm-repository.ts` | Implementation |

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/auth/login` | No | Đăng nhập |
| POST | `/api/v1/auth/refresh` | No | Làm mới access token |
| POST | `/api/v1/auth/logout` | JWT | Đăng xuất |
| GET | `/api/v1/auth/me` | JWT | Lấy thông tin user hiện tại |

---

### Module: User

#### Mục đích

Quản lý người dùng: tạo user, cập nhật, xem danh sách, thay đổi trạng thái.

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1/users` | JWT + Permission | Danh sách users |
| POST | `/api/v1/users` | JWT + Permission | Tạo user mới |
| GET | `/api/v1/users/:id` | JWT + Permission | Chi tiết user |
| PATCH | `/api/v1/users/:id` | JWT + Permission | Cập nhật user |
| DELETE | `/api/v1/users/:id` | JWT + Permission | Xóa user |

---

### Module: Subject

#### Mục đích

Quản lý môn học. Mỗi môn học là đơn vị tổ chức tài liệu và chat session.

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1/subjects` | JWT | Danh sách môn học |
| POST | `/api/v1/subjects` | JWT + Permission | Tạo môn học |
| GET | `/api/v1/subjects/:id` | JWT | Chi tiết môn học |
| PATCH | `/api/v1/subjects/:id` | JWT + Permission | Cập nhật môn học |
| DELETE | `/api/v1/subjects/:id` | JWT + Permission | Xóa môn học |

---

### Module: Class

#### Mục đích

Quản lý lớp học. Giảng viên tạo lớp, sinh viên đăng ký vào lớp. Lớp gắn với một môn học cụ thể.

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1/classes` | JWT | Danh sách lớp học |
| POST | `/api/v1/classes` | JWT + Permission | Tạo lớp học |
| POST | `/api/v1/classes/:id/enroll` | JWT | Đăng ký vào lớp |
| DELETE | `/api/v1/classes/:id/enroll` | JWT | Hủy đăng ký |

---

### Module: Document

#### Mục đích

Upload tài liệu học thuật (PDF, file) vào môn học. Sau khi upload, backend tự động gửi AI service xử lý embeddings (vector hóa nội dung) để phục vụ RAG chatbot.

#### File liên quan

| Layer | File | Vai trò |
|---|---|---|
| Interface | `src/interface/http/document/document.controller.ts` | Controller |
| Application | `src/application/document/use-cases/upload-document.use-case.ts` | Xử lý upload |
| Application | `src/application/document/use-cases/summarize-document.use-case.ts` | AI tóm tắt |
| Infrastructure | `src/infrastructure/storage/local-file.service.ts` | Lưu file local |
| Infrastructure | `src/infrastructure/ai/ai-service.client.ts` | Gọi AI service |

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/subjects/:subjectId/documents` | JWT + `document:upload` | Upload tài liệu |
| GET | `/api/v1/subjects/:subjectId/documents` | JWT + `document:read` | Danh sách tài liệu |
| GET | `/api/v1/subjects/:subjectId/documents/:id/summary` | JWT + `ai:summarize-document` | AI tóm tắt |
| DELETE | `/api/v1/subjects/:subjectId/documents/:id` | JWT + `document:delete` | Xóa tài liệu |

#### Ghi chú kỹ thuật

- File upload tối đa **50MB**, lưu vào `UPLOAD_DIR/<subjectId>/<uuid>_<originalname>`.
- Document có các trạng thái: `processing`, `ready`, `error`.
- Sau khi upload, backend gọi `AiServiceClient.processDocument()` — AI service bất đồng bộ xử lý và sau đó callback lại backend qua `InternalModule`.

---

### Module: Chat (RAG)

#### Mục đích

Chatbot RAG cốt lõi. Người dùng tạo chat session gắn với môn học/lớp học, gửi câu hỏi, nhận câu trả lời streaming (SSE) từ AI có trích dẫn nguồn tài liệu.

#### File liên quan

| Layer | File | Vai trò |
|---|---|---|
| Interface | `src/interface/http/chat/chat.controller.ts` | Controller, xử lý SSE stream |
| Application | `src/application/rag/use-cases/prepare-rag-stream.use-case.ts` | Chuẩn bị stream |
| Application | `src/application/rag/use-cases/save-assistant-message.use-case.ts` | Lưu response AI |
| Infrastructure | `src/infrastructure/ai/ai-service.client.ts` | Proxy stream đến LangChain |

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/chats` | JWT + `chat:create` | Tạo chat session |
| GET | `/api/v1/chats` | JWT + `chat:read-own` | Danh sách chat |
| GET | `/api/v1/chats/:id` | JWT + `chat:read-own` | Chi tiết chat + messages |
| DELETE | `/api/v1/chats/:id` | JWT + `chat:read-own` | Xóa chat |
| POST | `/api/v1/chats/:id/messages` | JWT + `ai:chat-rag` + RateLimit | **Gửi message — SSE Stream** |
| POST | `/api/v1/chats/:id/messages/complete` | JWT + `ai:chat-rag` | Lưu message từ AI (sau stream) |

#### Ghi chú kỹ thuật

- Endpoint `/messages` trả về **SSE (Server-Sent Events)** — không phải JSON thông thường.
- Client cần set header `Accept: text/event-stream`.
- Backend giữ lại 20 tin nhắn gần nhất làm `chatHistory` khi gọi AI.
- Title chat được tự động đặt từ 60 ký tự đầu của message đầu tiên.

---

### Module: Flashcard

#### Mục đích

Tạo và học flashcard. Hỗ trợ tạo flashcard thủ công hoặc tự động bằng AI từ tài liệu môn học. Có tính năng cộng đồng (public sets, star, clone).

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/flashcard-sets` | JWT + Permission | Tạo bộ flashcard |
| POST | `/api/v1/flashcard-sets/ai` | JWT + `ai:generate-flashcard` + RateLimit | **AI tạo flashcard** |
| GET | `/api/v1/flashcard-sets` | JWT | Danh sách bộ flashcard của tôi |
| GET | `/api/v1/flashcard-sets/community` | JWT | Flashcard cộng đồng (public) |
| POST | `/api/v1/flashcard-sets/:id/star` | JWT | Đánh dấu yêu thích |
| POST | `/api/v1/flashcard-sets/:id/clone` | JWT | Clone bộ flashcard |
| POST | `/api/v1/flashcard-sets/:id/study-session` | JWT | Bắt đầu phiên học |

---

### Module: Exam

#### Mục đích

Tạo đề thi trắc nghiệm (thủ công hoặc AI) và cho sinh viên làm thử. Theo dõi điểm yếu qua `WeakTopicController`.

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/subjects/:subjectId/exams` | JWT + Permission | Tạo đề thi |
| POST | `/api/v1/subjects/:subjectId/exams/ai` | JWT + `ai:generate-exam` + RateLimit | **AI tạo đề thi** |
| GET | `/api/v1/subjects/:subjectId/exams` | JWT | Danh sách đề thi |
| POST | `/api/v1/subjects/:subjectId/exams/:id/attempt` | JWT | Nộp bài thi |
| GET | `/api/v1/exams/weak-topics` | JWT | Xem điểm yếu |

---

### Module: Study

#### Mục đích

Theo dõi tiến trình học tập của sinh viên: thống kê flashcard đã học, điểm yếu theo chủ đề, kế hoạch học tập.

---

### Module: Badge

#### Mục đích

Hệ thống gamification — trao huy hiệu cho người dùng khi đạt mốc nhất định (học nhiều flashcard, làm nhiều đề thi, v.v.).

---

### Module: Board

#### Mục đích

Diễn đàn hỏi đáp cộng đồng. Người dùng đặt câu hỏi, các thành viên khác trả lời, upvote câu hỏi/câu trả lời.

#### API/Route

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/board/questions` | JWT + Permission | Đăng câu hỏi |
| GET | `/api/v1/board/questions` | JWT | Danh sách câu hỏi |
| GET | `/api/v1/board/questions/:id` | JWT | Chi tiết câu hỏi |
| POST | `/api/v1/board/questions/:id/answers` | JWT | Trả lời câu hỏi |
| POST | `/api/v1/board/questions/:id/upvote` | JWT | Upvote câu hỏi |
| POST | `/api/v1/board/answers/:id/upvote` | JWT | Upvote câu trả lời |

---

### Module: Bookmark

#### Mục đích

Đánh dấu tài liệu yêu thích. Mỗi user có danh sách bookmark riêng.

---

### Module: System

#### Mục đích

Admin quản lý cấu hình hệ thống (system settings như giới hạn AI calls, RAG params), xem audit logs, xem AI usage logs.

#### Ghi chú kỹ thuật

- System settings được lưu dạng key-value trong bảng `system_settings`.
- Key ví dụ: `rag.top_k`, `rag.min_score`, `ai_daily_limit.student.chat_rag`.
- AI Rate Limit Guard đọc setting từ database theo key `ai_daily_limit.<role>.<feature>`.

---

### Module: RBAC

#### Mục đích

Admin quản lý roles và permissions. Gán permission cho role, gán role cho user.

---

### Module: Analytics

#### Mục đích

Thống kê tổng quan hệ thống (số user, số chat, số document, AI usage) dành cho admin.

---

## 12. Flow nghiệp vụ từ đầu đến cuối

### Flow 1: User Login

#### Endpoint bắt đầu

`POST /api/v1/auth/login`

#### File tham gia

| Layer | File | Vai trò |
|---|---|---|
| Interface | `src/interface/http/auth/auth.controller.ts` | Nhận request |
| Application | `src/application/auth/use-cases/login.use-case.ts` | Xử lý use case |
| Application | `src/application/system/services/audit-log.service.ts` | Ghi audit log |
| Domain | `src/domain/user/entities/user.entity.ts` | UserStatus enum |
| Infrastructure | `src/infrastructure/database/typeorm/repositories/user.typeorm-repository.ts` | Query database |

#### Flow từ đầu đến cuối

1. Client gửi `POST /api/v1/auth/login` với body `{ email, password }`.
2. Request vào `AuthController.login()`.
3. `ValidationPipe` validate `LoginDto`.
4. Controller gọi `LoginUseCase.execute(dto)`.
5. UseCase tìm user theo email: `userRepo.findByEmail(dto.email)`.
6. UseCase load user với permissions: `userRepo.findByIdWithPermissions(userId)`.
7. UseCase kiểm tra password với `bcrypt.compare()`.
8. UseCase kiểm tra `UserStatus.SUSPENDED`.
9. UseCase tạo JWT payload: `{ sub: userId, email, role, permissions }`.
10. UseCase ký `accessToken` (15 phút) bằng `JWT_SECRET`.
11. UseCase tạo `rawRefreshToken` (random 64 bytes hex), hash SHA-256, lưu vào DB.
12. Controller ghi audit log `USER_LOGIN` qua `AuditLogService`.
13. Response trả về client qua `ResponseTransformInterceptor`.

#### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant LUC as LoginUseCase
    participant UR as UserRepository
    participant DB as PostgreSQL
    participant ALS as AuditLogService

    C->>AC: POST /api/v1/auth/login {email, password}
    AC->>LUC: execute(dto)
    LUC->>UR: findByEmail(email)
    UR->>DB: SELECT user WHERE email=?
    DB-->>UR: User row
    UR-->>LUC: User entity
    LUC->>UR: findByIdWithPermissions(userId)
    UR->>DB: SELECT user + role + permissions
    DB-->>UR: User + permissions
    UR-->>LUC: User with permissions
    LUC->>LUC: bcrypt.compare(password, hash)
    LUC->>LUC: Check UserStatus
    LUC->>LUC: Sign accessToken (JWT)
    LUC->>LUC: Create refreshToken (SHA-256 hash)
    LUC->>DB: INSERT refresh_tokens
    LUC-->>AC: { accessToken, refreshToken, user }
    AC->>ALS: log(userId, 'USER_LOGIN', ...)
    ALS->>DB: INSERT audit_logs
    AC-->>C: { success: true, data: { accessToken, refreshToken, user } }
```

#### Response thành công

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "a1b2c3...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "role": "student",
      "permissions": ["chat:create", "chat:read-own", "ai:chat-rag"]
    }
  },
  "message": "OK"
}
```

#### Error cases

| Trường hợp | Nơi throw | Response |
|---|---|---|
| Email không tồn tại | `LoginUseCase` | 401 UNAUTHORIZED |
| Sai mật khẩu | `LoginUseCase` | 401 UNAUTHORIZED |
| Tài khoản bị suspend | `LoginUseCase` | 401 Account is suspended |

---

### Flow 2: Refresh Token

#### Endpoint

`POST /api/v1/auth/refresh`

#### Flow

1. Client gửi `{ refreshToken: "raw_token" }`.
2. UseCase hash token bằng SHA-256, tìm trong DB.
3. Kiểm tra token chưa hết hạn và chưa bị revoke.
4. Tạo `accessToken` mới.
5. Xóa refresh token cũ, tạo refresh token mới (rotation).

---

### Flow 3: Upload Document

#### Endpoint bắt đầu

`POST /api/v1/subjects/:subjectId/documents` (multipart/form-data)

#### Flow từ đầu đến cuối

1. Client gửi file (tối đa 50MB) qua multipart form.
2. `FileInterceptor` (Multer) đọc file vào memory (`memoryStorage`).
3. `DocumentController.uploadDocument()` nhận file.
4. `UploadDocumentUseCase.execute(subjectId, file, user)` được gọi.
5. Kiểm tra subject tồn tại.
6. `LocalFileService.saveFile()` lưu file vào `uploads/<subjectId>/<uuid>_<name>`.
7. Tạo Document entity trong DB với `status = 'processing'`.
8. Gọi `AiServiceClient.processDocument(documentId, filePath, subjectId, lecturerId)` bất đồng bộ.
9. AI service nhận file, xử lý embeddings, lưu vào Qdrant, rồi callback backend.
10. Response ngay lập tức với `HTTP 202 Accepted`.

#### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant DC as DocumentController
    participant UDUC as UploadDocumentUseCase
    participant FS as LocalFileService
    participant DR as DocumentRepository
    participant AI as AiServiceClient
    participant LCH as LangChain Service

    C->>DC: POST /subjects/:id/documents (multipart file)
    DC->>UDUC: execute(subjectId, file, user)
    UDUC->>FS: saveFile(file, subjectId)
    FS-->>UDUC: { storedPath, mimeType, fileSizeBytes }
    UDUC->>DR: create(documentEntity, status='processing')
    DR-->>UDUC: Document saved
    UDUC->>AI: processDocument(docId, path, subjectId, lecturerId)
    AI->>LCH: POST /documents/process
    Note over LCH: Bất đồng bộ - xử lý embeddings
    DC-->>C: 202 Accepted { id, originalName, status:'processing' }
    LCH-->>AI: Callback khi xong
    AI->>DR: Update status='ready'
```

---

### Flow 4: RAG Chat Stream

#### Endpoint bắt đầu

`POST /api/v1/chats/:id/messages`

> Client cần set header `Accept: text/event-stream`

#### Flow từ đầu đến cuối

1. Client gửi `{ content: "Câu hỏi của tôi" }`.
2. `AiRateLimitGuard` kiểm tra số lần gọi AI hôm nay theo role+feature.
3. `PrepareRagStreamUseCase.execute()`:
   - Load chat session, kiểm tra ownership.
   - Lấy setting `rag.top_k` và `rag.min_score` từ DB.
   - Load 20 messages gần nhất làm `chatHistory`.
   - Lưu message của user vào DB.
   - Tạo `streamToken` (JWT 5 phút) chứa payload.
4. Controller set headers SSE: `Content-Type: text/event-stream`.
5. Controller gọi `AiServiceClient.streamChat()` — async generator.
6. Mỗi chunk nhận được từ AI được forward ngay ra client.
7. Parse các SSE events: `{ type: 'chunk', content }` và `{ type: 'done', sources }`.
8. Sau khi stream xong, gọi `SaveAssistantMessageUseCase` lưu response đầy đủ vào DB.

#### Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant CC as ChatController
    participant PRSUC as PrepareRagStreamUseCase
    participant CR as ChatRepository
    participant SSUC as SaveAssistantMsgUseCase
    participant AI as AiServiceClient
    participant LCH as LangChain (Python)
    participant QD as Qdrant

    C->>CC: POST /chats/:id/messages {content:"..."}
    Note over CC: AiRateLimitGuard check
    CC->>PRSUC: execute(chatId, dto, user)
    PRSUC->>CR: findById(chatId)
    PRSUC->>CR: findMessages(chatId) - last 20
    PRSUC->>CR: createMessage(user message)
    PRSUC->>AI: issueStreamToken(payload)
    PRSUC-->>CC: { streamToken, streamPayload }
    CC->>CC: Set SSE headers
    CC->>AI: streamChat(streamToken, payload)
    AI->>LCH: POST /chat/stream (Bearer streamToken)
    LCH->>QD: Vector search (top_k docs)
    QD-->>LCH: Relevant chunks
    loop SSE chunks
        LCH-->>AI: data: {"type":"chunk","content":"..."}
        AI-->>CC: chunk
        CC-->>C: SSE forward
    end
    LCH-->>AI: data: {"type":"done","sources":[...]}
    AI-->>CC: done event
    CC->>SSUC: execute(chatId, {content, sources}, user)
    SSUC->>CR: createMessage(assistant message)
    CC-->>C: Connection closed
```

---

### Flow 5: AI Generate Flashcard

#### Endpoint

`POST /api/v1/flashcard-sets/ai`

#### Flow

1. `AiRateLimitGuard` kiểm tra limit `ai:generate-flashcard`.
2. Use case gọi `AiServiceClient.generateFlashcards(subjectId, lecturerId, cardCount, topic, documentIds)`.
3. LangChain service tìm tài liệu liên quan, dùng GPT-4o-mini tạo flashcards.
4. Kết quả `[{ front, back }]` được lưu vào DB thành `FlashcardSet` + `Flashcard` entities.
5. Response trả về bộ flashcard đã tạo.

---

### Flow 6: AI Generate Exam

#### Endpoint

`POST /api/v1/subjects/:subjectId/exams/ai`

#### Flow

1. `AiRateLimitGuard` kiểm tra limit `ai:generate-exam`.
2. Use case gọi `AiServiceClient.generateExam(subjectId, lecturerId, questionCount, difficulty, topic, documentIds)`.
3. LangChain dùng GPT-4o-mini tạo câu hỏi trắc nghiệm có `options`, `correct_answer`, `explanation`.
4. Kết quả lưu vào DB thành `Exam` + `Question` entities.

---

### Flow 7: AI Summarize Document

#### Endpoint

`GET /api/v1/subjects/:subjectId/documents/:id/summary`

#### Flow

1. `AiRateLimitGuard` kiểm tra limit `ai:summarize-document`.
2. `SummarizeDocumentUseCase` kiểm tra document đã có summary chưa (cache trong DB).
3. Nếu chưa: gọi `AiServiceClient.summarizeDocument(documentId)`.
4. Summary được lưu vào DB (`documents.summary`, `documents.summary_generated_at`).
5. Response trả về summary text.

---

### Flow 8: Board Q&A

#### Flow hỏi đáp

1. User tạo câu hỏi: `POST /board/questions` → lưu `BoardQuestion`.
2. User khác trả lời: `POST /board/questions/:id/answers` → lưu `BoardAnswer`.
3. User upvote câu hỏi/trả lời → cập nhật `upvote_count`.
4. Tất cả có thể xem câu hỏi public.

---

### Flow 9: Flashcard Study Session

1. User bắt đầu phiên học: `POST /flashcard-sets/:id/study-session`.
2. Backend tạo `FlashcardStudySession`, load các thẻ chưa học hoặc cần ôn.
3. User học từng thẻ, gửi kết quả (đúng/sai).
4. Backend cập nhật `FlashcardProgress` theo thuật toán spaced repetition.
5. Session kết thúc → cập nhật `StudentStudyStats`.

---

### Flow 10: Exam Attempt (Thi thử)

1. User xem đề thi: `GET /subjects/:subjectId/exams/:id`.
2. User nộp bài: `POST /exams/:id/attempt` với đáp án.
3. Backend chấm điểm, xác định câu sai, phân tích chủ đề yếu.
4. Lưu `ExamAttempt` vào DB.
5. Cập nhật `StudentWeakTopic` với các topic sai nhiều.

---

## 13. API Overview

> Global prefix: `/api/v1`

| Method | Endpoint | Module | Auth | Permission |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | Auth | No | — |
| POST | `/api/v1/auth/refresh` | Auth | No | — |
| POST | `/api/v1/auth/logout` | Auth | JWT | — |
| GET | `/api/v1/auth/me` | Auth | JWT | — |
| GET | `/api/v1/users` | User | JWT | `user:read` |
| POST | `/api/v1/users` | User | JWT | `user:create` |
| GET | `/api/v1/users/:id` | User | JWT | `user:read` |
| PATCH | `/api/v1/users/:id` | User | JWT | `user:update` |
| DELETE | `/api/v1/users/:id` | User | JWT | `user:delete` |
| GET | `/api/v1/subjects` | Subject | JWT | — |
| POST | `/api/v1/subjects` | Subject | JWT | `subject:create` |
| GET | `/api/v1/subjects/:id` | Subject | JWT | — |
| PATCH | `/api/v1/subjects/:id` | Subject | JWT | `subject:update` |
| DELETE | `/api/v1/subjects/:id` | Subject | JWT | `subject:delete` |
| GET | `/api/v1/classes` | Class | JWT | — |
| POST | `/api/v1/classes` | Class | JWT | `class:create` |
| POST | `/api/v1/classes/:id/enroll` | Class | JWT | — |
| POST | `/api/v1/subjects/:subjectId/documents` | Document | JWT | `document:upload` |
| GET | `/api/v1/subjects/:subjectId/documents` | Document | JWT | `document:read` |
| GET | `/api/v1/subjects/:subjectId/documents/:id/summary` | Document | JWT | `ai:summarize-document` |
| DELETE | `/api/v1/subjects/:subjectId/documents/:id` | Document | JWT | `document:delete` |
| POST | `/api/v1/chats` | Chat | JWT | `chat:create` |
| GET | `/api/v1/chats` | Chat | JWT | `chat:read-own` |
| GET | `/api/v1/chats/:id` | Chat | JWT | `chat:read-own` |
| DELETE | `/api/v1/chats/:id` | Chat | JWT | `chat:read-own` |
| POST | `/api/v1/chats/:id/messages` | Chat | JWT + RateLimit | `ai:chat-rag` |
| POST | `/api/v1/chats/:id/messages/complete` | Chat | JWT | `ai:chat-rag` |
| POST | `/api/v1/flashcard-sets` | Flashcard | JWT | `flashcard:create` |
| POST | `/api/v1/flashcard-sets/ai` | Flashcard | JWT + RateLimit | `ai:generate-flashcard` |
| GET | `/api/v1/flashcard-sets` | Flashcard | JWT | — |
| GET | `/api/v1/flashcard-sets/community` | Flashcard | JWT | — |
| POST | `/api/v1/flashcard-sets/:id/star` | Flashcard | JWT | — |
| POST | `/api/v1/flashcard-sets/:id/clone` | Flashcard | JWT | — |
| POST | `/api/v1/subjects/:subjectId/exams` | Exam | JWT | `exam:create` |
| POST | `/api/v1/subjects/:subjectId/exams/ai` | Exam | JWT + RateLimit | `ai:generate-exam` |
| GET | `/api/v1/subjects/:subjectId/exams` | Exam | JWT | — |
| POST | `/api/v1/subjects/:subjectId/exams/:id/attempt` | Exam | JWT | — |
| GET | `/api/v1/board/questions` | Board | JWT | — |
| POST | `/api/v1/board/questions` | Board | JWT | `board:ask` |
| GET | `/api/v1/board/questions/:id` | Board | JWT | — |
| POST | `/api/v1/board/questions/:id/answers` | Board | JWT | `board:answer` |
| POST | `/api/v1/board/questions/:id/upvote` | Board | JWT | — |
| GET | `/api/v1/bookmarks` | Bookmark | JWT | — |
| POST | `/api/v1/bookmarks` | Bookmark | JWT | — |
| DELETE | `/api/v1/bookmarks/:id` | Bookmark | JWT | — |
| GET | `/api/v1/analytics` | Analytics | JWT | `analytics:read` |
| GET | `/api/v1/rbac/roles` | RBAC | JWT | `rbac:read` |
| POST | `/api/v1/rbac/roles` | RBAC | JWT | `rbac:create` |
| GET | `/api/v1/system/settings` | System | JWT | `system:read` |
| PATCH | `/api/v1/system/settings/:key` | System | JWT | `system:update` |
| GET | `/api/v1/health` | Health | No | — |
| POST | `/api/v1/internal/...` | Internal | Internal Key | — |

> **Lưu ý**: Swagger đầy đủ tại `http://localhost:3000/api/docs`.

---

## 14. Database Overview

- **Database**: PostgreSQL 16
- **ORM**: TypeORM 0.3 (`synchronize: true` — tự đồng bộ schema)
- **File config**: `src/infrastructure/database/typeorm/typeorm.module.ts`
- **Tổng số tables**: 30

### ERD Mermaid (theo nhóm chức năng)

#### Nhóm 1: Users, Roles, Permissions, Auth

```mermaid
erDiagram
    roles {
        uuid id PK
        string name UK
    }
    permissions {
        uuid id PK
        string name UK
    }
    roles_permissions {
        uuid role_id FK
        uuid permission_id FK
    }
    users {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        uuid role_id FK
        string status
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamp expires_at
        boolean is_revoked
    }

    roles ||--o{ users : "has"
    roles ||--o{ roles_permissions : "has"
    permissions ||--o{ roles_permissions : "has"
    users ||--o{ refresh_tokens : "has"
```

#### Nhóm 2: Subjects, Classes, Documents

```mermaid
erDiagram
    subjects {
        uuid id PK
        string code UK
        string name
        string description
        uuid created_by FK
    }
    classes {
        uuid id PK
        uuid subject_id FK
        string name
        uuid lecturer_id FK
        string semester
        boolean is_active
    }
    class_enrollments {
        uuid id PK
        uuid class_id FK
        uuid student_id FK
        timestamp enrolled_at
    }
    documents {
        uuid id PK
        uuid subject_id FK
        string original_name
        string stored_path
        string mime_type
        integer file_size_bytes
        string status
        integer chunk_count
        string error_message
        uuid uploaded_by FK
        text summary
        timestamp summary_generated_at
    }

    subjects ||--o{ classes : "has"
    subjects ||--o{ documents : "has"
    classes ||--o{ class_enrollments : "has"
```

#### Nhóm 3: Chat, Messages, AI Logs

```mermaid
erDiagram
    chats {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        uuid class_id FK
        string title
        timestamp created_at
    }
    messages {
        uuid id PK
        uuid chat_id FK
        string role
        text content
        timestamp created_at
    }
    ai_usage_logs {
        uuid id PK
        uuid user_id FK
        string feature
        string date
        integer count
    }
    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        string entity_id
        jsonb metadata
        string ip_address
        timestamp created_at
    }

    chats ||--o{ messages : "has"
    users ||--o{ chats : "has"
    users ||--o{ ai_usage_logs : "tracked"
    users ||--o{ audit_logs : "generates"
```

#### Nhóm 4: Flashcards

```mermaid
erDiagram
    flashcard_sets {
        uuid id PK
        uuid subject_id FK
        uuid class_id FK
        string title
        text description
        boolean is_public
        integer star_count
        uuid cloned_from_id FK
        timestamp published_at
        uuid created_by FK
    }
    flashcards {
        uuid id PK
        uuid set_id FK
        text front
        text back
        integer order_index
    }
    flashcard_set_stars {
        uuid id PK
        uuid set_id FK
        uuid user_id FK
    }
    flashcard_progress {
        uuid id PK
        uuid user_id FK
        uuid flashcard_id FK
        integer ease_factor
        integer interval_days
        timestamp next_review_at
        integer repetitions
    }
    flashcard_study_sessions {
        uuid id PK
        uuid user_id FK
        uuid set_id FK
        integer cards_studied
        integer correct_count
        timestamp started_at
        timestamp ended_at
    }

    flashcard_sets ||--o{ flashcards : "contains"
    flashcard_sets ||--o{ flashcard_set_stars : "starred by"
    flashcards ||--o{ flashcard_progress : "tracked"
    flashcard_sets ||--o{ flashcard_study_sessions : "has"
```

#### Nhóm 5: Exams

```mermaid
erDiagram
    exams {
        uuid id PK
        uuid subject_id FK
        uuid class_id FK
        string title
        text description
        string type
        string difficulty
        integer duration_minutes
        integer question_count
        boolean is_public
        uuid created_by FK
    }
    questions {
        uuid id PK
        uuid exam_id FK
        text content
        jsonb options
        string correct_answer
        text explanation
        string topic
        integer order_index
    }
    exam_attempts {
        uuid id PK
        uuid exam_id FK
        uuid user_id FK
        jsonb answers
        integer score
        integer total_questions
        integer correct_count
        timestamp started_at
        timestamp submitted_at
    }

    exams ||--o{ questions : "has"
    exams ||--o{ exam_attempts : "attempted by"
```

#### Nhóm 6: Study, Board, Badges, System

```mermaid
erDiagram
    student_study_stats {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        integer total_study_minutes
        integer flashcards_studied
        integer exams_taken
        float average_score
    }
    student_weak_topics {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        string topic
        integer error_count
        timestamp last_error_at
    }
    student_study_plans {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        jsonb plan_data
    }
    board_questions {
        uuid id PK
        uuid subject_id FK
        uuid user_id FK
        text content
        string status
        integer upvote_count
    }
    board_answers {
        uuid id PK
        uuid question_id FK
        uuid user_id FK
        text content
        boolean is_accepted
        integer upvote_count
    }
    board_upvotes {
        uuid id PK
        uuid user_id FK
        string target_type
        uuid target_id FK
    }
    user_badges {
        uuid id PK
        uuid user_id FK
        string badge_key
        timestamp earned_at
    }
    bookmarks {
        uuid id PK
        uuid user_id FK
        uuid document_id FK
        timestamp created_at
    }
    system_settings {
        uuid id PK
        string key UK
        text value
        string description
    }
```

---

## 15. Authentication & Authorization

### Authentication

| Thành phần | Mô tả |
|---|---|
| **Login** | `POST /api/v1/auth/login` → trả về access + refresh token |
| **Access Token** | JWT, payload: `{ sub, email, role, permissions }`, TTL: 15 phút, ký bằng `JWT_SECRET` |
| **Refresh Token** | Random 64 bytes hex, lưu dạng SHA-256 hash trong DB, TTL: 7 ngày |
| **Password Hash** | bcrypt |
| **Token rotation** | Refresh mỗi lần trả về token mới, token cũ bị revoke |
| **Header format** | `Authorization: Bearer <accessToken>` |

### Authorization (RBAC)

Hệ thống dùng **Role-Based Access Control (RBAC)** kết hợp **Permission-based**.

| Thành phần | File | Mô tả |
|---|---|---|
| JwtAuthGuard | `src/interface/guards/jwt-auth.guard.ts` | Xác thực JWT |
| JwtStrategy | `src/interface/guards/jwt.strategy.ts` | Đọc user từ JWT payload |
| PermissionGuard | `src/interface/guards/permission.guard.ts` | Kiểm tra `user.permissions.includes(required)` |
| RequirePermission | `src/interface/decorators/require-permission.decorator.ts` | Decorator đánh dấu permission cần thiết |
| CurrentUser | `src/interface/decorators/current-user.decorator.ts` | Lấy user object từ `request.user` |
| AiRateLimitGuard | `src/interface/guards/ai-rate-limit.guard.ts` | Rate limit AI features theo role |
| InternalKeyGuard | `src/interface/guards/internal-key.guard.ts` | Bảo vệ API nội bộ (header `x-internal-key`) |

### Cách gắn permission trên endpoint

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('document:read')
async getDocument() { ... }
```

### AI Rate Limit

Rate limit được cấu hình trong `system_settings` với key pattern:

```
ai_daily_limit.<role>.<feature>
```

Ví dụ:
- `ai_daily_limit.student.chat_rag` = 20 (sinh viên được chat 20 lần/ngày)
- `ai_daily_limit.lecturer.generate_flashcard` = -1 (không giới hạn)

---

## 16. Error Handling & Validation

### Validation

- Dùng **class-validator** + **class-transformer**.
- `ValidationPipe` được bật global với `whitelist: true`, `transform: true`.
- DTO đặt tại `src/application/<module>/dtos/`.

### Exception Handling

**GlobalExceptionFilter** (`src/interface/filters/http-exception.filter.ts`) bắt tất cả lỗi:

| Loại Exception | Xử lý |
|---|---|
| `HttpException` (NestJS) | Lấy status và message từ exception |
| Lỗi không xác định | Log error, trả về 500 INTERNAL_ERROR |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Error Codes Map

| HTTP Status | Code |
|---|---|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `PERMISSION_DENIED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `UNPROCESSABLE_ENTITY` |
| 429 | `TOO_MANY_REQUESTS` / `AI_RATE_LIMIT_EXCEEDED` |
| 500 | `INTERNAL_ERROR` |

### Success Response Format

Mọi response thành công được wrap bởi `ResponseTransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

> **Ngoại lệ**: SSE endpoints (chat stream) không bị wrap — interceptor tự skip khi `Accept: text/event-stream`.

---

## 17. Environment Variables

| Biến | Mục đích | File sử dụng | Ghi chú |
|---|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | `typeorm.module.ts` | Format: `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | Ký access token | `login.use-case.ts`, `jwt.strategy.ts` | Cần > 256 bits |
| `JWT_ACCESS_EXPIRES` | TTL access token | `login.use-case.ts` | Mặc định `15m` |
| `JWT_REFRESH_SECRET` | Cần kiểm tra thêm | — | Khai báo trong `.env.example` |
| `JWT_REFRESH_EXPIRES` | TTL refresh token | `refresh-token.use-case.ts` | Mặc định `7d` |
| `AI_SERVICE_URL` | URL Python LangChain service | `ai-service.client.ts` | Mặc định `http://localhost:8000` |
| `AI_SERVICE_SECRET` | Shared secret với AI service | `ai-service.client.ts` | Dùng làm `x-internal-key` |
| `PORT` | Port chạy server | `main.ts` | Mặc định `3000` |
| `NODE_ENV` | Môi trường (`development`/`production`) | `typeorm.module.ts` | Bật SQL logging khi `development` |
| `UPLOAD_DIR` | Thư mục lưu file upload | `local-file.service.ts` | Mặc định `./uploads` |
| `MAX_FILE_SIZE_MB` | Kích thước file tối đa | Cần kiểm tra thêm | Mặc định 50MB |

> **Lưu ý**: Không commit file `.env` thật. Chỉ dùng `.env.example` làm template.

---

## 18. Setup & Run Project

### Yêu cầu

- Node.js >= 18
- Docker + Docker Compose
- PostgreSQL (hoặc dùng Docker)

### Cài dependencies

```bash
cd backend
npm install
```

### Cấu hình môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin thật
```

### Chạy development

```bash
npm run start:dev
# Watch mode, hot reload
```

### Build production

```bash
npm run build
# Output: dist/
```

### Chạy production

```bash
npm run start
# Node.js chạy dist/main.js
```

### Seed database

```bash
npm run seed
# Tạo roles, permissions, admin user mặc định
```

### Chạy toàn bộ hệ thống bằng Docker Compose

```bash
# Từ root directory (student-chatbox/)
docker-compose up -d
```

Các service được khởi động theo thứ tự:
1. `postgres` (PostgreSQL)
2. `qdrant` (Vector DB)
3. `langchain` (Python AI service, phụ thuộc qdrant)
4. `backend` (NestJS, phụ thuộc postgres + langchain)
5. `frontend` (React + Nginx, phụ thuộc backend)

### Ports mặc định

| Service | Port |
|---|---|
| Backend API | `3000` |
| Swagger UI | `3000/api/docs` |
| LangChain AI | `8000` |
| PostgreSQL | `5432` |
| Qdrant HTTP | `6333` |
| Frontend (Nginx) | `80` / `443` |

### Docker build riêng backend

```bash
cd backend
docker build -t educhat-backend .
docker run -p 3000:3000 --env-file .env educhat-backend
```

---

## 19. Hướng dẫn đọc source code cho developer mới

### Thứ tự đọc đề xuất

```
1. backend/package.json
   → Biết scripts và dependencies

2. backend/src/main.ts
   → Hiểu app bootstrap, CORS, global middleware

3. backend/src/app.module.ts
   → Biết module nào được load

4. backend/src/interface/http/
   → Hiểu API đi vào đâu, controller nào xử lý

5. backend/src/application/
   → Hiểu use case, business logic ở đâu

6. backend/src/domain/
   → Hiểu entity, repository interface, business rules

7. backend/src/infrastructure/
   → Hiểu database config, repository implementation, AI client

8. backend/src/shared/ + src/interface/guards/
   → Hiểu guard, filter, decorator dùng chung

9. backend/.env.example
   → Biết các biến môi trường cần thiết

10. docker-compose.yml
    → Hiểu toàn bộ hệ thống gồm những service nào
```

### Điểm khởi đầu theo task

| Bạn muốn làm gì? | Đọc file nào trước? |
|---|---|
| Thêm API endpoint mới | `src/interface/http/<module>/` |
| Sửa business logic | `src/application/<module>/use-cases/` |
| Thêm database table | `src/infrastructure/database/typeorm/orm-entities/` |
| Thêm permission mới | `src/interface/guards/permission.guard.ts`, `src/interface/decorators/require-permission.decorator.ts` |
| Sửa response format | `src/interface/interceptors/response-transform.interceptor.ts` |
| Sửa error format | `src/interface/filters/http-exception.filter.ts` |
| Thay đổi AI integration | `src/infrastructure/ai/ai-service.client.ts` |
| Thêm system setting | `src/infrastructure/database/typeorm/seeds/` |

### Các pattern quan trọng cần nắm

1. **Dependency Injection Token**: Application layer inject repository bằng `@Inject(TOKENS.XXX_REPO)` — không inject trực tiếp class implementation.
2. **Use Case pattern**: Mỗi business action là một class `XxxUseCase` với method `execute()`.
3. **SSE Stream**: Chat endpoint trả về SSE, không phải JSON — xử lý khác biệt ở controller.
4. **AI Rate Limit**: Mọi endpoint AI đều gắn `AiRateLimitGuard` + `@AiFeature()` decorator.
5. **Audit Log**: Các action quan trọng (login, upload, delete) đều ghi `AuditLog` qua `AuditLogService`.

---

## 20. Đánh giá kiến trúc hiện tại

> **Lưu ý**: Đây là đánh giá và ghi nhận trong tài liệu. Không có thay đổi source code nào được thực hiện.

### Điểm tốt

- ✅ **Phân tách layer rõ ràng**: domain, application, infrastructure, interface — mỗi layer có trách nhiệm riêng.
- ✅ **Dependency Injection Token**: Application layer inject repository qua interface, không phụ thuộc implementation cụ thể.
- ✅ **Plain domain entities**: `User`, `Role`, v.v. là plain TypeScript class, không có decorator NestJS/TypeORM.
- ✅ **Use Case pattern nhất quán**: Mỗi action là một class UseCase riêng, dễ test và maintain.
- ✅ **Global error handling và response format nhất quán**.
- ✅ **AI Rate Limiting** được implement qua Guard, không hardcode trong từng controller.
- ✅ **Audit log** được implement xuyên suốt cho các action quan trọng.
- ✅ **SSE streaming** được implement đúng cách (skip response interceptor, forward chunks).

### Điểm cần kiểm tra thêm

- ⚠️ **Application layer phụ thuộc Infrastructure**: Một số use case inject trực tiếp `AiServiceClient` (infrastructure) thay vì qua interface. Ví dụ: `PrepareRagStreamUseCase` import `AiServiceClient` từ `infrastructure/`.
- ⚠️ **`synchronize: true`** trong TypeORM: Đang bật tự đồng bộ schema ở production (xem `typeorm.module.ts`). Nguy hiểm nếu dùng production DB thật — nên dùng migration.
- ⚠️ **Không có unit test**: Không tìm thấy file `*.spec.ts` trong source code. Cần bổ sung test cho use cases quan trọng.
- ⚠️ **`JWT_REFRESH_SECRET`** được khai báo trong `.env.example` nhưng cần kiểm tra xem có thực sự được dùng để ký refresh token hay không (hiện tại refresh token dùng SHA-256 hash, không phải JWT).
- ⚠️ **File storage local**: Đang lưu file trên local filesystem. Khi scale horizontal (nhiều instance backend), các instance không chia sẻ storage — cần xem xét chuyển sang cloud storage (S3, GCS).

### Gợi ý cải thiện sau này

- 💡 Tạo `IAiServicePort` interface trong domain, để `AiServiceClient` implement — giúp application layer không phụ thuộc trực tiếp vào infrastructure.
- 💡 Chuyển sang TypeORM migrations thay vì `synchronize: true`.
- 💡 Thêm unit test cho use cases, integration test cho repositories.
- 💡 Xem xét chuyển file storage sang dịch vụ cloud (AWS S3, MinIO).
- 💡 Thêm caching layer (Redis) cho system settings hay các query được đọc nhiều.
- 💡 Cân nhắc thêm `Pagination` vào các list API hiện chưa có phân trang.

---

*Tài liệu được tạo lúc: 2026-07-03. Dựa trên source code tại commit hiện tại.*
*Chế độ: Documentation-only — Không có thay đổi source code nào.*
