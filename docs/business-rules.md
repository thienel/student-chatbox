# EduChat — Business Rules (Quy tắc nghiệp vụ)

> **Chế độ: Documentation-only.**
> Tài liệu này được trích xuất trực tiếp từ source code. Mỗi rule đều có reference đến file thực tế.
> Không có thay đổi source code nào được thực hiện.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Người dùng & Phân quyền (RBAC)](#2-người-dùng--phân-quyền-rbac)
3. [Authentication (Xác thực)](#3-authentication-xác-thực)
4. [Tài liệu học thuật (Document)](#4-tài-liệu-học-thuật-document)
5. [RAG Chatbot (Chat)](#5-rag-chatbot-chat)
6. [Flashcard](#6-flashcard)
7. [Học Flashcard (Study / Spaced Repetition)](#7-học-flashcard-study--spaced-repetition)
8. [Đề thi (Exam)](#8-đề-thi-exam)
9. [Diễn đàn hỏi đáp (Board)](#9-diễn-đàn-hỏi-đáp-board)
10. [Huy hiệu (Badge / Gamification)](#10-huy-hiệu-badge--gamification)
11. [Giới hạn sử dụng AI (AI Rate Limit)](#11-giới-hạn-sử-dụng-ai-ai-rate-limit)
12. [Lớp học & Môn học (Class & Subject)](#12-lớp-học--môn-học-class--subject)
13. [Bookmark](#13-bookmark)
14. [Quy tắc hệ thống chung](#14-quy-tắc-hệ-thống-chung)

---

## 1. Tổng quan hệ thống

**EduChat** là hệ thống RAG Chatbot nội bộ dành cho trường đại học với các actor chính:

| Actor | Mô tả |
|---|---|
| **Admin** | Quản trị viên hệ thống — toàn quyền |
| **Lecturer** (Giảng viên) | Quản lý môn học, upload tài liệu, tạo đề thi, điều phối lớp học |
| **Student** (Sinh viên) | Chat với AI, học flashcard, làm đề thi, hỏi đáp trên board |

**Nguyên tắc truy cập dữ liệu cốt lõi:**

> Mọi nội dung học thuật (tài liệu, flashcard, đề thi, câu trả lời RAG) đều được truy vấn trong phạm vi **knowledge base của giảng viên dạy môn đó**. Sinh viên chỉ nhận được câu trả lời từ AI dựa trên tài liệu của giảng viên dạy lớp mình.

---

## 2. Người dùng & Phân quyền (RBAC)

### BR-RBAC-01 — Mô hình phân quyền

- Hệ thống dùng **Role-Based Access Control (RBAC)** kết hợp Permission-based.
- Mỗi user có **đúng một role** (`admin`, `lecturer`, `student`).
- Role có danh sách **permissions** dạng chuỗi (ví dụ: `chat:create`, `document:upload`, `ai:chat-rag`).
- JWT access token mang payload: `{ sub, email, role, permissions[] }`.

> **File**: `src/application/auth/use-cases/login.use-case.ts`

### BR-RBAC-02 — Kiểm tra permission trên endpoint

- Mọi endpoint bảo vệ đều yêu cầu user phải có **permission đúng** trong danh sách `user.permissions`.
- Nếu permission không khớp → **403 PERMISSION_DENIED**.
- Decorator `@RequirePermission('xxx:yyy')` khai báo permission cần thiết trên từng handler.

> **File**: `src/interface/guards/permission.guard.ts`, `src/interface/decorators/require-permission.decorator.ts`

### BR-RBAC-03 — Moderator là Lecturer/Admin

- Trong toàn hệ thống, **moderator** được định nghĩa là user có role `lecturer` hoặc `admin`.
- Moderator có thêm quyền trên Board (close question, pin answer, xóa bất kỳ nội dung).

> **File**: `src/application/board/board.service.ts` — `isModerator()`

### BR-RBAC-04 — Trạng thái tài khoản

- User có thể ở trạng thái `active` hoặc `suspended`.
- Tài khoản bị `suspended` **không thể đăng nhập** — bị reject ngay trong bước login.

> **File**: `src/application/auth/use-cases/login.use-case.ts`, `src/domain/user/entities/user.entity.ts`

---

## 3. Authentication (Xác thực)

### BR-AUTH-01 — Đăng nhập

- User đăng nhập bằng **email + password**.
- Password được so sánh với hash lưu trong DB bằng `bcrypt.compare()`.
- Nếu email không tồn tại hoặc password sai → **401 "Invalid credentials"** (không phân biệt để chống brute-force enumeration).
- Nếu tài khoản bị `suspended` → **401 "Account is suspended"**.

> **File**: `src/application/auth/use-cases/login.use-case.ts`

### BR-AUTH-02 — Cấp token khi đăng nhập thành công

- Trả về **access token** (JWT, TTL: 15 phút, ký bằng `JWT_SECRET`).
- Trả về **refresh token** (random 64 bytes hex, lưu dạng SHA-256 hash trong DB, TTL: 7 ngày).
- Payload của JWT: `{ sub: userId, email, role, permissions[] }`.

> **File**: `src/application/auth/use-cases/login.use-case.ts`

### BR-AUTH-03 — Refresh token

- Refresh token được lưu dạng **SHA-256 hash** trong bảng `refresh_tokens` (không lưu raw token).
- Khi refresh: client gửi raw token → server hash lại → tìm trong DB.
- Nếu token **không tồn tại**, **đã revoke** (`revokedAt != null`), hoặc **hết hạn** (`expiresAt < now`) → **401 "Invalid or expired refresh token"**.
- Sau khi refresh thành công → chỉ trả về `accessToken` mới (refresh token **không bị rotation** trong implementation hiện tại).

> **File**: `src/application/auth/use-cases/refresh-token.use-case.ts`

### BR-AUTH-04 — Đăng xuất

- Logout revoke refresh token bằng cách đặt `revokedAt = now`.
- Access token không bị blacklist (stateless JWT) — hết hạn tự nhiên sau 15 phút.

> **File**: `src/application/auth/use-cases/logout.use-case.ts`

### BR-AUTH-05 — Ghi Audit Log

- Login **thành công** → ghi `USER_LOGIN` vào audit log.
- Login **thất bại** → ghi `USER_LOGIN_FAILED` (kể cả khi email không tồn tại).

> **File**: `src/interface/http/auth/auth.controller.ts`

---

## 4. Tài liệu học thuật (Document)

### BR-DOC-01 — Loại file được phép upload

Chỉ chấp nhận các loại file:

| MIME Type | Loại |
|---|---|
| `application/pdf` | PDF |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | DOCX |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | PPTX |

File loại khác → **400 "Only PDF, DOCX, and PPTX files are allowed"**.

> **File**: `src/application/document/use-cases/upload-document.use-case.ts`

### BR-DOC-02 — Giới hạn kích thước file

- Kích thước file tối đa: **50 MB** (giới hạn ở tầng Multer).

> **File**: `src/interface/http/document/document.controller.ts`

### BR-DOC-03 — Quyền upload

- Chỉ user có permission `document:upload` mới được upload.
- Nếu user là **lecturer**: chỉ được upload vào môn học mình được **phân công** (`isLecturerAssigned`). Nếu không phân công → **403 "You are not assigned to this subject"**.
- **Admin** không bị giới hạn bởi rule phân công.

> **File**: `src/application/document/use-cases/upload-document.use-case.ts`

### BR-DOC-04 — Trạng thái tài liệu

Document có 3 trạng thái:

| Trạng thái | Mô tả |
|---|---|
| `processing` | Mới upload, đang chờ AI service xử lý embeddings |
| `ready` | AI đã xử lý xong, sẵn sàng dùng cho RAG |
| `error` | AI xử lý thất bại |

- Document mới tạo luôn có trạng thái `processing`.
- Sau khi upload, backend gửi yêu cầu đến AI service **bất đồng bộ (fire & forget)**.
- Upload trả về **HTTP 202 Accepted** ngay lập tức — không đợi AI xử lý.

> **File**: `src/application/document/use-cases/upload-document.use-case.ts`

### BR-DOC-05 — Quyền xóa tài liệu

- User có permission `document:delete` được xóa.
- Nếu user là **lecturer**: chỉ được xóa tài liệu **do chính mình upload** (`document.uploadedBy === currentUser.id`). Nếu không → **403 "You can only delete documents you uploaded"**.
- **Admin** có thể xóa bất kỳ tài liệu nào.
- Khi xóa: xóa vectors khỏi Qdrant → xóa file local → xóa record DB (theo đúng thứ tự này).

> **File**: `src/application/document/use-cases/delete-document.use-case.ts`

### BR-DOC-06 — Tóm tắt tài liệu bằng AI (Summarize)

- Document **phải ở trạng thái `ready`** mới được tóm tắt. Nếu chưa ready → **409 Conflict "Document is not ready for summarization"**.
- User phải **thuộc cùng knowledge base** của giảng viên (qua `ClassContextService.resolveLecturerId`). Nếu không → **404 Not Found**.
- Summary được **cache** trong DB (`documents.summary`). Nếu đã có summary → trả về ngay, **không gọi lại AI**, không tính vào usage log.
- Nếu gọi AI thất bại → **502 Bad Gateway**, không ghi usage log, không lưu cache.
- Chỉ khi tóm tắt thành công mới ghi vào `ai_usage_logs`.

> **File**: `src/application/document/use-cases/summarize-document.use-case.ts`

---

## 5. RAG Chatbot (Chat)

### BR-CHAT-01 — Tạo chat session

- Chat session phải gắn với **một môn học** cụ thể (`subjectId`).
- Hệ thống tự động resolve `classId` từ context của user (sinh viên đang học lớp nào trong môn đó).
- Title mặc định nếu không truyền: `"Cuộc trò chuyện mới"`.
- Cần permission `chat:create`.

> **File**: `src/application/rag/use-cases/create-chat.use-case.ts`

### BR-CHAT-02 — Quyền truy cập chat

- User chỉ được xem/xóa **chat của chính mình**.
- Admin được xem/xóa chat của bất kỳ ai.
- Nếu cố truy cập chat người khác → **403 Forbidden**.
- Cần permission `chat:read-own`.

> **File**: `src/application/rag/use-cases/get-chat.use-case.ts`, `src/interface/http/chat/chat.controller.ts`

### BR-CHAT-03 — Gửi message & RAG Stream

- Cần permission `ai:chat-rag`.
- Phải qua `AiRateLimitGuard` — kiểm tra giới hạn daily usage trước khi gửi.
- Message của user được **lưu vào DB trước** khi gọi AI service.
- Hệ thống lấy **20 messages gần nhất** làm `chatHistory` để gửi đến AI (context window).
- Response từ AI được **stream ngay** về client qua SSE (Server-Sent Events) — client phải set `Accept: text/event-stream`.
- Sau khi stream hoàn tất, response đầy đủ được lưu vào DB.

> **File**: `src/application/rag/use-cases/prepare-rag-stream.use-case.ts`, `src/interface/http/chat/chat.controller.ts`

### BR-CHAT-04 — Tự động đặt tiêu đề chat

- Nếu chat **chưa có message nào**, tiêu đề sẽ tự động được đặt bằng **60 ký tự đầu** của message đầu tiên.

> **File**: `src/application/rag/use-cases/prepare-rag-stream.use-case.ts`

### BR-CHAT-05 — RAG parameters

- `top_k` (số chunk tài liệu trả về): đọc từ `system_settings` với key `rag.top_k` (mặc định: 5).
- `min_score` (ngưỡng relevance tối thiểu): đọc từ `system_settings` với key `rag.min_score` (mặc định: 0.4).

> **File**: `src/application/rag/use-cases/prepare-rag-stream.use-case.ts`

### BR-CHAT-06 — Stream token bảo mật

- Backend tạo **JWT ngắn hạn (TTL: 5 phút)** chứa toàn bộ context (chatId, subjectId, userId, lecturerId, v.v.) để xác thực với AI service.
- AI service không được gọi trực tiếp từ client — phải qua backend proxy.

> **File**: `src/infrastructure/ai/ai-service.client.ts`

---

## 6. Flashcard

### BR-FC-01 — Tạo flashcard thủ công

- Cần permission `flashcard:create`.
- Flashcard set mặc định là **private** (`isPublic: false`).

### BR-FC-02 — Tạo flashcard bằng AI

- Cần permission `ai:generate-flashcard`.
- Phải qua `AiRateLimitGuard`.
- AI tạo flashcard từ **knowledge base của giảng viên** của lớp học hiện tại của user.
- Số card mặc định: **10** nếu không chỉ định.
- Flashcard set do AI tạo mặc định là **public** (`isPublic: true`).
- Title auto-generated: `"Flashcards: {topic}"` hoặc `"Flashcards: {subject.name}"`.
- Ghi vào `ai_usage_logs` sau khi tạo thành công.

> **File**: `src/application/flashcard/use-cases/generate-flashcards.use-case.ts`

### BR-FC-03 — Publish flashcard set (công khai)

- Chỉ **người tạo** set mới được thay đổi visibility.
- Để publish (set `isPublic: true`): set phải có **tối thiểu 3 thẻ**. Nếu ít hơn → **422 "A set needs at least 3 cards to be published"**.
- Không có giới hạn số thẻ tối đa.

> **File**: `src/application/flashcard/use-cases/set-flashcard-visibility.use-case.ts`

### BR-FC-04 — Star (yêu thích) flashcard set

- Chỉ được star **set public**.
- Mỗi user chỉ được star **một lần** mỗi set. Star lần 2 → **409 "You have already starred this set"**.
- Star tăng `star_count` trên bảng `flashcard_sets`.

> **File**: `src/application/flashcard/use-cases/star-flashcard-set.use-case.ts`

### BR-FC-05 — Clone flashcard set

- Chỉ được clone **set public** (hoặc set của chính mình).
- Khi **student** clone: bản clone được gắn với `classId` của lớp student đang học môn đó.
- Khi role khác (lecturer/admin) clone: bản clone không gắn class (`classId = undefined`).
- Clone không trỏ đến set gốc (không track nguồn gốc — field `clonedFromId` có trong DB nhưng logic hiện tại không set).

> **File**: `src/application/flashcard/use-cases/clone-flashcard-set.use-case.ts`

### BR-FC-06 — Xóa flashcard set

- Chỉ **người tạo** hoặc **admin** được xóa.

---

## 7. Học Flashcard (Study / Spaced Repetition)

### BR-STU-01 — Thuật toán lên lịch học

- Hệ thống dùng **FSRS-4.5** (Free Spaced Repetition Scheduler) — thuật toán spaced repetition hiện đại.
- Target retention rate: **90%** (xác suất nhớ được thẻ khi đến hạn).
- Số ngày đến lần review tiếp theo = **stability** của thẻ (được tính theo công thức FSRS).
- Khoảng cách tối đa giữa các lần review: **36,500 ngày** (~100 năm).
- Khoảng cách tối thiểu: **1 ngày**.

> **File**: `src/domain/study/services/fsrs-scheduler.ts`

### BR-STU-02 — Rating khi review thẻ

Người dùng đánh giá từng thẻ theo 4 mức:

| Rating | Giá trị | Ý nghĩa |
|---|---|---|
| Again | 1 | Quên hoàn toàn, lặp lại sớm |
| Hard | 2 | Nhớ được nhưng khó |
| Good | 3 | Nhớ đúng, bình thường |
| Easy | 4 | Nhớ rất dễ |

> **File**: `src/domain/study/services/fsrs-scheduler.ts`, `src/application/study/use-cases/review-card.use-case.ts`

### BR-STU-03 — Phiên học (Study Session)

- Mỗi user chỉ có **một phiên học active** tại một thời điểm cho mỗi flashcard set.
- Nếu phiên học cũ hơn **24 giờ**: tự động bị đánh dấu `abandoned` và tạo phiên mới.
- Phiên học kết thúc (`completed`) khi **không còn thẻ nào trong queue** (cả thẻ đến hạn lẫn thẻ mới).
- Progress (stability, difficulty, interval) của mỗi thẻ được lưu ngay sau mỗi lần review — không bị mất khi session abandoned.

> **File**: `src/application/study/use-cases/start-study-session.use-case.ts`, `src/application/study/use-cases/review-card.use-case.ts`

### BR-STU-04 — Giới hạn thẻ mới mỗi ngày

- Có giới hạn số **thẻ mới** có thể học mỗi ngày (configurable qua Study Settings).
- Thẻ "mới" = thẻ chưa từng review lần nào.
- Thẻ đến hạn ôn tập không bị giới hạn.

> **File**: `src/application/study/use-cases/review-card.use-case.ts` — `remainingNewAllowance()`

---

## 8. Đề thi (Exam)

### BR-EX-01 — Loại đề thi

| Loại | `type` | Ai tạo | Mặc định |
|---|---|---|---|
| AI-generated | `ai_generated` | Bất kỳ user có permission | Private |
| Official | `official` | Lecturer/Admin | Private |

### BR-EX-02 — Tạo đề thi bằng AI

- Cần permission `ai:generate-exam`.
- Phải qua `AiRateLimitGuard`.
- AI tạo câu hỏi từ **knowledge base của giảng viên** của lớp học hiện tại.
- Số câu mặc định: **10** nếu không chỉ định.
- Độ khó mặc định: **`medium`** (các giá trị: `easy`, `medium`, `hard`).
- Đề thi AI mặc định **private** (`isPublic: false`).
- Ghi vào `ai_usage_logs` sau khi tạo thành công.

> **File**: `src/application/exam/use-cases/generate-exam.use-case.ts`

### BR-EX-03 — Tạo đề thi chính thức (Official Exam)

- Chỉ Lecturer (phải dạy lớp đó) hoặc Admin.
- Đề thi official **private** mặc định.
- Mỗi câu hỏi phải có **đúng 4 options với keys A, B, C, D**.
- `correctAnswer` phải trùng với một trong các keys A/B/C/D. Vi phạm → **422 Unprocessable Entity**.
- Đề thi phải có **tối thiểu 1 câu hỏi**. Nếu không → **422**.

> **File**: `src/application/exam/use-cases/create-official-exam.use-case.ts`, `src/application/exam/use-cases/official-exam.helpers.ts`

### BR-EX-04 — Quyền truy cập đề thi

- Chỉ **người tạo đề thi** mới được bắt đầu làm bài (`StartAttempt`). Người khác → **403 "You do not have access to this exam"**.
- Khi trả về câu hỏi để làm bài: **ẩn `correctAnswer` và `explanation`** (chỉ trả về content + options).

> **File**: `src/application/exam/use-cases/start-attempt.use-case.ts`

### BR-EX-05 — Làm bài & nộp bài (Attempt)

- Chỉ **người sở hữu attempt** (`attempt.userId === user.id`) mới được nộp.
- Attempt phải thuộc đúng exam đang được tham chiếu.
- Có 2 action khi gọi submit:
  - `save_progress`: lưu đáp án tạm thời, không chấm điểm.
  - `submit`: chấm điểm, đánh dấu `completed`.
- **Công thức tính điểm**: `score = (correctCount / totalQuestions) * 10`, làm tròn 2 chữ số thập phân. Thang điểm **0-10**.
- Sau khi submit → **tự động cập nhật weak topics** của student cho môn học đó.

> **File**: `src/application/exam/use-cases/submit-attempt.use-case.ts`

### BR-EX-06 — Weak Topics (Điểm yếu)

- Sau mỗi lần nộp bài, hệ thống **tái tính toán** weak topics của student từ toàn bộ lịch sử attempt trong môn học.
- Weak topic được xác định theo field `topic` của từng câu hỏi bị trả lời sai.

> **File**: `src/application/exam/use-cases/submit-attempt.use-case.ts`

---

## 9. Diễn đàn hỏi đáp (Board)

### BR-BD-01 — Kiểm soát quyền truy cập Board

- Mọi thao tác trên Board đều yêu cầu user phải là **thành viên của lớp học** đó:
  - Student: phải đã enroll vào lớp.
  - Lecturer: phải là giảng viên dạy lớp.
  - Admin: luôn được phép.
- Nếu không phải thành viên → **403 Forbidden**.

> **File**: `src/application/board/board.service.ts` — `assertMember()`

### BR-BD-02 — Đặt câu hỏi

- User phải là thành viên lớp.
- Sau khi đặt câu hỏi → hệ thống **tự động evaluate badge** cho user.

> **File**: `src/application/board/board.service.ts` — `createQuestion()`

### BR-BD-03 — Chỉnh sửa câu hỏi

- Chỉ **tác giả** mới được sửa câu hỏi của mình.
- Câu hỏi đã có **ít nhất 1 câu trả lời** → **không được sửa** → **409 "Cannot edit a question that already has answers"**.

> **File**: `src/application/board/board.service.ts` — `updateQuestion()`

### BR-BD-04 — Xóa câu hỏi

- **Tác giả**: chỉ xóa được nếu câu hỏi **chưa có câu trả lời nào**.
- **Moderator** (Lecturer/Admin): xóa bất kỳ câu hỏi nào kể cả đã có câu trả lời.

> **File**: `src/application/board/board.service.ts` — `deleteQuestion()`

### BR-BD-05 — Đóng câu hỏi

- Chỉ **Moderator** (Lecturer/Admin) mới được đóng câu hỏi (`status = 'closed'`).
- Câu hỏi đã đóng → không ai được thêm câu trả lời mới.

> **File**: `src/application/board/board.service.ts` — `closeQuestion()`

### BR-BD-06 — Trả lời câu hỏi

- Câu hỏi phải ở trạng thái `open` (không `closed`). Nếu `closed` → **409 "Question is closed"**.
- Tác giả của câu hỏi **không được tự trả lời câu hỏi của mình** → **403 "You cannot answer your own question"**.
- Mỗi user chỉ được **trả lời tối đa 1 lần** cho mỗi câu hỏi → **409 "You have already answered this question"**.

> **File**: `src/application/board/board.service.ts` — `createAnswer()`

### BR-BD-07 — Sửa câu trả lời

- Chỉ **tác giả** mới được sửa câu trả lời của mình.
- Câu trả lời đã được **pin** → **không được sửa** → **409 "Cannot edit a pinned answer"**.

> **File**: `src/application/board/board.service.ts` — `updateAnswer()`

### BR-BD-08 — Xóa câu trả lời

- **Tác giả**: chỉ xóa được câu trả lời **chưa bị pin**.
- **Moderator**: xóa bất kỳ câu trả lời nào kể cả đã pin.

> **File**: `src/application/board/board.service.ts` — `deleteAnswer()`

### BR-BD-09 — Pin câu trả lời

- Chỉ **Moderator** (Lecturer/Admin) mới được pin/unpin câu trả lời.
- Pin là **toggle** (pin → unpin → pin).
- Khi một câu trả lời được **pin**: hệ thống tự động **evaluate badge** cho tác giả câu trả lời đó.

> **File**: `src/application/board/board.service.ts` — `pinAnswer()`

### BR-BD-10 — Upvote

- Upvote câu hỏi/câu trả lời là **toggle** (vote → unvote → vote).
- User phải là thành viên lớp để upvote.

> **File**: `src/application/board/board.service.ts` — `upvoteQuestion()`, `upvoteAnswer()`

### BR-BD-11 — Phân trang danh sách câu hỏi

- Mặc định sắp xếp theo **số upvote** (giảm dần).
- Hỗ trợ sort theo `newest` (mới nhất trước).
- Page size cố định: **20 câu hỏi/trang**.

> **File**: `src/application/board/board.service.ts` — `listQuestions()`

---

## 10. Huy hiệu (Badge / Gamification)

### BR-BAD-01 — Nguyên tắc trao huy hiệu

- Huy hiệu được trao **tự động** (idempotent) — an toàn để gọi nhiều lần.
- Mỗi huy hiệu chỉ được trao **đúng 1 lần** cho mỗi user.
- Huy hiệu được evaluate (kiểm tra và trao nếu đủ điều kiện) sau các sự kiện: đặt câu hỏi, pin answer.

> **File**: `src/application/badge/badge.service.ts`

### BR-BAD-02 — Danh mục huy hiệu

| Badge ID | Tên | Điều kiện |
|---|---|---|
| `first_session` | First Steps 👣 | Hoàn thành phiên học flashcard đầu tiên |
| `streak_3` | On a Roll 🔥 | Học liên tiếp **3 ngày** |
| `streak_7` | Week Warrior 🔥 | Học liên tiếp **7 ngày** |
| `streak_30` | Iron Will 🏆 | Học liên tiếp **30 ngày** |
| `cards_100` | Card Shark 📚 | Review tổng cộng **100 thẻ** |
| `cards_500` | Card Master 📚 | Review tổng cộng **500 thẻ** |
| `first_share` | Knowledge Sharer 🔗 | Publish bộ flashcard **public** đầu tiên |
| `stars_10_single` | Popular Set ⭐ | Nhận **10 stars** trên một bộ flashcard |
| `stars_50_total` | Star Collector ✨ | Nhận tổng cộng **50 stars** trên tất cả bộ |
| `exam_perfect` | Exam Ace 🥇 | Đạt **100% (điểm 10)** trong bất kỳ đề thi nào |
| `exam_80_five` | High Achiever 🥇 | Đạt **≥ 80% (≥ điểm 8)** trong **5 đề thi** khác nhau |
| `first_question` | Curious Mind ❓ | Đặt câu hỏi đầu tiên trên Board |
| `answer_pinned` | Peer Expert 📌 | Có câu trả lời được giảng viên **pin** |

> **File**: `src/domain/badge/badge-catalogue.ts`

---

## 11. Giới hạn sử dụng AI (AI Rate Limit)

### BR-AI-01 — Nguyên tắc rate limiting

- Mọi endpoint AI đều bị giới hạn **theo ngày**, **theo user**, **theo feature**, và **theo role**.
- Giới hạn được cấu hình trong `system_settings` theo pattern key: `ai_daily_limit.<role>.<feature>`.

> **File**: `src/interface/guards/ai-rate-limit.guard.ts`

### BR-AI-02 — Các AI features bị giới hạn

| Feature key | Endpoint | Mô tả |
|---|---|---|
| `chat_rag` | `POST /chats/:id/messages` | RAG chat với AI |
| `summarize_document` | `GET /documents/:id/summary` | Tóm tắt tài liệu |
| `generate_flashcard` | `POST /flashcard-sets/ai` | Tạo flashcard bằng AI |
| `generate_exam` | `POST /exams/ai` | Tạo đề thi bằng AI |

### BR-AI-03 — Giới hạn mặc định

- Mặc định: **20 lượt/ngày** nếu không có setting trong DB.
- Giá trị **-1** = không giới hạn.
- Giới hạn **reset lúc 00:00 mỗi ngày**.

> **File**: `src/interface/guards/ai-rate-limit.guard.ts`

### BR-AI-04 — Khi vượt giới hạn

- Response: **429 Too Many Requests** với code `AI_RATE_LIMIT_EXCEEDED`.
- Response body bao gồm: `limit`, `used`, `resetsAt` (timestamp 00:00 ngày hôm sau).

### BR-AI-05 — Cập nhật usage log

- Usage log chỉ được tăng khi AI call **thành công**.
- Nếu AI service trả lỗi → không tính vào usage.
- SSE stream: usage **không được ghi** ở tầng Guard — guard chỉ check, ghi log được thực hiện trong use case riêng.

---

## 12. Lớp học & Môn học (Class & Subject)

### BR-CLS-01 — Quan hệ Class — Subject

- Mỗi Class thuộc về **đúng một Subject**.
- Một Subject có thể có **nhiều Class** (nhiều giảng viên hoặc nhiều kỳ học).

### BR-CLS-02 — Giảng viên và lớp học

- Mỗi Class có **một giảng viên** (`lecturer_id`).
- Giảng viên khi upload tài liệu phải được **phân công** vào Subject đó.
- Knowledge base của AI được tổ chức theo cặp `(subjectId, lecturerId)` — sinh viên chỉ nhận câu trả lời từ tài liệu của giảng viên dạy lớp mình.

### BR-CLS-03 — Sinh viên và lớp học

- Sinh viên **enroll** vào một lớp học cụ thể.
- Tất cả tính năng AI (chat, flashcard, exam) của sinh viên đều được scoped theo lớp học đang enroll.

### BR-CLS-04 — ClassContext resolution

Hệ thống dùng `ClassContextService` để resolve context lớp học:

- **`resolveClassId`**: tìm `classId` phù hợp với user trong môn học đó.
- **`getLecturerIdForClass`**: lấy `lecturerId` từ `classId`.
- **`resolveLecturerId`**: kết hợp cả hai — lấy lecturerId phù hợp với user trong context hiện tại.
- **`assertAccess`**: kiểm tra user có quyền truy cập vào class không.

> **File**: `src/application/class/services/class-context.service.ts`

---

## 13. Bookmark

### BR-BM-01 — Đánh dấu tài liệu

- User bookmark một **document** cụ thể.
- Mỗi user–document pair chỉ bookmark được **một lần** (unique constraint).
- Bookmark là riêng tư của từng user.

---

## 14. Quy tắc hệ thống chung

### BR-SYS-01 — Format response chuẩn

**Response thành công:**
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

**Response lỗi:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
```

**Ngoại lệ**: SSE endpoints (chat stream) không bị wrap — bypass interceptor.

> **File**: `src/interface/interceptors/response-transform.interceptor.ts`, `src/interface/filters/http-exception.filter.ts`

### BR-SYS-02 — Error codes chuẩn

| HTTP Status | Code |
|---|---|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `PERMISSION_DENIED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `UNPROCESSABLE_ENTITY` |
| 429 | `TOO_MANY_REQUESTS` / `AI_RATE_LIMIT_EXCEEDED` |
| 502 | `BAD_GATEWAY` |
| 500 | `INTERNAL_ERROR` |

### BR-SYS-03 — Audit Logging

Các hành động sau đây được ghi vào `audit_logs`:

| Event | Trigger |
|---|---|
| `USER_LOGIN` | Login thành công |
| `USER_LOGIN_FAILED` | Login thất bại |
| `DOCUMENT_UPLOADED` | Upload tài liệu thành công |
| `DOCUMENT_DELETED` | Xóa tài liệu |

> **File**: `src/interface/http/auth/auth.controller.ts`, `src/interface/http/document/document.controller.ts`

### BR-SYS-04 — System Settings

- Cấu hình hệ thống được lưu dạng **key-value** trong bảng `system_settings`.
- Admin có thể thay đổi settings qua API.
- Các settings quan trọng:

| Key | Ý nghĩa | Mặc định |
|---|---|---|
| `rag.top_k` | Số chunks tài liệu trả về từ vector search | 5 |
| `rag.min_score` | Ngưỡng relevance tối thiểu | 0.4 |
| `ai_daily_limit.<role>.<feature>` | Giới hạn AI theo role và feature | 20 |

### BR-SYS-05 — API Internal (nội bộ)

- Các endpoint internal (ví dụ: AI service callback) được bảo vệ bằng **`x-internal-key` header**.
- Giá trị phải khớp với `AI_SERVICE_SECRET` trong môi trường.
- Không cần JWT.

> **File**: `src/interface/guards/internal-key.guard.ts`

### BR-SYS-06 — Validation tổng quát

- Tất cả request body được validate bởi **class-validator** qua `ValidationPipe` global.
- `whitelist: true`: loại bỏ fields không khai báo trong DTO.
- `transform: true`: tự động chuyển đổi kiểu dữ liệu.

---

## Bảng tổng hợp nhanh — Business Rule theo Module

| Module | Rule quan trọng nhất |
|---|---|
| **Auth** | Refresh token dùng SHA-256 hash; token bị hacked không lộ raw token |
| **User** | Tài khoản suspended không login được |
| **Document** | Chỉ PDF/DOCX/PPTX; max 50MB; Lecturer chỉ xóa doc của mình |
| **Chat RAG** | Giữ 20 messages context; title auto-set từ message đầu tiên |
| **Flashcard** | Cần ≥ 3 thẻ để publish; AI flashcard luôn public |
| **Study** | FSRS-4.5, session TTL 24h, target retention 90% |
| **Exam** | Official exam cần A/B/C/D; điểm thang 10; submit tự cập nhật weak topics |
| **Board** | Không tự trả lời câu hỏi của mình; 1 answer per user per question; pin = moderator only |
| **Badge** | 13 badges, idempotent, chỉ trao 1 lần |
| **AI Rate Limit** | Daily limit per role/feature; -1 = unlimited; reset 00:00 |

---

*Tài liệu được tạo lúc: 2026-07-03. Trích xuất từ source code thực tế.*
*Chế độ: Documentation-only — Không có thay đổi source code nào.*
