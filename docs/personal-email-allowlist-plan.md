# Plan: Tối ưu Manual Verification bằng Student Personal Email Allowlist

## 0. Bối cảnh

Project hiện tại là web chatbot cho trường Đại học FPT. Hệ thống có rule đăng ký tài khoản sinh viên như sau:

1. Sinh viên có email FPT thì đăng ký bằng email FPT.
2. Sinh viên không có email FPT thì trước đây phải gửi yêu cầu duyệt thủ công cho admin.
3. Để giảm tải cho admin, cần bổ sung cơ chế **Personal Email Allowlist**.

Ý tưởng mới:

Nếu sinh viên đăng ký bằng email cá nhân và email này đã tồn tại sẵn trong danh sách được trường/admin import trước, hệ thống sẽ cho phép sinh viên xác thực OTP qua email cá nhân. Sau khi OTP hợp lệ, tài khoản được active tự động, không cần admin duyệt thủ công.

---

## 1. Mục tiêu chính

Refactor và mở rộng luồng đăng ký sinh viên theo 3 nhánh:

```txt
Flow 1: Email FPT hợp lệ
→ OTP
→ active

Flow 2: Email cá nhân có trong allowlist + studentCode khớp
→ OTP
→ active tự động

Flow 3: Email cá nhân không có trong allowlist
→ tạo manual verification request
→ chờ admin duyệt
```

---

## 2. Nguyên tắc bắt buộc

AI coding phải tuân thủ các nguyên tắc sau:

1. Không active tài khoản ngay khi vừa submit form đăng ký.
2. Tài khoản chỉ được active sau khi OTP/token email hợp lệ.
3. Không check email FPT bằng `email.includes('fpt')`.
4. Phải check domain bằng danh sách cấu hình từ `.env`.
5. Email phải được normalize trước khi lưu và trước khi so sánh:
   - `trim()`
   - `toLowerCase()`
6. Email cá nhân trong allowlist không đủ để active ngay.
7. Với email cá nhân allowlist, phải kiểm tra thêm `studentCode`.
8. Một record allowlist chỉ được claim một lần.
9. Khi OTP thành công, phải update `user` và `student_email_allowlist` trong transaction.
10. Manual verification vẫn phải giữ lại làm fallback.
11. Không lưu thông tin allowlist trong bảng `users`.
12. Không lưu hồ sơ manual verification trực tiếp trong bảng `users`.
13. Không cấp token login cho user chưa `active`.
14. Không trả `passwordHash` trong bất kỳ response nào.

---

## 3. Database design tổng thể

Sau khi refactor, hệ thống nên có tối thiểu 3 bảng chính liên quan đến đăng ký sinh viên:

```txt
users
student_email_allowlist
student_verification_requests
```

### 3.1. Bảng `users`

Bảng `users` chỉ quản lý account chính.

Các field chính:

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

Không nên chứa các field sau:

```txt
campus
personal_email
reason_for_no_fpt_email
id_card_url
student_card_url
verification_status
reviewed_by
reviewed_at
```

Những field đó thuộc về allowlist hoặc manual verification.

---

### 3.2. Bảng `student_email_allowlist`

Bảng này lưu danh sách email cá nhân đã được trường/admin xác nhận trước.

Mục đích:

```txt
Cho phép sinh viên chưa có email FPT đăng ký bằng email cá nhân,
nếu email đó đã nằm trong danh sách được import trước.
```

Các field đề xuất:

```txt
id
email
student_code
full_name
campus
status
source
claimed_by_user_id
claimed_at
expires_at
created_by
created_at
updated_at
```

Ý nghĩa:

| Field | Ý nghĩa |
|---|---|
| id | UUID primary key |
| email | Email cá nhân được phép đăng ký |
| student_code | Mã số sinh viên gắn với email này |
| full_name | Họ tên sinh viên để đối chiếu |
| campus | Campus của sinh viên |
| status | Trạng thái allowlist |
| source | Nguồn tạo record: admin, csv_import, system |
| claimed_by_user_id | User đã sử dụng record này để đăng ký |
| claimed_at | Thời điểm record bị claim |
| expires_at | Thời điểm hết hạn nếu danh sách chỉ dùng tạm |
| created_by | Admin tạo/import record |
| created_at | Ngày tạo |
| updated_at | Ngày cập nhật |

---

### 3.3. Bảng `student_verification_requests`

Bảng này dùng cho fallback manual verification khi:

```txt
Email cá nhân không nằm trong allowlist
Email cá nhân nằm trong allowlist nhưng sai studentCode
Allowlist đã expired
Allowlist đã disabled
Allowlist đã claimed
Sinh viên có tình huống đặc biệt cần admin duyệt
```

Các field chính:

```txt
id
user_id
student_code
campus
personal_email
reason_for_no_fpt_email
student_card_url
status
reviewed_by
reviewed_at
rejection_reason
created_at
updated_at
```

---

## 4. Enum cần có

### 4.1. `UserStatus`

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

| Status | Ý nghĩa |
|---|---|
| pending_email_verification | Đã tạo tài khoản, đang chờ xác minh OTP/email |
| pending_manual_verification | Đang chờ admin duyệt thủ công |
| active | Tài khoản hợp lệ |
| rejected | Bị từ chối |
| suspended | Bị khóa |

---

### 4.2. `EmailAllowlistStatus`

```ts
export enum EmailAllowlistStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}
```

Ý nghĩa:

| Status | Ý nghĩa |
|---|---|
| available | Có thể dùng để đăng ký |
| claimed | Đã được claim bởi một user |
| expired | Hết hạn sử dụng |
| disabled | Bị admin vô hiệu hóa |

---

### 4.3. `VerificationRequestStatus`

```ts
export enum VerificationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEED_MORE_INFO = 'need_more_info',
}
```

---

### 4.4. `RegistrationSource`

Nên bổ sung source cho user hoặc metadata để biết user được đăng ký bằng luồng nào.

```ts
export enum RegistrationSource {
  FPT_EMAIL = 'fpt_email',
  PERSONAL_EMAIL_ALLOWLIST = 'personal_email_allowlist',
  MANUAL_VERIFICATION = 'manual_verification',
  ADMIN_CREATED = 'admin_created',
}
```

Có thể lưu field này trong `users.metadata`, hoặc tạo cột riêng:

```txt
registration_source
```

Nếu hệ thống cần filter/report nhiều, nên tạo cột riêng. Nếu chỉ dùng để audit nhẹ, có thể lưu trong `metadata`.

---

## 5. Entity đề xuất

## 5.1. `UserOrmEntity`

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
@Index('idx_users_student_code', ['studentCode'])
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

  @Column({ name: 'registration_source', length: 100, nullable: true })
  registrationSource?: string | null;

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

## 5.2. `StudentEmailAllowlistOrmEntity`

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
import { UserOrmEntity } from './user.orm-entity';

export enum EmailAllowlistStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

@Entity('student_email_allowlist')
@Index('idx_student_email_allowlist_email', ['email'])
@Index('idx_student_email_allowlist_student_code', ['studentCode'])
@Index('idx_student_email_allowlist_status', ['status'])
@Index('uq_student_email_allowlist_email_student_code', ['email', 'studentCode'], {
  unique: true,
})
export class StudentEmailAllowlistOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'student_code', length: 50 })
  studentCode: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 100, nullable: true })
  campus?: string | null;

  @Column({
    type: 'enum',
    enum: EmailAllowlistStatus,
    default: EmailAllowlistStatus.AVAILABLE,
  })
  status: EmailAllowlistStatus;

  @Column({ length: 100, default: 'admin' })
  source: string;

  @Column({ name: 'claimed_by_user_id', type: 'uuid', nullable: true })
  claimedByUserId?: string | null;

  @ManyToOne(() => UserOrmEntity, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'claimed_by_user_id' })
  claimedByUser?: UserOrmEntity | null;

  @Column({ name: 'claimed_at', type: 'timestamp', nullable: true })
  claimedAt?: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeFields() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }

    if (this.studentCode) {
      this.studentCode = this.studentCode.trim().toUpperCase();
    }
  }
}
```

---

## 5.3. `StudentVerificationRequestOrmEntity`

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

## 6. Config `.env`

Thêm biến môi trường:

```env
ALLOWED_STUDENT_EMAIL_DOMAINS=@fpt.edu.vn,@student.fpt.edu.vn,@fu.edu.vn
PERSONAL_EMAIL_ALLOWLIST_ENABLED=true
ALLOWLIST_DEFAULT_EXPIRES_IN_DAYS=180
```

Lưu ý:

- Danh sách domain thực tế phải xác nhận theo hệ thống FPT.
- Không hard-code danh sách domain ở nhiều file.
- Không dùng `includes('fpt')`.

---

## 7. Service/helper cần có

## 7.1. `EmailDomainService`

Mục tiêu:

```txt
Check email có thuộc domain FPT hay không.
```

Method đề xuất:

```ts
normalizeEmail(email: string): string

isAllowedStudentEmail(email: string): boolean

isPersonalEmail(email: string): boolean
```

Logic:

```txt
normalizeEmail:
- trim
- lowercase

isAllowedStudentEmail:
- normalize email
- check email endsWith allowed domain
- allowed domain lấy từ config/env

isPersonalEmail:
- return !isAllowedStudentEmail(email)
```

Sai:

```ts
email.includes('fpt')
```

Đúng:

```ts
allowedDomains.some((domain) => email.endsWith(domain))
```

---

## 7.2. `StudentEmailAllowlistService`

Method đề xuất:

```ts
findAvailableByEmailAndStudentCode(email: string, studentCode: string)

validateAllowlistRecord(email: string, studentCode: string)

claimAllowlistRecord(allowlistId: string, userId: string, manager?: EntityManager)

createAllowlistRecord(dto, adminId: string)

bulkImportAllowlist(records, adminId: string)

disableAllowlistRecord(id: string, adminId: string)

getAllowlistRecords(query)
```

Rule validate:

```txt
1. Normalize email.
2. Normalize studentCode uppercase.
3. Tìm record theo email + studentCode.
4. Nếu không có → NOT_FOUND.
5. Nếu status không phải available → reject.
6. Nếu expiresAt có giá trị và đã quá hạn → reject.
7. Nếu claimedByUserId có giá trị → reject.
8. Nếu hợp lệ → return record.
```

---

## 7.3. `AuthService`

Cần update hoặc tạo các method:

```ts
registerStudentWithFptEmail(dto)

registerStudentWithPersonalEmail(dto)

verifyEmailOtp(dto)

login(dto)
```

Có thể gộp thành một endpoint register duy nhất, nhưng service logic nên tách rõ.

---

## 8. DTO cần có

## 8.1. `RegisterStudentDto`

Dùng nếu muốn một endpoint tự phân nhánh theo email.

```ts
export class RegisterStudentDto {
  email: string;
  password: string;
  fullName: string;
  studentCode?: string;
  campus?: string;
  reasonForNoFptEmail?: string;
  studentCardUrl?: string;
}
```

Validation rule:

```txt
email required
password required
fullName required
studentCode optional với email FPT
studentCode required với email cá nhân
reasonForNoFptEmail required nếu email cá nhân không có trong allowlist
```

---

## 8.2. `RegisterWithFptEmailDto`

Nếu muốn tách endpoint:

```ts
export class RegisterWithFptEmailDto {
  email: string;
  password: string;
  fullName: string;
}
```

---

## 8.3. `RegisterWithPersonalEmailDto`

```ts
export class RegisterWithPersonalEmailDto {
  email: string;
  password: string;
  fullName: string;
  studentCode: string;
  campus?: string;
  reasonForNoFptEmail?: string;
  studentCardUrl?: string;
}
```

Rule:

```txt
email phải là email cá nhân, không thuộc domain FPT
studentCode bắt buộc
Nếu email + studentCode có trong allowlist → không cần reason/studentCardUrl
Nếu không có allowlist → cần reasonForNoFptEmail và có thể cần studentCardUrl
```

---

## 8.4. `VerifyEmailOtpDto`

```ts
export class VerifyEmailOtpDto {
  email: string;
  otp: string;
}
```

---

## 8.5. `CreateStudentEmailAllowlistDto`

```ts
export class CreateStudentEmailAllowlistDto {
  email: string;
  studentCode: string;
  fullName: string;
  campus?: string;
  expiresAt?: Date;
}
```

---

## 8.6. `BulkImportStudentEmailAllowlistDto`

```ts
export class BulkImportStudentEmailAllowlistDto {
  records: CreateStudentEmailAllowlistDto[];
}
```

---

## 9. API design đề xuất

Có 2 cách thiết kế API.

---

# Option A: Một endpoint register duy nhất

## `POST /auth/register/student`

Request với email FPT:

```json
{
  "email": "se123456@fpt.edu.vn",
  "password": "Password@123",
  "fullName": "Nguyen Van A"
}
```

Request với email cá nhân có allowlist:

```json
{
  "email": "student.personal@gmail.com",
  "password": "Password@123",
  "fullName": "Nguyen Van A",
  "studentCode": "SE123456"
}
```

Request với email cá nhân không có allowlist:

```json
{
  "email": "student.personal@gmail.com",
  "password": "Password@123",
  "fullName": "Nguyen Van A",
  "studentCode": "SE123456",
  "campus": "FPT University HCM",
  "reasonForNoFptEmail": "Em là sinh viên mới chưa được cấp email trường.",
  "studentCardUrl": "https://example.com/student-card.jpg"
}
```

Service tự phân nhánh.

Ưu điểm:

```txt
Frontend chỉ gọi một API.
UX đơn giản.
```

Nhược điểm:

```txt
DTO validation phức tạp hơn.
Logic service cần rõ ràng để tránh rối.
```

---

# Option B: Tách endpoint rõ ràng

## `POST /auth/register/student/fpt-email`

Dành cho email FPT.

## `POST /auth/register/student/personal-email`

Dành cho email cá nhân.

Ưu điểm:

```txt
Service rõ hơn.
Validation dễ hơn.
Dễ test hơn.
```

Nhược điểm:

```txt
Frontend phải phân nhánh trước hoặc gọi API phù hợp.
```

Khuyến nghị:

```txt
Nếu project còn nhỏ/MVP → dùng Option A.
Nếu muốn clean architecture rõ ràng → dùng Option B.
```

---

## 10. Flow xử lý chi tiết

# Flow 1: Đăng ký bằng email FPT

Input:

```json
{
  "email": "se123456@fpt.edu.vn",
  "password": "Password@123",
  "fullName": "Nguyen Van A"
}
```

Logic:

```txt
1. Normalize email.
2. Check email format.
3. Check email thuộc allowed FPT domains.
4. Check email chưa tồn tại trong users.
5. Hash password.
6. Lấy role Student.
7. Tạo user:
   - email = normalized email
   - passwordHash = hashed password
   - fullName = dto.fullName
   - roleId = studentRole.id
   - status = pending_email_verification
   - registrationSource = fpt_email
   - emailVerifiedAt = null
8. Tạo OTP/token xác minh.
9. Gửi email OTP đến email FPT.
10. Trả response pending.
```

Response:

```json
{
  "message": "Tài khoản đã được tạo. Vui lòng kiểm tra email FPT để xác minh tài khoản.",
  "code": "PENDING_EMAIL_VERIFICATION"
}
```

---

# Flow 2: Đăng ký bằng email cá nhân có trong allowlist

Input:

```json
{
  "email": "student.personal@gmail.com",
  "password": "Password@123",
  "fullName": "Nguyen Van A",
  "studentCode": "SE123456"
}
```

Logic:

```txt
1. Normalize email.
2. Normalize studentCode uppercase.
3. Check email không thuộc FPT domain.
4. Check email chưa tồn tại trong users.
5. Check studentCode có được gửi lên.
6. Tìm allowlist record theo email + studentCode.
7. Validate allowlist:
   - record tồn tại
   - status = available
   - claimedByUserId = null
   - expiresAt null hoặc chưa hết hạn
8. Hash password.
9. Lấy role Student.
10. Tạo user:
    - email = personal email
    - fullName = dto.fullName hoặc allowlist.fullName
    - studentCode = allowlist.studentCode
    - roleId = studentRole.id
    - status = pending_email_verification
    - registrationSource = personal_email_allowlist
    - emailVerifiedAt = null
    - metadata.allowlistId = allowlist.id
11. Tạo OTP/token xác minh.
12. Gửi OTP đến email cá nhân.
13. Chưa claim allowlist ở bước này, hoặc mark tạm nếu có cơ chế pending claim.
14. Trả response pending OTP.
```

Response:

```json
{
  "message": "Email cá nhân của bạn đã được xác nhận trong danh sách sinh viên. Vui lòng kiểm tra email để nhập OTP kích hoạt tài khoản.",
  "code": "PERSONAL_EMAIL_ALLOWLIST_PENDING_OTP"
}
```

Lưu ý:

```txt
Không nên active ngay ở bước register.
Chỉ active sau khi OTP đúng.
```

---

# Flow 3: Verify OTP cho email FPT hoặc email cá nhân allowlist

Input:

```json
{
  "email": "student.personal@gmail.com",
  "otp": "123456"
}
```

Logic chung:

```txt
1. Normalize email.
2. Tìm user theo email.
3. Check user tồn tại.
4. Check user.status = pending_email_verification.
5. Check OTP đúng.
6. Check OTP chưa hết hạn.
7. Check OTP chưa dùng.
8. Nếu registrationSource = fpt_email:
   - update user.status = active
   - update user.emailVerifiedAt = now
9. Nếu registrationSource = personal_email_allowlist:
   - lấy allowlistId từ metadata hoặc tìm theo user.email + user.studentCode
   - validate allowlist vẫn available
   - transaction:
     a. update user.status = active
     b. update user.emailVerifiedAt = now
     c. update allowlist.status = claimed
     d. update allowlist.claimedByUserId = user.id
     e. update allowlist.claimedAt = now
10. Revoke/delete OTP.
11. Trả response success.
```

Response:

```json
{
  "message": "Xác minh email thành công. Tài khoản của bạn đã được kích hoạt.",
  "code": "EMAIL_VERIFIED"
}
```

---

# Flow 4: Email cá nhân không có allowlist → Manual verification

Input:

```json
{
  "email": "student.personal@gmail.com",
  "password": "Password@123",
  "fullName": "Nguyen Van A",
  "studentCode": "SE123456",
  "campus": "FPT University HCM",
  "reasonForNoFptEmail": "Em là sinh viên mới chưa được cấp email trường.",
  "studentCardUrl": "https://example.com/student-card.jpg"
}
```

Logic:

```txt
1. Normalize email.
2. Normalize studentCode.
3. Check email không thuộc FPT domain.
4. Check email chưa tồn tại trong users.
5. Tìm allowlist theo email + studentCode.
6. Nếu allowlist không tồn tại hoặc không hợp lệ:
   - require reasonForNoFptEmail
   - studentCardUrl optional hoặc required tùy rule
7. Hash password.
8. Lấy role Student.
9. Tạo user:
   - status = pending_manual_verification
   - registrationSource = manual_verification
   - emailVerifiedAt = null
10. Tạo student_verification_requests:
   - userId = user.id
   - studentCode
   - campus
   - personalEmail = email
   - reasonForNoFptEmail
   - studentCardUrl
   - status = pending
11. Trả response chờ admin duyệt.
```

Response:

```json
{
  "message": "Yêu cầu xác minh sinh viên đã được gửi. Vui lòng chờ quản trị viên xét duyệt.",
  "code": "MANUAL_VERIFICATION_PENDING"
}
```

---

# Flow 5: Admin approve manual verification

API:

```txt
PATCH /admin/student-verifications/:id/approve
```

Logic:

```txt
1. Chỉ admin được gọi.
2. Tìm verification request.
3. Check request.status thuộc pending hoặc need_more_info.
4. Transaction:
   - update request.status = approved
   - update request.reviewedBy = adminId
   - update request.reviewedAt = now
   - update user.status = active
   - update user.studentCode = request.studentCode
   - update user.emailVerifiedAt = now hoặc null tùy rule
5. Trả response.
```

Response:

```json
{
  "message": "Tài khoản sinh viên đã được xác minh thành công.",
  "code": "STUDENT_VERIFICATION_APPROVED"
}
```

Lưu ý:

```txt
Nếu muốn bảo mật hơn, có thể yêu cầu user verify OTP email cá nhân trước/sau khi admin approve.
```

---

# Flow 6: Admin reject manual verification

API:

```txt
PATCH /admin/student-verifications/:id/reject
```

Request:

```json
{
  "rejectionReason": "Thông tin xác minh chưa đủ rõ ràng."
}
```

Logic:

```txt
1. Chỉ admin được gọi.
2. Tìm request.
3. Transaction:
   - update request.status = rejected
   - update request.rejectionReason = input
   - update request.reviewedBy = adminId
   - update request.reviewedAt = now
   - update user.status = rejected
4. Trả response.
```

---

## 11. Login rule cần cập nhật

Khi user login:

```txt
1. Query user bằng email, nhớ addSelect passwordHash.
2. Check password.
3. Nếu user.status = pending_email_verification:
   - không cấp token
   - trả message yêu cầu verify OTP.
4. Nếu user.status = pending_manual_verification:
   - không cấp token
   - trả message chờ admin duyệt.
5. Nếu user.status = rejected:
   - không cấp token.
6. Nếu user.status = suspended:
   - không cấp token.
7. Nếu user.status = active:
   - cấp accessToken/refreshToken.
   - update lastLoginAt.
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

## 12. Admin APIs cho allowlist

Cần bổ sung API để admin quản lý danh sách email cá nhân.

---

### 12.1. `POST /admin/student-email-allowlist`

Tạo một allowlist record.

Request:

```json
{
  "email": "student.personal@gmail.com",
  "studentCode": "SE123456",
  "fullName": "Nguyen Van A",
  "campus": "FPT University HCM",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

Response:

```json
{
  "message": "Email cá nhân đã được thêm vào danh sách cho phép.",
  "code": "ALLOWLIST_CREATED"
}
```

---

### 12.2. `POST /admin/student-email-allowlist/bulk-import`

Import nhiều record.

Request:

```json
{
  "records": [
    {
      "email": "student1@gmail.com",
      "studentCode": "SE123001",
      "fullName": "Nguyen Van A",
      "campus": "FPT University HCM"
    },
    {
      "email": "student2@gmail.com",
      "studentCode": "SE123002",
      "fullName": "Tran Van B",
      "campus": "FPT University HCM"
    }
  ]
}
```

Logic:

```txt
1. Chỉ admin được gọi.
2. Validate từng record.
3. Normalize email.
4. Normalize studentCode.
5. Bỏ qua hoặc báo lỗi duplicate tùy rule.
6. Insert records.
7. Trả summary:
   - total
   - inserted
   - skipped
   - failed
```

Response:

```json
{
  "message": "Import danh sách email cá nhân hoàn tất.",
  "code": "ALLOWLIST_BULK_IMPORT_COMPLETED",
  "data": {
    "total": 100,
    "inserted": 95,
    "skipped": 3,
    "failed": 2
  }
}
```

---

### 12.3. `GET /admin/student-email-allowlist`

List allowlist records.

Query params:

```txt
search
status
campus
page
limit
```

---

### 12.4. `PATCH /admin/student-email-allowlist/:id/disable`

Disable record.

Response:

```json
{
  "message": "Email cá nhân đã được vô hiệu hóa.",
  "code": "ALLOWLIST_DISABLED"
}
```

---

### 12.5. `PATCH /admin/student-email-allowlist/:id/enable`

Enable lại record nếu chưa claimed và chưa expired.

Response:

```json
{
  "message": "Email cá nhân đã được kích hoạt lại.",
  "code": "ALLOWLIST_ENABLED"
}
```

---

## 13. Response code chuẩn hóa

### Register email FPT thành công

```json
{
  "message": "Tài khoản đã được tạo. Vui lòng kiểm tra email FPT để xác minh tài khoản.",
  "code": "PENDING_EMAIL_VERIFICATION"
}
```

### Email không thuộc domain FPT nhưng có allowlist

```json
{
  "message": "Email cá nhân của bạn đã được xác nhận trong danh sách sinh viên. Vui lòng kiểm tra email để nhập OTP kích hoạt tài khoản.",
  "code": "PERSONAL_EMAIL_ALLOWLIST_PENDING_OTP"
}
```

### Email cá nhân không có allowlist

```json
{
  "message": "Email cá nhân chưa có trong danh sách xác nhận. Vui lòng gửi yêu cầu xác minh thủ công.",
  "code": "MANUAL_VERIFICATION_REQUIRED"
}
```

### Manual verification pending

```json
{
  "message": "Yêu cầu xác minh sinh viên đã được gửi. Vui lòng chờ quản trị viên xét duyệt.",
  "code": "MANUAL_VERIFICATION_PENDING"
}
```

### Allowlist đã được claim

```json
{
  "message": "Email này đã được sử dụng để xác minh một tài khoản sinh viên.",
  "code": "ALLOWLIST_EMAIL_ALREADY_CLAIMED"
}
```

### Allowlist hết hạn

```json
{
  "message": "Email cá nhân này đã hết hạn xác minh. Vui lòng gửi yêu cầu xác minh thủ công.",
  "code": "ALLOWLIST_RECORD_EXPIRED"
}
```

### Student code không khớp

```json
{
  "message": "Email cá nhân hoặc mã số sinh viên không khớp với dữ liệu xác minh.",
  "code": "ALLOWLIST_STUDENT_CODE_MISMATCH"
}
```

### Verify OTP thành công

```json
{
  "message": "Xác minh email thành công. Tài khoản của bạn đã được kích hoạt.",
  "code": "EMAIL_VERIFIED"
}
```

---

## 14. Migration plan

Cần tạo migration TypeORM, không dùng `synchronize: true`.

Migration cần làm:

### 14.1. Update bảng `users`

Thêm nếu chưa có:

```txt
student_code varchar(50) nullable
email_verified_at timestamp nullable
last_login_at timestamp nullable
registration_source varchar(100) nullable
metadata jsonb nullable
created_by uuid nullable
status enum hoặc varchar có constraint
```

Đảm bảo default status không còn là `active`.

```txt
default = pending_email_verification
```

### 14.2. Tạo bảng `student_email_allowlist`

Các cột:

```txt
id uuid primary key
email varchar(255) not null
student_code varchar(50) not null
full_name varchar(255) not null
campus varchar(100) nullable
status enum default available
source varchar(100) default admin
claimed_by_user_id uuid nullable
claimed_at timestamp nullable
expires_at timestamp nullable
created_by uuid nullable
created_at timestamp not null
updated_at timestamp not null
```

FK:

```txt
claimed_by_user_id → users(id), onDelete SET NULL
```

Unique:

```txt
unique(email, student_code)
```

Index:

```txt
email
student_code
status
```

### 14.3. Tạo bảng `student_verification_requests`

Nếu bảng chưa có, tạo mới.

Nếu bảng đã có, kiểm tra và bổ sung field thiếu.

### 14.4. Data migration nếu cần

Nếu trước đó đã có các field manual verification trong `users`:

```txt
campus
personal_email
reason_for_no_fpt_email
id_card_url
```

Xử lý:

```txt
Nếu chưa có data thật:
- drop khỏi users.

Nếu đã có data thật:
- migrate sang student_verification_requests.
- sau khi migrate thành công mới drop khỏi users.
```

---

## 15. Transaction rule quan trọng

Khi verify OTP cho user đăng ký bằng email cá nhân allowlist, phải dùng transaction.

Pseudo-code:

```ts
await dataSource.transaction(async (manager) => {
  const user = await manager.findOne(UserOrmEntity, {
    where: { id: userId },
    lock: { mode: 'pessimistic_write' },
  });

  const allowlist = await manager.findOne(StudentEmailAllowlistOrmEntity, {
    where: { id: allowlistId },
    lock: { mode: 'pessimistic_write' },
  });

  if (!allowlist) {
    throw new BadRequestException({
      message: 'Không tìm thấy dữ liệu xác minh email cá nhân.',
      code: 'ALLOWLIST_RECORD_NOT_FOUND',
    });
  }

  if (allowlist.status !== EmailAllowlistStatus.AVAILABLE) {
    throw new BadRequestException({
      message: 'Email cá nhân này không còn khả dụng để xác minh.',
      code: 'ALLOWLIST_RECORD_NOT_AVAILABLE',
    });
  }

  allowlist.status = EmailAllowlistStatus.CLAIMED;
  allowlist.claimedByUserId = user.id;
  allowlist.claimedAt = new Date();

  user.status = UserStatus.ACTIVE;
  user.emailVerifiedAt = new Date();

  await manager.save(allowlist);
  await manager.save(user);
});
```

Mục tiêu:

```txt
Tránh trường hợp 2 request OTP cùng lúc claim cùng một allowlist record.
```

---

## 16. Batch implementation plan

AI coding phải làm theo từng batch. Mỗi batch xong phải dừng lại, báo file đã sửa, nội dung đã làm, breaking change nếu có, rồi chờ người dùng duyệt.

---

# Batch 1: Audit code hiện tại

## Việc cần làm

1. Tìm toàn bộ file liên quan:
   - User entity
   - Role entity
   - Auth module/service/controller
   - Register DTO
   - Login DTO
   - OTP/email verification service nếu có
   - Migration hiện tại
   - Seed role nếu có
   - Admin guard/role guard nếu có
2. Ghi lại flow register hiện tại.
3. Ghi lại flow login hiện tại.
4. Ghi lại cách project đang gửi email OTP.
5. Không sửa code trong batch này trừ khi cần fix lỗi compile nhỏ.

## Output cần báo lại

```txt
Danh sách file đã kiểm tra
Luồng register hiện tại
Luồng verify OTP hiện tại nếu có
Luồng login hiện tại
Những field users đang có
Những module sẽ bị ảnh hưởng
```

---

# Batch 2: Refactor User entity và enum

## Việc cần làm

1. Tạo hoặc cập nhật `UserStatus`.
2. Cập nhật `UserOrmEntity`:
   - `passwordHash` có `select: false`
   - `studentCode`
   - `emailVerifiedAt`
   - `lastLoginAt`
   - `registrationSource`
   - `metadata`
   - `createdBy`
   - normalize email
   - index cần thiết
3. Đảm bảo default status không còn là `active`.

## Không được làm

```txt
Không đổi tên bảng users
Không đổi id user
Không xóa relation role
Không bật eager role
Không active user mặc định
```

## Output cần báo lại

```txt
File đã sửa
User enum mới
User entity mới
Breaking change nếu có
```

---

# Batch 3: Tạo StudentEmailAllowlist entity

## Việc cần làm

1. Tạo `EmailAllowlistStatus`.
2. Tạo `StudentEmailAllowlistOrmEntity`.
3. Thêm:
   - unique index email + studentCode
   - index email
   - index studentCode
   - index status
4. Đăng ký entity vào TypeORM module/config nếu project yêu cầu.
5. Normalize email và studentCode trong entity hoặc service.

## Không được làm

```txt
Không nhét allowlist vào users.metadata
Không để một allowlist record claim nhiều lần
Không dùng eager true cho relation claimedByUser
```

## Output cần báo lại

```txt
File entity mới
Enum mới
Index mới
Cách relation với users
```

---

# Batch 4: Update hoặc tạo StudentVerificationRequest entity

## Việc cần làm

1. Kiểm tra entity manual verification đã có chưa.
2. Nếu chưa có, tạo mới.
3. Nếu đã có, cập nhật cho đủ field:
   - userId
   - studentCode
   - campus
   - personalEmail
   - reasonForNoFptEmail
   - studentCardUrl
   - status
   - reviewedBy
   - reviewedAt
   - rejectionReason
4. Đảm bảo entity này tách khỏi users.

## Không được làm

```txt
Không lưu document/reason trong users
Không xóa user khi reject
Không cho manual request active tự động
```

---

# Batch 5: Migration database

## Việc cần làm

1. Tạo migration TypeORM.
2. Migration phải:
   - update users
   - tạo student_email_allowlist
   - tạo/cập nhật student_verification_requests
   - tạo enum nếu dùng PostgreSQL enum
   - tạo FK
   - tạo index
   - tạo unique constraint email + studentCode
3. Nếu có data cũ, không drop cột trước khi migrate.

## Không được làm

```txt
Không dùng synchronize: true
Không drop bảng users
Không làm mất dữ liệu user hiện có
```

## Output cần báo lại

```txt
Tên file migration
Các thay đổi DB
Command chạy migration
Command rollback
```

---

# Batch 6: Implement EmailDomainService

## Việc cần làm

1. Tạo service/helper check domain email.
2. Đọc `ALLOWED_STUDENT_EMAIL_DOMAINS` từ config/env.
3. Implement:
   - normalizeEmail
   - isAllowedStudentEmail
   - isPersonalEmail
4. Dùng service này trong register flow.

## Không được làm

```txt
Không dùng includes('fpt')
Không hard-code domain ở nhiều nơi
Không bỏ normalize email
```

---

# Batch 7: Implement StudentEmailAllowlistService

## Việc cần làm

1. Tạo service quản lý allowlist.
2. Implement:
   - findAvailableByEmailAndStudentCode
   - validateAllowlistRecord
   - claimAllowlistRecord
   - createAllowlistRecord
   - bulkImportAllowlist
   - disableAllowlistRecord
   - getAllowlistRecords
3. Validate:
   - email normalized
   - studentCode uppercase
   - status available
   - expiresAt chưa hết hạn
   - claimedByUserId null

## Không được làm

```txt
Không claim allowlist trước khi OTP thành công nếu không có cơ chế rollback
Không cho claim record đã claimed
Không bỏ check expiresAt
```

---

# Batch 8: Update register student flow

## Việc cần làm

Implement flow register theo 3 nhánh:

```txt
Email FPT → pending_email_verification → OTP
Email cá nhân có allowlist → pending_email_verification → OTP
Email cá nhân không có allowlist → pending_manual_verification → manual request
```

Chi tiết:

1. Normalize email.
2. Check email exists.
3. Nếu email FPT:
   - tạo user `pending_email_verification`
   - registrationSource = `fpt_email`
   - gửi OTP
4. Nếu email cá nhân:
   - require studentCode
   - check allowlist
   - nếu allowlist hợp lệ:
     - tạo user `pending_email_verification`
     - registrationSource = `personal_email_allowlist`
     - user.studentCode = allowlist.studentCode
     - metadata.allowlistId = allowlist.id
     - gửi OTP
   - nếu allowlist không hợp lệ:
     - require reasonForNoFptEmail
     - tạo user `pending_manual_verification`
     - registrationSource = `manual_verification`
     - tạo student_verification_request

## Không được làm

```txt
Không active user ngay trong register
Không cấp token sau register
Không claim allowlist ngay nếu OTP chưa verify
Không bỏ fallback manual verification
```

---

# Batch 9: Update verify OTP flow

## Việc cần làm

1. Verify OTP như hiện tại.
2. Nếu user.registrationSource = `fpt_email`:
   - user.status = active
   - emailVerifiedAt = now
3. Nếu user.registrationSource = `personal_email_allowlist`:
   - lấy allowlistId
   - validate allowlist còn available
   - dùng transaction:
     - user.status = active
     - user.emailVerifiedAt = now
     - allowlist.status = claimed
     - allowlist.claimedByUserId = user.id
     - allowlist.claimedAt = now
4. Revoke/delete OTP sau khi verify.

## Không được làm

```txt
Không verify token hết hạn
Không cho OTP dùng lại
Không active allowlist user nếu allowlist đã bị claimed/disabled/expired
Không update user và allowlist ngoài transaction
```

---

# Batch 10: Admin APIs cho allowlist

## Việc cần làm

Tạo APIs:

```txt
POST /admin/student-email-allowlist
POST /admin/student-email-allowlist/bulk-import
GET /admin/student-email-allowlist
PATCH /admin/student-email-allowlist/:id/disable
PATCH /admin/student-email-allowlist/:id/enable
```

Rule:

```txt
Chỉ Admin được gọi.
Bulk import phải có summary.
Không insert duplicate email + studentCode.
Không enable record đã claimed.
```

---

# Batch 11: Update admin manual verification APIs

## Việc cần làm

Đảm bảo các API sau hoạt động:

```txt
GET /admin/student-verifications
GET /admin/student-verifications/:id
PATCH /admin/student-verifications/:id/approve
PATCH /admin/student-verifications/:id/reject
PATCH /admin/student-verifications/:id/request-more-info
```

Rule:

```txt
Approve → user active
Reject → user rejected
Request more info → user vẫn pending_manual_verification
```

---

# Batch 12: Update login rule

## Việc cần làm

1. Query user bằng email và addSelect passwordHash.
2. Check status trước khi cấp token.
3. Chỉ user active mới được login.
4. Update lastLoginAt khi login thành công.

Rule:

```txt
pending_email_verification → chặn login
pending_manual_verification → chặn login
rejected → chặn login
suspended → chặn login
active → cấp token
```

---

# Batch 13: Test cases

## 13.1. Register bằng email FPT

```txt
[ ] Email FPT hợp lệ → tạo user pending_email_verification
[ ] Email FPT uppercase → normalize lowercase
[ ] Email không đúng domain → không vào flow FPT
[ ] Email đã tồn tại → reject
[ ] Sau OTP đúng → user active
[ ] Sau OTP sai → không active
```

---

## 13.2. Register bằng email cá nhân có allowlist

```txt
[ ] Email cá nhân + studentCode khớp allowlist available → tạo user pending_email_verification
[ ] OTP đúng → user active, allowlist claimed
[ ] OTP sai → user vẫn pending_email_verification, allowlist chưa claimed
[ ] Allowlist đã claimed → reject hoặc chuyển manual verification tùy rule
[ ] Allowlist expired → chuyển manual verification
[ ] Allowlist disabled → chuyển manual verification
[ ] StudentCode sai → chuyển manual verification hoặc trả mismatch
```

---

## 13.3. Register bằng email cá nhân không có allowlist

```txt
[ ] Không có allowlist + có đủ reason → tạo manual verification request
[ ] Không có allowlist + thiếu reason → validation error
[ ] User status = pending_manual_verification
[ ] Không cấp token
```

---

## 13.4. Admin allowlist

```txt
[ ] Admin tạo allowlist thành công
[ ] Admin bulk import thành công
[ ] Duplicate email + studentCode không insert trùng
[ ] Admin disable record thành công
[ ] Không enable record đã claimed
[ ] Student không gọi được API admin
```

---

## 13.5. Login

```txt
[ ] User active login được
[ ] User pending_email_verification không login được
[ ] User pending_manual_verification không login được
[ ] User rejected không login được
[ ] User suspended không login được
[ ] Response không chứa passwordHash
```

---

## 14. Checklist hoàn thành

```txt
[ ] Có bảng student_email_allowlist
[ ] Có enum EmailAllowlistStatus
[ ] Có service check FPT email domain
[ ] Có service validate allowlist
[ ] Email cá nhân allowlist phải check studentCode
[ ] Allowlist chỉ claim sau OTP thành công
[ ] Claim allowlist dùng transaction
[ ] User chỉ active sau OTP/admin approve
[ ] Manual verification vẫn tồn tại
[ ] Login chỉ cấp token cho active user
[ ] Có admin API quản lý allowlist
[ ] Có migration đầy đủ
[ ] Có test/manual test cases
[ ] Không trả passwordHash
[ ] Không dùng email.includes('fpt')
[ ] Không dùng synchronize: true
```

---

## 15. Prompt ngắn đưa cho AI coding

Bạn hãy refactor luồng đăng ký sinh viên cho project NestJS + TypeORM theo cơ chế mới: Personal Email Allowlist.

Yêu cầu:

1. Giữ flow email FPT:
   - Email FPT hợp lệ → tạo user `pending_email_verification`
   - Verify OTP → user `active`

2. Thêm flow email cá nhân allowlist:
   - Tạo bảng `student_email_allowlist`
   - Nếu user đăng ký bằng email cá nhân + studentCode khớp allowlist
   - Allowlist phải `available`, chưa claimed, chưa expired
   - Tạo user `pending_email_verification`
   - Gửi OTP đến email cá nhân
   - Sau OTP đúng thì dùng transaction:
     - user `active`
     - allowlist `claimed`
     - allowlist.claimedByUserId = user.id
     - allowlist.claimedAt = now

3. Giữ fallback manual verification:
   - Nếu email cá nhân không có allowlist hoặc allowlist không hợp lệ
   - Tạo user `pending_manual_verification`
   - Tạo `student_verification_requests`
   - Chờ admin duyệt

4. Không active user ngay sau register.
5. Không claim allowlist trước khi OTP thành công.
6. Không cấp token cho user chưa active.
7. Không check domain bằng `includes('fpt')`.
8. Không hard-code domain trong nhiều nơi, đọc từ `.env`.
9. Không lưu allowlist/manual verification trong bảng `users`.
10. Tạo migration đầy đủ, không dùng `synchronize: true`.
11. Tạo admin APIs quản lý allowlist:
    - create
    - bulk import
    - list
    - disable
    - enable
12. Làm theo batch. Sau mỗi batch phải báo:
    - file đã sửa
    - nội dung đã làm
    - breaking change nếu có
    - test đã chạy
    - dừng lại để tôi review trước khi sang batch tiếp theo.
