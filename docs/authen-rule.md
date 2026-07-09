## Business Rule: Đăng ký tài khoản sinh viên cho hệ thống FPT University Chatbot

### 1. Mục tiêu

Hệ thống chatbot của trường Đại học FPT chỉ cho phép sinh viên hợp lệ đăng ký tài khoản sinh viên bằng email thuộc trường FPT. Quy định này nhằm đảm bảo người dùng là sinh viên thật, hạn chế tài khoản giả mạo, bảo vệ dữ liệu nội bộ và kiểm soát quyền truy cập vào các chức năng dành riêng cho sinh viên.

---

### 2. Quy tắc đăng ký chính

Khi người dùng đăng ký tài khoản với vai trò **Student**, hệ thống bắt buộc kiểm tra email đăng ký.

Email hợp lệ phải thỏa các điều kiện sau:

1. Email thuộc danh sách domain sinh viên FPT được hệ thống cho phép.
2. Email chưa từng được sử dụng để đăng ký tài khoản trước đó.
3. Người dùng phải xác minh quyền sở hữu email thông qua OTP hoặc verification link.
4. Sau khi xác minh thành công, tài khoản mới được kích hoạt.

Ví dụ domain hợp lệ nên được cấu hình ở backend hoặc database, không nên hard-code trực tiếp trong code:

```txt
@student.fpt.edu.vn
@fpt.edu.vn
@fu.edu.vn
```

Danh sách domain thực tế cần lấy theo quy định chính thức của trường hoặc hệ thống nội bộ.

---

### 3. Trường hợp email không thuộc FPT

Nếu người dùng nhập email không thuộc domain sinh viên FPT, hệ thống **không cho phép tạo tài khoản Student chính thức**.

Hệ thống trả về thông báo thân thiện:

```txt
Email này không thuộc hệ thống sinh viên FPT. Vui lòng sử dụng email sinh viên FPT để đăng ký tài khoản. Nếu bạn là sinh viên FPT nhưng chưa có email trường, vui lòng liên hệ phòng CTS hoặc quản trị viên để được hỗ trợ xác minh.
```

Tài khoản không được tạo ở trạng thái active.

---

### 4. Luồng xử lý cho sinh viên không có email FPT

Một số sinh viên có thể là sinh viên mới, bị mất quyền truy cập email, chưa được cấp email hoặc email trường gặp lỗi. Với các trường hợp này, hệ thống nên cung cấp luồng **Manual Verification**.

Người dùng có thể chọn chức năng:

```txt
Tôi là sinh viên FPT nhưng chưa có email trường
```

Sau đó hệ thống yêu cầu cung cấp thông tin xác minh:

1. Mã số sinh viên.
2. Họ và tên.
3. Email cá nhân để liên hệ.
4. Campus đang học.
5. Ảnh thẻ sinh viên hoặc giấy tờ xác nhận học tập nếu cần.
6. Lý do không sử dụng được email FPT.

Sau khi gửi yêu cầu, tài khoản được tạo ở trạng thái:

```txt
PENDING_VERIFICATION
```

Người dùng chưa được sử dụng đầy đủ chức năng cho đến khi admin duyệt.

---

### 5. Quyền hạn của tài khoản đang chờ xác minh

Tài khoản ở trạng thái `PENDING_VERIFICATION` chỉ được phép:

1. Đăng nhập vào hệ thống.
2. Xem trạng thái yêu cầu xác minh.
3. Cập nhật hoặc bổ sung thông tin xác minh.
4. Gửi lại yêu cầu xác minh nếu bị từ chối.

Tài khoản này không được phép:

1. Sử dụng chatbot với dữ liệu nội bộ của trường.
2. Xem tài liệu học tập riêng tư.
3. Đặt câu hỏi liên quan đến thông tin cá nhân, điểm số, lịch học hoặc dữ liệu sinh viên.
4. Tham gia các chức năng cộng đồng nội bộ nếu có.
5. Truy cập tính năng chỉ dành cho sinh viên đã xác thực.

---

### 6. Luồng admin duyệt thủ công

Admin có thể xem danh sách các tài khoản đang chờ xác minh.

Admin có 3 lựa chọn:

#### A. Approve

Nếu thông tin hợp lệ, admin duyệt tài khoản.

Trạng thái tài khoản chuyển từ:

```txt
PENDING_VERIFICATION → ACTIVE
```

Role được gán:

```txt
Student
```

Người dùng được phép sử dụng đầy đủ các chức năng dành cho sinh viên.

#### B. Reject

Nếu thông tin không hợp lệ, admin từ chối yêu cầu.

Trạng thái tài khoản chuyển thành:

```txt
REJECTED
```

Hệ thống gửi lý do từ chối cho người dùng.

Ví dụ:

```txt
Thông tin xác minh chưa đủ rõ ràng. Vui lòng bổ sung ảnh thẻ sinh viên hoặc sử dụng email sinh viên FPT để đăng ký.
```

#### C. Request More Information

Nếu thông tin chưa đủ, admin yêu cầu bổ sung.

Trạng thái tài khoản giữ ở:

```txt
PENDING_VERIFICATION
```

Người dùng cần cập nhật lại hồ sơ xác minh.

---

### 7. Quy tắc bảo mật

Hệ thống không nên chỉ kiểm tra domain email rồi kích hoạt ngay tài khoản. Bắt buộc phải có bước xác minh email.

Lý do:

1. Người dùng có thể nhập email FPT không thuộc sở hữu của họ.
2. Domain hợp lệ không đồng nghĩa người dùng thật sự kiểm soát email đó.
3. Verification  OTP giúp xác nhận người dùng có quyền truy cập email.

Quy trình khuyến nghị:

```txt
Register → Validate email domain → Send OTP → Verify OTP → Activate account
```

---

### 9. Trạng thái tài khoản đề xuất

Hệ thống nên có các trạng thái tài khoản sau:

```txt
PENDING_EMAIL_VERIFICATION
ACTIVE
PENDING_VERIFICATION
REJECTED
SUSPENDED
```

Ý nghĩa:

* `PENDING_EMAIL_VERIFICATION`: Đã đăng ký bằng email FPT nhưng chưa xác minh email.
* `ACTIVE`: Tài khoản hợp lệ và được sử dụng đầy đủ.
* `PENDING_VERIFICATION`: Không có email FPT, đang chờ admin xác minh thủ công.
* `REJECTED`: Yêu cầu xác minh bị từ chối.
* `SUSPENDED`: Tài khoản bị khóa do vi phạm hoặc có vấn đề bảo mật.

---

### 10. Business rule tổng kết

| Trường hợp                                    | Cách xử lý                                                  |
| --------------------------------------------- | ----------------------------------------------------------- |
| Email thuộc domain FPT và xác minh thành công | Cho đăng ký tài khoản Student                               |
| Email thuộc domain FPT nhưng chưa xác minh    | Tạo tài khoản ở trạng thái PENDING_EMAIL_VERIFICATION       |
| Email không thuộc domain FPT                  | Không cho tạo tài khoản Student chính thức                  |
| Sinh viên thật nhưng chưa có email FPT        | Cho gửi yêu cầu Manual Verification                         |
| Email FPT đã tồn tại                          | Không cho đăng ký mới, yêu cầu đăng nhập hoặc quên mật khẩu |

---
