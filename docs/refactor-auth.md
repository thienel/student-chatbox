# Plan Refactor User Registration & Student Verification cho FPT University Chatbot

## 0. Mục tiêu refactor

Refactor lại phần `User` để hệ thống chatbot của trường FPT xử lý đúng business rule:

1. Sinh viên chỉ được đăng ký tài khoản `Student` chính thức bằng email sinh viên FPT.
2. Email FPT phải được xác minh bằng OTP hoặc verification link trước khi tài khoản được active.
3. Sinh viên chưa có hoặc không truy cập được email FPT phải đi qua luồng xác minh thủ công.
4. Người ngoài trường không được tạo tài khoản `Student`.
5. Bảng `users` chỉ nên quản lý thông tin tài khoản chính.
6. Thông tin xác minh thủ công phải tách sang bảng riêng để dễ quản lý, duyệt, từ chối và audit.

---

## 1. Phạm vi cần làm

Cần làm lại các phần sau:

```txt
UserOrmEntity
StudentVerificationRequestOrmEntity
UserStatus enum
VerificationRequestStatus enum
Auth/Register flow
Email verification flow
Manual verification flow
Admin review flow
Migration database
DTO validation
Service logic
Response message
Basic tests hoặc manual test cases
```

Không được tự ý refactor toàn bộ project ngoài phạm vi này.

---

## 2. Nguyên tắc thiết kế

### 2.1. Không để user mới đăng ký active ngay

Sai:

```ts
status: 'active'
```

Đúng:

```ts
status: 'pending_email_verification'
```

hoặc nếu là manual verification:

```ts
status: 'pending_manual_verification'
```

### 2.2. Không lưu thông tin manual verification trong bảng users

Không nên để trực tiếp trong `users`:

```txt
campus
personalEmail
reasonForNoFptEmail
idCardUrl
```

Những field này phải tách sang bảng:

```txt
student_verification_requests
```

### 2.3. Không trả passwordHash ra API

Field `passwordHash` phải có:

```ts
select: false
```

Khi login cần check password thì query riêng bằng `addSelect`.

### 2.4. Không hard-code domain email FPT trong nhiều nơi

Domain email sinh viên FPT nên được config tập trung, ví dụ:

```env
ALLOWED_STUDENT_EMAIL_DOMAINS=@student.fpt.edu.vn,@fpt.edu.vn,@fu.edu.vn
```

Sau đó service đọc từ config.

### 2.5. Email phải normalize

Trước khi lưu email cần xử lý:

```txt
trim
lowercase
```

Ví dụ:

```txt
SE123456@FPT.EDU.VN → se123456@fpt.edu.vn
```

---

## 3. Database design mới

### 3.1. Bảng `users`

Bảng `users` chỉ quản lý tài khoản chính.

Các field nên có:

```txt
id
email
password_hash
full_name
student_code
role_id
status
email_verified_at
last_login_at
metadata
created_by
created_at
updated_at
```

Ý nghĩa:

| Field             | Ý nghĩa                      |
| ----------------- | ---------------------------- |
| id                | UUID định danh user          |
| email             | Email đăng nhập              |
| password_hash     | Mật khẩu đã hash             |
| full_name         | Họ tên người dùng            |
| student_code      | Mã số sinh viên, nullable    |
| role_id           | FK đến bảng roles            |
| status            | Trạng thái tài khoản         |
| email_verified_at | Thời điểm xác minh email     |
| last_login_at     | Thời điểm đăng nhập gần nhất |
| metadata          | Dữ liệu mở rộng nếu cần      |
| created_by        | Admin tạo tài khoản nếu có   |
| created_at        | Ngày tạo                     |
| updated_at        | Ngày cập nhật                |

---

### 3.2. Enum `UserStatus`

Tạo enum:

```ts
export enum UserStatus {
  PENDING_EMAIL_VERIFICATION = 'pending_email_verification',
  PENDING_MANUAL_VERIFICATION = 'pending_manual_verification',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}
```

Ý nghĩa:

| Status                      | Ý nghĩa                                    |
| --------------------------- | ------------------------------------------ |
| pending_email_verification  | Đã đăng ký email FPT nhưng chưa xác minh   |
| pending_manual_verification | Chưa có email FPT, đang chờ admin xác minh |
| active                      | Tài khoản hợp lệ                           |
| rejected                    | Bị từ chối xác minh                        |
| suspended                   | Bị khóa                                    |

---

### 3.3. Entity `UserOrmEntity` sau khi refactor

```ts
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity';

export enum UserStatus {
  PENDING_EMAIL_VERIFICATION = 'pending_email_verification',
  PENDING_MANUAL_VERIFICATION = 'pending_manual_verification',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Index('idx_users_email', ['email'])
@Index('idx_users_role_id', ['roleId'])
@Index('idx_users_status', ['status'])
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'student_code', length: 50, nullable: true })
  studentCode?: string | null;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleOrmEntity, {
    eager: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id' })
  role: RoleOrmEntity;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_EMAIL_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }
}
```

---

## 4. Bảng `student_verification_requests`

### 4.1. Mục tiêu

Bảng này dùng cho sinh viên thật nhưng:

```txt
chưa có email FPT
mất quyền truy cập email FPT
email trường chưa được cấp
email trường bị lỗi
```

Tài khoản này chưa được active cho đến khi admin duyệt.

---

### 4.2. Enum `VerificationRequestStatus`

```ts
export enum VerificationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEED_MORE_INFO = 'need_more_info',
}
```

---

### 4.3. Entity `StudentVerificationRequestOrmEntity`

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

export enum VerificationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEED_MORE_INFO = 'need_more_info',
}

@Entity('student_verification_requests')
@Index('idx_student_verification_user_id', ['userId'])
@Index('idx_student_verification_status', ['status'])
@Index('idx_student_verification_student_code', ['studentCode'])
export class StudentVerificationRequestOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @Column({ name: 'student_code', length: 50 })
  studentCode: string;

  @Column({ length: 100, nullable: true })
  campus?: string | null;

  @Column({ name: 'personal_email', length: 255 })
  personalEmail: string;

  @Column({ name: 'reason_for_no_fpt_email', type: 'text' })
  reasonForNoFptEmail: string;

  @Column({ name: 'student_card_url', length: 255, nullable: true })
  studentCardUrl?: string | null;

  @Column({
    type: 'enum',
    enum: VerificationRequestStatus,
    default: VerificationRequestStatus.PENDING,
  })
  status: VerificationRequestStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 5. Business flow cần implement

## 5.1. Flow 1: Sinh viên đăng ký bằng email FPT

### API đề xuất

```txt
POST /auth/register/student
```

### Request body

```json
{
  "email": "se123456@fpt.edu.vn",
  "password": "Password@123",
  "fullName": "Nguyen Van A"
}
```

### Logic xử lý

```txt
1. Normalize email.
2. Check email format.
3. Check email domain có thuộc allowed student domains không.
4. Nếu không hợp lệ → reject.
5. Check email đã tồn tại chưa.
6. Hash password.
7. Lấy role Student.
8. Tạo user với:
   status = pending_email_verification
   emailVerifiedAt = null
9. Tạo OTP hoặc verification token.
10. Gửi email xác minh.
11. Trả message yêu cầu user kiểm tra email.
```

### Response thành công

```json
{
  "message": "Tài khoản đã được tạo. Vui lòng kiểm tra email FPT để xác minh tài khoản.",
  "code": "PENDING_EMAIL_VERIFICATION"
}
```

### Response nếu email không thuộc FPT

```json
{
  "message": "Vui lòng sử dụng email sinh viên FPT để đăng ký tài khoản Student.",
  "code": "INVALID_STUDENT_EMAIL_DOMAIN"
}
```

---

## 5.2. Flow 2: Xác minh email FPT

### API đề xuất

```txt
POST /auth/verify-email
```

### Request body nếu dùng OTP

```json
{
  "email": "se123456@fpt.edu.vn",
  "otp": "123456"
}
```

### Logic xử lý

```txt
1. Normalize email.
2. Tìm user theo email.
3. Check user tồn tại.
4. Check user status có phải pending_email_verification không.
5. Check OTP/token hợp lệ.
6. Check OTP/token chưa hết hạn.
7. Update user:
   emailVerifiedAt = current timestamp
   status = active
8. Xóa hoặc revoke OTP/token đã dùng.
9. Trả response thành công.
```

### Response thành công

```json
{
  "message": "Xác minh email thành công. Tài khoản của bạn đã được kích hoạt.",
  "code": "EMAIL_VERIFIED"
}
```

---

## 5.3. Flow 3: Sinh viên không có email FPT gửi yêu cầu xác minh thủ công

### API đề xuất

```txt
POST /student-verification/request
```

### Request body

```json
{
  "email": "personal.email@gmail.com",
  "password": "Password@123",
  "fullName": "Nguyen Van A",
  "studentCode": "SE123456",
  "campus": "FPT University HCM",
  "personalEmail": "personal.email@gmail.com",
  "reasonForNoFptEmail": "Em là sinh viên mới và chưa được cấp email trường.",
  "studentCardUrl": "https://cloudinary.com/example/student-card.jpg"
}
```

### Logic xử lý

```txt
1. Normalize email và personalEmail.
2. Không cho dùng email FPT ở flow này. Nếu là email FPT thì yêu cầu dùng flow register student.
3. Check email đã tồn tại chưa.
4. Validate studentCode.
5. Hash password.
6. Lấy role Student.
7. Tạo user với:
   email = personal email
   status = pending_manual_verification
   emailVerifiedAt = null
8. Tạo student_verification_requests với:
   status = pending
9. Trả response đang chờ admin duyệt.
```

### Response thành công

```json
{
  "message": "Yêu cầu xác minh sinh viên đã được gửi. Vui lòng chờ quản trị viên xét duyệt.",
  "code": "MANUAL_VERIFICATION_PENDING"
}
```

---

## 5.4. Flow 4: Admin duyệt yêu cầu xác minh

### API đề xuất

```txt
PATCH /admin/student-verifications/:id/approve
```

### Logic xử lý

```txt
1. Chỉ admin được gọi API này.
2. Tìm verification request.
3. Check request đang ở trạng thái pending hoặc need_more_info.
4. Update request:
   status = approved
   reviewedBy = current admin id
   reviewedAt = current timestamp
5. Update user:
   status = active
   studentCode = request.studentCode
6. Trả response thành công.
```

### Response

```json
{
  "message": "Tài khoản sinh viên đã được xác minh thành công.",
  "code": "STUDENT_VERIFICATION_APPROVED"
}
```

---

## 5.5. Flow 5: Admin từ chối yêu cầu xác minh

### API đề xuất

```txt
PATCH /admin/student-verifications/:id/reject
```

### Request body

```json
{
  "rejectionReason": "Thông tin thẻ sinh viên chưa rõ ràng."
}
```

### Logic xử lý

```txt
1. Chỉ admin được gọi API này.
2. Tìm verification request.
3. Check request còn có thể xử lý.
4. Update request:
   status = rejected
   rejectionReason = input
   reviewedBy = current admin id
   reviewedAt = current timestamp
5. Update user:
   status = rejected
6. Trả response.
```

### Response

```json
{
  "message": "Yêu cầu xác minh đã bị từ chối.",
  "code": "STUDENT_VERIFICATION_REJECTED"
}
```

---

## 5.6. Flow 6: Admin yêu cầu bổ sung thông tin

### API đề xuất

```txt
PATCH /admin/student-verifications/:id/request-more-info
```

### Request body

```json
{
  "rejectionReason": "Vui lòng bổ sung ảnh thẻ sinh viên rõ hơn."
}
```

### Logic xử lý

```txt
1. Chỉ admin được gọi API này.
2. Update request:
   status = need_more_info
   rejectionReason = input
   reviewedBy = current admin id
   reviewedAt = current timestamp
3. User vẫn giữ status:
   pending_manual_verification
4. Trả response.
```

---

## 6. Login rule cần cập nhật

Khi user login:

```txt
1. Check email/password.
2. Nếu sai → trả lỗi.
3. Nếu status = pending_email_verification:
   không cho login đầy đủ
   trả message yêu cầu xác minh email.
4. Nếu status = pending_manual_verification:
   không cho login đầy đủ
   trả message đang chờ admin duyệt.
5. Nếu status = rejected:
   không cho login
   trả message tài khoản bị từ chối.
6. Nếu status = suspended:
   không cho login
   trả message tài khoản bị khóa.
7. Nếu status = active:
   cho login và cấp token.
```

Response ví dụ:

```json
{
  "message": "Tài khoản chưa được xác minh email. Vui lòng kiểm tra email để kích hoạt tài khoản.",
  "code": "ACCOUNT_PENDING_EMAIL_VERIFICATION"
}
```

```json
{
  "message": "Tài khoản sinh viên của bạn đang chờ quản trị viên xác minh.",
  "code": "ACCOUNT_PENDING_MANUAL_VERIFICATION"
}
```

---

## 7. DTO cần tạo hoặc chỉnh sửa

### 7.1. `RegisterStudentDto`

```ts
export class RegisterStudentDto {
  email: string;
  password: string;
  fullName: string;
}
```

Validation:

```txt
email required
email valid
password required
password strong enough
fullName required
fullName max length 255
```

---

### 7.2. `VerifyEmailDto`

```ts
export class VerifyEmailDto {
  email: string;
  otp: string;
}
```

Validation:

```txt
email required
otp required
otp length 6 nếu dùng OTP 6 số
```

---

### 7.3. `CreateStudentVerificationRequestDto`

```ts
export class CreateStudentVerificationRequestDto {
  email: string;
  password: string;
  fullName: string;
  studentCode: string;
  campus?: string;
  personalEmail: string;
  reasonForNoFptEmail: string;
  studentCardUrl?: string;
}
```

Validation:

```txt
email required
password required
fullName required
studentCode required
personalEmail required
reasonForNoFptEmail required
studentCardUrl optional
```

---

### 7.4. `RejectStudentVerificationDto`

```ts
export class RejectStudentVerificationDto {
  rejectionReason: string;
}
```

---

### 7.5. `RequestMoreInfoDto`

```ts
export class RequestMoreInfoDto {
  rejectionReason: string;
}
```

---

## 8. Service cần tạo hoặc chỉnh sửa

### 8.1. `AuthService`

Cần có các method:

```ts
registerStudent(dto: RegisterStudentDto)
verifyEmail(dto: VerifyEmailDto)
login(dto: LoginDto)
```

---

### 8.2. `StudentVerificationService`

Cần có các method:

```ts
createManualVerificationRequest(dto: CreateStudentVerificationRequestDto)
getPendingRequests()
getRequestDetail(id: string)
approveRequest(id: string, adminId: string)
rejectRequest(id: string, adminId: string, reason: string)
requestMoreInfo(id: string, adminId: string, reason: string)
```

---

### 8.3. `EmailDomainService` hoặc helper riêng

Tạo service/helper để check domain:

```ts
isAllowedStudentEmail(email: string): boolean
```

Logic:

```txt
1. Normalize email.
2. Lấy phần domain sau @.
3. So sánh với config allowed domains.
4. Return true/false.
```

Không được check kiểu `email.includes('fpt')`.

Sai:

```ts
email.includes('fpt')
```

Đúng:

```ts
email.endsWith('@fpt.edu.vn')
```

hoặc check bằng danh sách domain config.

---

## 9. Migration cần tạo

Không dùng `synchronize: true` cho môi trường nghiêm túc.

Tạo migration để:

### 9.1. Update bảng `users`

Thêm hoặc chỉnh các cột:

```txt
student_code nullable
status enum
email_verified_at nullable
last_login_at nullable
metadata jsonb nullable
created_by uuid nullable
password_hash select false không ảnh hưởng DB nhưng ảnh hưởng entity
```

Nếu đang có các cột này trong users:

```txt
campus
personal_email
reason_for_no_fpt_email
id_card_url
```

thì cân nhắc:

```txt
Nếu database chưa có data thật → drop khỏi users.
Nếu đã có data thật → migrate data sang student_verification_requests trước rồi mới drop.
```

### 9.2. Tạo bảng `student_verification_requests`

Tạo các cột:

```txt
id uuid primary key
user_id uuid not null FK users(id)
student_code varchar(50) not null
campus varchar(100) nullable
personal_email varchar(255) not null
reason_for_no_fpt_email text not null
student_card_url varchar(255) nullable
status enum default pending
reviewed_by uuid nullable
reviewed_at timestamp nullable
rejection_reason text nullable
created_at timestamp
updated_at timestamp
```

### 9.3. Index

Tạo index:

```txt
users.email
users.role_id
users.status
student_verification_requests.user_id
student_verification_requests.status
student_verification_requests.student_code
```

---

## 10. Role và permission

Cần đảm bảo có role:

```txt
Student
Admin
Guest hoặc Visitor nếu hệ thống có người ngoài trường
```

Rule:

```txt
Student active → dùng chatbot nội bộ
Student pending_email_verification → không dùng chatbot nội bộ
Student pending_manual_verification → không dùng chatbot nội bộ
Guest/Visitor → chỉ dùng chatbot public FAQ nếu có
Admin → duyệt manual verification
```

Nếu project chưa có permission system, tối thiểu cần guard theo role admin cho các API:

```txt
/admin/student-verifications/*
```

---

## 11. Response message chuẩn hóa

Dùng message thân thiện, không trả lỗi kỹ thuật.

### Email không thuộc FPT

```json
{
  "message": "Vui lòng sử dụng email sinh viên FPT để đăng ký tài khoản Student.",
  "code": "INVALID_STUDENT_EMAIL_DOMAIN"
}
```

### Email đã tồn tại

```json
{
  "message": "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng chức năng quên mật khẩu.",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

### Đăng ký email FPT thành công

```json
{
  "message": "Tài khoản đã được tạo. Vui lòng kiểm tra email FPT để xác minh tài khoản.",
  "code": "PENDING_EMAIL_VERIFICATION"
}
```

### Manual verification pending

```json
{
  "message": "Yêu cầu xác minh sinh viên đã được gửi. Vui lòng chờ quản trị viên xét duyệt.",
  "code": "MANUAL_VERIFICATION_PENDING"
}
```

### Login khi chưa xác minh email

```json
{
  "message": "Tài khoản chưa được xác minh email. Vui lòng kiểm tra email để kích hoạt tài khoản.",
  "code": "ACCOUNT_PENDING_EMAIL_VERIFICATION"
}
```

### Login khi đang chờ admin duyệt

```json
{
  "message": "Tài khoản sinh viên của bạn đang chờ quản trị viên xác minh.",
  "code": "ACCOUNT_PENDING_MANUAL_VERIFICATION"
}
```

---

## 12. Batch implementation plan

## Batch 1: Audit code hiện tại

### Việc cần làm

1. Tìm toàn bộ file liên quan:

   * user entity
   * role entity
   * auth service
   * register DTO
   * login service
   * migration hiện có
   * seed role nếu có
2. Ghi lại API register/login hiện tại.
3. Không sửa logic trong batch này nếu chưa cần.

### Output cần báo lại

```txt
Danh sách file đã kiểm tra
Luồng register hiện tại
Luồng login hiện tại
Những field user hiện đang dùng
Những chỗ sẽ bị ảnh hưởng khi đổi status
```

Dừng lại để người dùng review trước khi sang batch 2.

---

## Batch 2: Refactor User entity và enum

### Việc cần làm

1. Tạo `UserStatus enum`.
2. Sửa `UserOrmEntity`.
3. Thêm:

   * studentCode
   * emailVerifiedAt
   * lastLoginAt
   * metadata
   * createdBy
4. Sửa `passwordHash` thành `select: false`.
5. Sửa `roleId` thành type `uuid`.
6. Thêm normalize email bằng `BeforeInsert`, `BeforeUpdate`.
7. Xóa hoặc chuẩn bị bỏ các field manual verification khỏi user entity:

   * campus
   * personalEmail
   * reasonForNoFptEmail
   * idCardUrl

### Không được làm

```txt
Không đổi tên bảng users
Không đổi id user
Không đổi quan hệ role nếu không cần
Không bật eager role
Không để status default active
```

### Output cần báo lại

```txt
User entity mới
Enum mới
Danh sách field đã thêm/xóa/sửa
Các điểm có thể breaking change
```

Dừng lại để người dùng review trước khi sang batch 3.

---

## Batch 3: Tạo StudentVerificationRequest entity

### Việc cần làm

1. Tạo enum `VerificationRequestStatus`.
2. Tạo entity `StudentVerificationRequestOrmEntity`.
3. Tạo quan hệ `ManyToOne` với `UserOrmEntity`.
4. Thêm index cần thiết.
5. Đăng ký entity vào module/typeorm config nếu project cần.

### Không được làm

```txt
Không lưu giấy tờ xác minh vào users
Không dùng eager true
Không xóa user khi reject verification
```

### Output cần báo lại

```txt
Entity mới
Quan hệ với users
Danh sách index
```

Dừng lại để người dùng review trước khi sang batch 4.

---

## Batch 4: Migration database

### Việc cần làm

1. Generate hoặc viết migration thủ công.
2. Migration phải:

   * update users table
   * tạo enum status nếu dùng PostgreSQL enum
   * tạo bảng student_verification_requests
   * tạo FK
   * tạo index
3. Nếu có field cũ trong users thì xử lý:

   * drop nếu chưa có data thật
   * migrate data nếu đã có data thật

### Không được làm

```txt
Không dùng synchronize: true để thay migration
Không drop bảng users
Không mất dữ liệu user hiện có
```

### Output cần báo lại

```txt
Tên file migration
SQL hoặc TypeORM migration summary
Cách chạy migration
Cách rollback nếu có lỗi
```

Dừng lại để người dùng review trước khi sang batch 5.

---

## Batch 5: Implement register bằng email FPT

### Việc cần làm

1. Tạo hoặc sửa `RegisterStudentDto`.
2. Tạo helper/service check domain email.
3. Đọc allowed domains từ config/env.
4. Sửa `AuthService.registerStudent`.
5. Khi register:

   * email hợp lệ domain FPT
   * user chưa tồn tại
   * hash password
   * role Student
   * status pending_email_verification
   * gửi OTP/link xác minh
6. Trả response message chuẩn.

### Không được làm

```txt
Không active user ngay sau register
Không check email bằng includes('fpt')
Không bỏ qua bước xác minh email
Không trả passwordHash
```

### Output cần báo lại

```txt
API register student đã sửa
Config env cần thêm
Ví dụ request/response
```

Dừng lại để người dùng review trước khi sang batch 6.

---

## Batch 6: Implement email verification

### Việc cần làm

1. Tạo hoặc sửa `VerifyEmailDto`.
2. Implement API verify email.
3. Check OTP/token:

   * đúng
   * chưa hết hạn
   * chưa dùng
4. Update user:

   * status = active
   * emailVerifiedAt = now
5. Revoke hoặc xóa OTP/token sau khi dùng.

### Không được làm

```txt
Không verify nếu user không tồn tại
Không verify nếu token hết hạn
Không giữ OTP usable sau khi verify
```

### Output cần báo lại

```txt
API verify email
Luồng xác minh
Ví dụ request/response
```

Dừng lại để người dùng review trước khi sang batch 7.

---

## Batch 7: Implement manual verification request

### Việc cần làm

1. Tạo DTO `CreateStudentVerificationRequestDto`.
2. Tạo `StudentVerificationService`.
3. Tạo API:

   * `POST /student-verification/request`
4. Logic:

   * email cá nhân không thuộc domain FPT
   * check email chưa tồn tại
   * tạo user status pending_manual_verification
   * tạo verification request status pending
5. Trả response chuẩn.

### Không được làm

```txt
Không cho tài khoản manual verification active ngay
Không cho dùng role Admin/Staff ở flow này
Không lưu reason/document trong users
```

### Output cần báo lại

```txt
API manual verification
Service mới
Ví dụ request/response
```

Dừng lại để người dùng review trước khi sang batch 8.

---

## Batch 8: Implement admin review APIs

### Việc cần làm

Tạo các API:

```txt
GET /admin/student-verifications
GET /admin/student-verifications/:id
PATCH /admin/student-verifications/:id/approve
PATCH /admin/student-verifications/:id/reject
PATCH /admin/student-verifications/:id/request-more-info
```

Logic:

```txt
Chỉ admin được truy cập
Approve → request approved, user active
Reject → request rejected, user rejected
Request more info → request need_more_info, user vẫn pending_manual_verification
```

### Không được làm

```txt
Không cho student tự approve
Không approve request đã rejected
Không approve nếu user không tồn tại
Không bỏ qua reviewedBy/reviewedAt
```

### Output cần báo lại

```txt
Danh sách API admin
Guard/role protection đã dùng
Ví dụ request/response
```

Dừng lại để người dùng review trước khi sang batch 9.

---

## Batch 9: Update login rule

### Việc cần làm

Sửa login để check user status:

```txt
pending_email_verification → chặn login, yêu cầu verify email
pending_manual_verification → chặn login, yêu cầu chờ admin duyệt
rejected → chặn login
suspended → chặn login
active → cấp token
```

Khi query login phải addSelect passwordHash vì entity đã `select: false`.

### Không được làm

```txt
Không cấp token cho user chưa active
Không trả passwordHash trong response
Không gom mọi lỗi thành một message mơ hồ nếu frontend cần code rõ
```

### Output cần báo lại

```txt
Login flow mới
Các status bị chặn
Ví dụ response lỗi
```

Dừng lại để người dùng review trước khi sang batch 10.

---

## Batch 10: Test và cleanup

### Test cases cần kiểm tra

#### Register bằng email FPT

```txt
Email FPT hợp lệ → tạo user pending_email_verification
Email không FPT → reject
Email đã tồn tại → reject
Email uppercase → normalize lowercase
```

#### Verify email

```txt
OTP đúng → active user
OTP sai → reject
OTP hết hạn → reject
OTP dùng lại → reject
```

#### Manual verification

```txt
Email cá nhân → tạo user pending_manual_verification
Tạo verification request pending
Email đã tồn tại → reject
Thiếu studentCode → reject
Thiếu reason → reject
```

#### Admin review

```txt
Admin approve → user active
Admin reject → user rejected
Admin request more info → request need_more_info
Student gọi API admin → forbidden
```

#### Login

```txt
User active → login được
User pending_email_verification → không login
User pending_manual_verification → không login
User rejected → không login
User suspended → không login
```

### Cleanup

```txt
Format code
Remove unused imports
Check lint
Check migration run
Check app start
Check Swagger nếu có
Update README/API docs nếu có
```

---

## 13. Checklist hoàn thành

Phần refactor được xem là hoàn thành khi:

```txt
[ ] User entity không còn chứa field manual verification trực tiếp
[ ] Có UserStatus enum
[ ] Default user status không còn là active
[ ] passwordHash có select: false
[ ] Có emailVerifiedAt
[ ] Có studentCode
[ ] Có StudentVerificationRequest entity
[ ] Có VerificationRequestStatus enum
[ ] Có migration database
[ ] Register email FPT tạo user pending_email_verification
[ ] Verify email chuyển user thành active
[ ] Manual verification tạo user pending_manual_verification
[ ] Admin approve chuyển user thành active
[ ] Admin reject chuyển user thành rejected
[ ] Login chỉ cấp token cho user active
[ ] Không trả passwordHash ra response
[ ] Có response message/code rõ ràng cho frontend
```

---

## 14. Lưu ý quan trọng cho AI coding

1. Không refactor lan sang module không liên quan.
2. Không đổi route cũ nếu frontend đang dùng, trừ khi thật sự cần.
3. Nếu đổi API contract, phải báo rõ breaking change.
4. Không tự ý đổi tên database table `users`.
5. Không dùng `synchronize: true` để thay migration.
6. Không để user mới đăng ký active ngay.
7. Không bỏ qua email verification.
8. Không dùng `email.includes('fpt')` để check domain.
9. Không lưu password plain text.
10. Không trả `passwordHash` trong bất kỳ response nào.
11. Không lưu giấy tờ xác minh trong bảng `users`.
12. Không cho user pending dùng chatbot nội bộ.
13. Không cho non-admin gọi API duyệt verification.
14. Sau mỗi batch phải dừng lại, báo file đã sửa và chờ người dùng kiểm tra/duyệt trước khi làm batch tiếp theo.

---

## 15. Prompt ngắn để đưa cho AI coding

Bạn hãy refactor phần User Registration & Student Verification của project NestJS + TypeORM theo plan sau:

* Bảng `users` chỉ quản lý account chính.
* Không để user mới đăng ký active ngay.
* Tạo enum `UserStatus` gồm:

  * `pending_email_verification`
  * `pending_manual_verification`
  * `active`
  * `rejected`
  * `suspended`
* Sửa `UserOrmEntity`:

  * `passwordHash` có `select: false`
  * `status` dùng enum, default `pending_email_verification`
  * thêm `studentCode`
  * thêm `emailVerifiedAt`
  * thêm `lastLoginAt`
  * thêm `metadata`
  * thêm `createdBy`
  * normalize email lowercase/trim
  * roleId type uuid
* Tách các field manual verification khỏi users:

  * `campus`
  * `personalEmail`
  * `reasonForNoFptEmail`
  * `idCardUrl`
* Tạo entity mới `StudentVerificationRequestOrmEntity` cho bảng `student_verification_requests`.
* Tạo enum `VerificationRequestStatus` gồm:

  * `pending`
  * `approved`
  * `rejected`
  * `need_more_info`
* Implement flow:

  * Student register bằng email FPT → tạo user `pending_email_verification`, gửi OTP/link.
  * Verify email → user thành `active`.
  * Student không có email FPT → tạo user `pending_manual_verification` và tạo verification request `pending`.
  * Admin approve → request `approved`, user `active`.
  * Admin reject → request `rejected`, user `rejected`.
  * Admin request more info → request `need_more_info`, user vẫn `pending_manual_verification`.
  * Login chỉ cấp token nếu user `active`.
* Check domain email bằng danh sách config/env, không dùng `includes('fpt')`.
* Tạo migration đầy đủ, không dùng `synchronize: true`.
* Sau mỗi batch phải báo danh sách file đã sửa, nội dung đã làm, breaking change nếu có, và dừng lại để tôi review trước khi làm batch tiếp theo.
