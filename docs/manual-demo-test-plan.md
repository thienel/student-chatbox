# Manual Demo Test Plan (Comprehensive)

## 1. Environment Setup

### Chạy hệ thống local
Mở 2 terminal riêng biệt:

**Terminal 1: Backend**
```bash
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```
*API: `http://localhost:3000/api/v1`*

**Terminal 2: Frontend**
```bash
cd frontend
npm install
npm run dev
```
*Frontend: `http://localhost:5173`*

---

## 2. Demo Accounts (From Seed)

### Admin
- **Email:** admin@educhat.localord@123 | **Pass:** Admin@123456 | | **Role:** admin
### Lecturer
- **Email:** lecture@educhat.local | **Pass:** @Giahu2404 | **Role:** lecturer
### Student (Active)
- **Email:** student@educhat.local | **Pass:** Student@123456 | **Role:** student

---

## 3. Admin Demo Flow

### 3.1. Admin Login & Dashboard
- **URL:** `/login` -> `/admin`
- **Action:** Đăng nhập.
- **Expected UI:** Dashboard hiển thị overview system stats (total users, active subjects).
- **API:** `POST /auth/login`, `GET /admin/analytics/overview`

### 3.2. Quản lý Settings & AI Limits
- **URL:** `/admin/settings`
- **Action:** Thay đổi giới hạn AI daily quota cho `chat_rag` của student từ 20 lên 50.
- **Expected UI:** Update thành công.
- **API:** `GET /system/settings`, `PATCH /system/settings`

### 3.3. Quản lý RBAC & Audit Logs
- **URL:** `/admin/rbac` và `/admin/audit-logs`
- **Action:** Xem danh sách permission và kiểm tra log đăng nhập.
- **Expected UI:** Bảng Audit Logs ghi lại thao tác update setting vừa rồi.
- **API:** `GET /rbac/roles`, `GET /system/audit-logs`

### 3.4. Quản lý Subjects & Users
- **URL:** `/admin/subjects` và `/admin/users`
- **Action:** Gán Lecturer cho một Subject, xem danh sách user.
- **Expected UI:** Bảng danh sách cập nhật.
- **API:** `GET /subjects`, `PATCH /subjects/:id/assign-lecturer`

### 3.5. Duyệt Student Verification & Allowlist
- **URL:** `/admin/verifications` và `/admin/allowlist`
- **Action:** Approve sinh viên pending, thêm email vào allowlist (Flow như plan trước).

---

## 4. Lecturer Demo Flow

### 4.1. Lecturer Login & Dashboard
- **URL:** `/login` -> `/lecturer/dashboard`
- **Action:** Đăng nhập bằng lecturer1.
- **Expected UI:** Hiển thị danh sách các lớp đang giảng dạy.
- **API:** `GET /lecturer/analytics/dashboard`

### 4.2. Upload Course Documents (Knowledge Base)
- **URL:** `/lecturer/subjects/<subjectId>/documents`
- **Action:** Upload một file PDF học liệu. Bấm nút "Tóm tắt bằng AI" (Summarize).
- file tài liệu mẫu : "C:\Users\ngogi\Downloads\javascript.pdf"
- **Expected UI:** Hiển thị file trong list, status chuyển sang Processed, popup hiện tóm tắt.
- **API:** `POST /documents/upload`, `POST /documents/:id/summarize`


### 4.3. Class Management & Engagement Analytics
- **URL:** `/lecturer/subjects/<subjectId>/classes` và `/lecturer/subjects/<subjectId>/engagement`
- **Action:** Chuyển sang tab Engagement.
- **Expected UI:** Biểu đồ/bảng thống kê mức độ tương tác (chat, làm bài) của sinh viên trong lớp.
- **API:** `GET /analytics/classes/:classId/engagement`

### 4.4. Tạo Official Exam
- **URL:** `/lecturer/subjects/<subjectId>/exams/new`
- **Action:** Nhập thông tin đề thi, tạo các câu hỏi thủ công.
- **Expected UI:** Đề thi xuất hiện trong tab Exams với nhãn `Official`.
- **API:** `POST /subjects/:subjectId/exams`

### 4.5. Q&A Board Management
- **URL:** `/lecturer/subjects/<subjectId>/board`
- **Action:** Tìm câu hỏi của sinh viên, ghim (pin) câu trả lời tốt nhất hoặc close câu hỏi.
- **Expected UI:** Icon pin xuất hiện.
- **API:** `PATCH /board/questions/:id/pin-answer`

---

## 5. Student Demo Flow

### 5.1. RAG Chat & Bookmarks
- **URL:** `/subjects/<subjectId>/chat`
- **Action:** Chat: "Tóm tắt tài liệu chương 1". Sau đó bấm icon Bookmark (Lưu) đoạn chat.
- **Expected UI:** Streaming trả lời kèm citation (nguồn tài liệu do Lecturer upload).
- **API:** `POST /chat/stream`, `POST /bookmarks`

### 5.2. AI Generate Flashcards & Study (FSRS)
- **URL:** `/subjects/<subjectId>/flashcards`
- **Action:** Bấm "Tạo Flashcard bằng AI", chọn topic. Sau đó bấm "Study". Lựa chọn độ khó (Again, Hard, Good, Easy).
- **Expected UI:** Giao diện học lật thẻ bài. FSRS algorithm lên lịch cho thẻ.
- **API:** `POST /flashcards/generate`, `POST /study/sessions/:id/review`

### 5.3. Community Flashcards
- **URL:** `/community`
- **Action:** Publish một bộ flashcard của mình sang Public. Khám phá (Discover) bộ flashcard của người khác, bấm "Star" (Thích) và "Clone" về máy mình.
- **Expected UI:** Bảng Leaderboard cập nhật, bộ flashcard mới hiện trong danh sách cá nhân.
- **API:** `POST /flashcards/community/publish`, `POST /flashcards/community/:id/clone`, `POST /flashcards/community/:id/star`

### 5.4. Exams & Weak Topic Detection
- **URL:** `/subjects/<subjectId>/exams`
- **Action:**
  1. Làm đề Official do Lecturer tạo -> Submit.
  2. Bấm "Tạo đề thi AI" (Generate Exam) -> Làm và Submit.
  3. Chuyển sang tab "Weak Topics".
- **Expected UI:** Kết quả bài thi hiển thị. Tab Weak Topics hiển thị các chủ đề có tỷ lệ đúng < 60%.
- **API:** `POST /subjects/:id/exams/:examId/attempts`, `POST /subjects/:id/exams/generate`, `GET /subjects/:id/weak-topics`

### 5.5. Personalized Study Plan & Badges
- **URL:** `/study-plan` và `/badges`
- **Action:** Truy cập trang Kế hoạch học tập và Danh hiệu.
- **Expected UI:** Hiển thị timeline 7 ngày với số lượng thẻ cần ôn. Hiển thị các badge đã đạt (vd: First Study, Streak 3 days).
- **API:** `GET /study/plan`, `GET /badges/my-badges`

### 5.6. Q&A Board Participation
- **URL:** `/subjects/<subjectId>/board`
- **Action:** Đăng một câu hỏi mới, upvote câu hỏi của người khác.
- **Expected UI:** Câu hỏi hiện trên feed, số vote tăng.
- **API:** `POST /board/questions`, `POST /board/questions/:id/vote`

---

## 6. Role Permission & Negative Tests

### P0 - Chặn phân quyền (RBAC Check)
- Student truy cập `/admin` hoặc `/lecturer/dashboard` -> Bị Redirect về `/home`.
- Lecturer truy cập `/admin` -> Bị Redirect về `/lecturer/dashboard`.
- Cố tình gọi API `POST /documents/upload` bằng token của Student -> API trả về `403 Forbidden`.

### P1 - Kiểm tra giới hạn AI (AI Rate Limiting)
- **Thao tác:** Đăng nhập Student. Spam tính năng "Tạo Flashcard AI" vượt quá quota (vd: limit = 5).
- **Expected UI:** Hiển thị toast lỗi "Bạn đã đạt giới hạn sử dụng AI hôm nay".
- **API:** Trả về `429 Too Many Requests`.

### P1 - FSRS Rules (Spaced Repetition)
- **Thao tác:** Hoàn thành hạn mức thẻ mới trong ngày (vd: 20 thẻ).
- **Expected UI:** Nút Study bị block (thông báo "Bạn đã học xong hôm nay").

---
*End of Comprehensive Demo Test Plan*
