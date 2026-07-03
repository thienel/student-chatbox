Bạn là một Senior Backend Engineer kiêm Technical Writer.

Hiện tại project backend có cấu trúc chính như sau:

````txt
backend/
├── src/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   ├── interface/
│   ├── shared/
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── Dockerfile
├── nest-cli.json
├── package.json
├── package-lock.json
└── tsconfig.json

Project có vẻ đang tổ chức theo hướng Clean Architecture / Layered Architecture, chia code theo các layer:

domain/: chứa logic nghiệp vụ cốt lõi, entities, domain models, domain rules, interfaces cốt lõi nếu có.
application/: chứa use cases, application services, DTO application-level, business workflows.
infrastructure/: chứa database, ORM, repositories implementation, external services, config kỹ thuật.
interface/: chứa controller, route handler, request/response DTO, API layer.
shared/: chứa common utilities, decorators, guards, filters, constants, helpers, base classes.

Nhiệm vụ của bạn là đọc toàn bộ source code backend và tạo một file tài liệu Markdown mô tả chi tiết toàn bộ dự án.

File cần tạo:

docs/backend-project-overview.md

Nếu thư mục docs/ chưa tồn tại thì tạo mới.

Yêu cầu quan trọng
1. Chỉ được tạo tài liệu, không sửa logic code

Bạn chỉ được:

Đọc source code
Phân tích kiến trúc
Tạo file Markdown documentation

Tuyệt đối không được:

Refactor code
Sửa logic API
Đổi route
Đổi tên file
Đổi cấu trúc thư mục
Format lại toàn bộ project
Thêm package mới
Chạy migration hoặc thay đổi database
2. Mục tiêu tài liệu

Hãy tạo tài liệu mô tả chi tiết toàn bộ backend project, bao gồm:

Dự án này dùng để làm gì
Backend đang giải quyết bài toán gì
Tech stack đang sử dụng
Framework backend đang dùng
Database/ORM nếu có
Kiến trúc tổng thể
Ý nghĩa từng layer trong project
Cách request đi từ client vào backend
Cách code được tổ chức theo từng layer
Các module/chức năng chính
Các flow nghiệp vụ quan trọng
API overview
Database/schema overview
Auth/permission nếu có
Error handling
Config/env
Docker/setup/run project
Hướng dẫn cho developer mới đọc source code

Tài liệu phải viết bằng tiếng Việt, dễ hiểu cho developer junior/mid-level.

3. Phân tích theo đúng kiến trúc thư mục hiện tại

Hãy phân tích kỹ từng thư mục dưới đây.

3.1. src/main.ts

Mô tả:

File này có phải entry point của app không
App được bootstrap như thế nào
Có dùng global prefix không
Có bật validation pipe không
Có bật CORS không
Có dùng global filter/interceptor/guard không
Server chạy ở port nào
Port lấy từ đâu
File này liên kết với app.module.ts như thế nào

Format mong muốn:

## Entry Point: `src/main.ts`

`main.ts` là điểm khởi động chính của NestJS application.

Luồng xử lý:
1. Tạo Nest application từ `AppModule`.
2. Cấu hình global middleware/pipe/filter nếu có.
3. Bật CORS nếu có.
4. Lắng nghe server ở port được cấu hình.

File liên quan:
- `src/main.ts`
- `src/app.module.ts`
3.2. src/app.module.ts

Mô tả:

Đây có phải root module không
Import những module nào
Cách app đăng ký các module chính
Có load config/database/auth module ở đây không
Các provider global nếu có
Vai trò của file này trong toàn bộ project

Format:

## Root Module: `src/app.module.ts`

`AppModule` là module gốc của backend.
File này chịu trách nhiệm import các module chính của hệ thống.

Các module được import:
- ...
3.3. Layer src/domain/

Phân tích chi tiết thư mục domain/.

Hãy mô tả:

Domain layer đang chứa gì
Có entities/domain models không
Có value objects không
Có domain services không
Có repository interfaces không
Có enum/status nghiệp vụ không
Có business rules nào quan trọng không
Các file quan trọng nằm ở đâu

Mục tiêu là giải thích rõ:

Domain layer là phần lõi nghiệp vụ, không nên phụ thuộc vào framework, database hoặc controller.

Format:

## Layer: Domain

### Mục đích
`src/domain/` chứa phần nghiệp vụ cốt lõi của hệ thống.

### Thành phần tìm thấy
| Thành phần | File | Mô tả |
|---|---|---|
| Entity | `src/domain/...` | ... |
| Repository Interface | `src/domain/...` | ... |
| Enum | `src/domain/...` | ... |

### Vai trò trong kiến trúc
Domain layer được application layer gọi để thực hiện nghiệp vụ.

Nếu trong code thực tế domain đang phụ thuộc framework hoặc database, hãy ghi chú lại là:

Ghi chú: Một số file trong domain hiện đang phụ thuộc vào ..., cần kiểm tra thêm nếu muốn giữ Clean Architecture nghiêm ngặt.
3.4. Layer src/application/

Phân tích chi tiết thư mục application/.

Hãy mô tả:

Application layer chứa use case nào
Có application services không
Có command/query handler không
Có DTO nội bộ không
Luồng nghiệp vụ được điều phối ở đâu
Application layer gọi domain và infrastructure như thế nào
Các file quan trọng nằm ở đâu

Mục tiêu là giải thích rõ:

Application layer điều phối use case, nhận dữ liệu từ interface layer, xử lý nghiệp vụ và gọi repository/service phù hợp.

Format:

## Layer: Application

### Mục đích
`src/application/` chứa các use case và application service của hệ thống.

### Use case chính
| Use case | File | Mô tả |
|---|---|---|
| Login | `src/application/...` | Xử lý đăng nhập |
| Register | `src/application/...` | Xử lý đăng ký |

### Cách hoạt động
1. Controller ở `interface/` nhận request.
2. Controller gọi use case/application service.
3. Application layer xử lý nghiệp vụ.
4. Application layer gọi domain/repository interface.
5. Infrastructure layer thực thi thao tác database/external service.
3.5. Layer src/infrastructure/

Phân tích chi tiết thư mục infrastructure/.

Hãy mô tả:

Infrastructure layer đang chứa gì
Database connection nằm ở đâu
ORM config nằm ở đâu
Repository implementation nằm ở đâu
External services nằm ở đâu
Email/storage/payment/AI provider nếu có
Config kỹ thuật nằm ở đâu
Docker có liên quan gì không

Mục tiêu là giải thích rõ:

Infrastructure layer chịu trách nhiệm kết nối với thế giới bên ngoài như database, file storage, email service, third-party API.

Format:

## Layer: Infrastructure

### Mục đích
`src/infrastructure/` chứa các implementation kỹ thuật của hệ thống.

### Thành phần chính
| Thành phần | File | Mô tả |
|---|---|---|
| Database Config | `src/infrastructure/...` | Cấu hình kết nối database |
| Repository Implementation | `src/infrastructure/...` | Triển khai repository |
| External Service | `src/infrastructure/...` | Gọi dịch vụ bên ngoài |

### Vai trò trong flow
Infrastructure được gọi bởi application layer thông qua repository/service implementation.
3.6. Layer src/interface/

Phân tích chi tiết thư mục interface/.

Hãy mô tả:

Controller nằm ở đâu
Route/API được khai báo ở đâu
Request DTO nằm ở đâu
Response DTO/Presenter nếu có
API versioning nếu có
Guard/decorator gắn trên controller nếu có
Controller gọi application service/use case nào

Mục tiêu là giải thích rõ:

Interface layer là nơi nhận HTTP request từ client và chuyển request vào application layer.

Format:

## Layer: Interface

### Mục đích
`src/interface/` là API layer của backend.

### Controller/API tìm thấy
| Controller | Route base | File | Mô tả |
|---|---|---|---|
| AuthController | `/auth` | `src/interface/...` | Xử lý API đăng nhập/đăng ký |

### Luồng request
1. Client gọi API.
2. Request đi vào controller trong `interface/`.
3. DTO validate dữ liệu.
4. Controller gọi use case/application service.
5. Kết quả trả về client.
3.7. Layer src/shared/

Phân tích chi tiết thư mục shared/.

Hãy mô tả:

Có common decorators không
Có guards không
Có interceptors không
Có filters không
Có pipes không
Có constants không
Có helper/utils không
Có base response format không
Có exception class dùng chung không

Format:

## Layer: Shared

### Mục đích
`src/shared/` chứa các thành phần dùng chung toàn hệ thống.

### Thành phần chính
| Thành phần | File | Mô tả |
|---|---|---|
| Exception Filter | `src/shared/...` | Xử lý lỗi toàn cục |
| Guard | `src/shared/...` | Kiểm tra xác thực/phân quyền |
| Decorator | `src/shared/...` | Lấy user hiện tại từ request |
4. Mô tả kiến trúc tổng quan

Tạo section:

# Kiến trúc tổng quan

Trong đó phân tích project theo hướng:

Client
  ↓
Interface Layer
  ↓
Application Layer
  ↓
Domain Layer
  ↓
Infrastructure Layer
  ↓
Database / External Services

Giải thích rõ:

Client gọi API vào controller ở interface/
Controller không nên xử lý business logic quá nhiều
Controller chuyển dữ liệu cho application layer
Application layer điều phối use case
Domain layer chứa rule nghiệp vụ
Infrastructure layer xử lý database/external service
Shared layer cung cấp tiện ích dùng chung

Nếu code thực tế có flow khác, hãy mô tả theo code thật, không đoán.

Thêm Mermaid diagram:

5. Mô tả chi tiết từng module/chức năng

Hãy tự động phát hiện các module/chức năng chính trong project.

Ví dụ có thể là:

Auth
User
Role/Permission
Product
Category
Wardrobe
Outfit
File Upload
AI
Payment
Subscription
Admin
Notification
Các module khác nếu có trong source code

Với mỗi module, viết theo format:

## Module: Tên module

### Mục đích
Module này dùng để làm gì.

### File liên quan
| Layer | File | Vai trò |
|---|---|---|
| Interface | `src/interface/...` | Controller/API |
| Application | `src/application/...` | Use case/service |
| Domain | `src/domain/...` | Entity/rule/interface |
| Infrastructure | `src/infrastructure/...` | Repository/database implementation |
| Shared | `src/shared/...` | Guard/filter/decorator nếu có |

### API/Route liên quan
| Method | Endpoint | Auth Required | Mô tả | File xử lý |
|---|---|---|---|---|
| POST | `/...` | Yes/No | ... | `src/interface/...` |

### Luồng xử lý chính
1. Client gọi endpoint nào.
2. Request đi vào controller nào trong `interface/`.
3. DTO nào validate request.
4. Controller gọi use case/application service nào trong `application/`.
5. Application layer gọi domain entity/rule nào.
6. Application layer gọi repository/service nào.
7. Repository implementation trong `infrastructure/` thao tác database hoặc external service.
8. Kết quả trả ngược lại application layer.
9. Controller trả response về client.
10. Lỗi được xử lý ở đâu.

### Ghi chú kỹ thuật
- Những điểm cần chú ý khi maintain module này.
- Những dependency quan trọng.
- Những file không nên sửa bừa.
6. Mô tả flow nghiệp vụ từ đầu đến cuối

Hãy chọn tất cả flow quan trọng trong project và mô tả cực kỳ chi tiết.

Các flow cần tìm nếu có:

Register
Login
Refresh token
Logout
Get current user/profile
Update profile
Create resource
Update resource
Delete resource
Upload file
Admin manage users
Role/permission
Payment/subscription
Các flow nghiệp vụ khác tự phát hiện từ source code

Với mỗi flow, viết theo format:

## Flow: User Login

### Mục đích
Mô tả flow này dùng để làm gì.

### Endpoint bắt đầu
`POST /api/v1/auth/login`

### File tham gia trong flow
| Layer | File | Vai trò |
|---|---|---|
| Interface | `src/interface/...` | Nhận request |
| Application | `src/application/...` | Xử lý use case |
| Domain | `src/domain/...` | Entity/rule nghiệp vụ |
| Infrastructure | `src/infrastructure/...` | Truy vấn database |
| Shared | `src/shared/...` | Guard/filter/helper nếu có |

### Flow từ đầu đến cuối
1. Client gửi request đến endpoint.
2. Request đi vào controller trong `src/interface/...`.
3. Request body/query/params được validate bởi DTO nào.
4. Controller gọi use case/application service trong `src/application/...`.
5. Application layer kiểm tra nghiệp vụ.
6. Application layer dùng entity/domain rule trong `src/domain/...` nếu có.
7. Application layer gọi repository interface hoặc service.
8. Repository implementation trong `src/infrastructure/...` query database.
9. Database trả dữ liệu.
10. Application layer xử lý kết quả.
11. Controller nhận kết quả.
12. Response trả về client.
13. Nếu lỗi xảy ra, lỗi được throw ở đâu và được xử lý bởi filter nào.

### Sequence diagram
Nếu đủ thông tin, tạo Mermaid diagram:

```mermaid
sequenceDiagram
  Client->>Controller: POST /auth/login
  Controller->>UseCase: execute(dto)
  UseCase->>Repository: findByEmail(email)
  Repository->>Database: Query user
  Database-->>Repository: User data
  Repository-->>UseCase: User entity
  UseCase->>UseCase: Validate password
  UseCase->>UseCase: Generate token
  UseCase-->>Controller: Result
  Controller-->>Client: Response
Response thành công

Mô tả structure response dựa trên code thật.

Error cases
Trường hợp lỗi	Nơi throw lỗi	Nơi xử lý	Response
Sai thông tin đăng nhập	src/application/...	src/shared/...	...
File cần đọc nếu muốn sửa flow này
...

---

# 7. API Overview

Tạo bảng tổng hợp tất cả API tìm được trong project.

Format:

```md
# API Overview

| Method | Endpoint | Module | Auth Required | Request DTO | Response | File xử lý |
|---|---|---|---|---|---|---|
| POST | `/auth/login` | Auth | No | `LoginDto` | Login response | `src/interface/...` |

Lưu ý:

Nếu có global prefix trong main.ts, hãy ghép endpoint đầy đủ.
Nếu có versioning /api/v1, hãy ghi rõ.
Nếu không chắc endpoint chính xác, ghi Cần kiểm tra thêm.
Không được tự bịa API không có trong code.
8. Database / Schema Overview

Hãy phân tích database từ project.

Tìm trong:

src/infrastructure/
ORM config
entity files
schema files
migration files
prisma schema nếu có
TypeORM entity nếu có
Sequelize model nếu có
Mongoose schema nếu có

Viết section:

# Database Overview

Bao gồm:

Database đang dùng
ORM/query builder đang dùng
File config database
Danh sách bảng/collection/entity
Field quan trọng
Quan hệ giữa entity
Enum/status
Unique/index nếu có
Migration/seed nếu có

Format bảng:

| Entity/Table | File | Mục đích | Quan hệ |
|---|---|---|---|
| User | `src/domain/...` | Lưu thông tin user | User có nhiều ... |

Nếu có thể, tạo ERD Mermaid:

9. Authentication & Authorization

Nếu project có auth, hãy mô tả:

Login xử lý ở đâu
Register xử lý ở đâu
Password hash ở đâu
Access token được tạo ở đâu
Refresh token nếu có
JWT strategy/guard nằm ở đâu
Current user decorator nếu có
Role guard/permission guard nếu có
Public route decorator nếu có
Token được đọc từ header/cookie/body như thế nào
File liên quan

Format:

# Authentication & Authorization

## Authentication
...

## Authorization
...

## File liên quan
| File | Vai trò |
|---|---|
| `src/interface/...` | Auth controller |
| `src/application/...` | Auth use case |
| `src/shared/...` | JWT guard |
10. Error Handling & Validation

Phân tích:

Validation pipe có bật global không
DTO dùng class-validator/class-transformer hay thư viện nào khác
Custom exception có không
Global exception filter nằm ở đâu
Format response lỗi
Lỗi database được xử lý không
Lỗi auth được xử lý không

Format:

# Error Handling & Validation

## Validation
...

## Exception Handling
...

## Error Response Format
```json
{
  "statusCode": 400,
  "message": "...",
  "error": "Bad Request"
}

Không được bịa response format. Chỉ ghi nếu tìm thấy trong code. Nếu không thấy, ghi `Cần kiểm tra thêm`.

---

# 11. Config & Environment Variables

Đọc:

- `.env.example`
- config files trong `src/infrastructure/`
- config files trong `src/shared/`
- `main.ts`
- `app.module.ts`

Tạo bảng:

```md
# Environment Variables

| Biến môi trường | Mục đích | File sử dụng | Ghi chú |
|---|---|---|---|
| PORT | Port chạy server | `src/main.ts` | Không ghi giá trị secret thật |
| DATABASE_URL | Kết nối database | `src/infrastructure/...` | Không expose credential |

Quy tắc:

Không ghi secret thật từ .env nếu có.
Chỉ mô tả tên biến và mục đích.
Có thể đọc .env.example.
12. Docker & Setup Project

Phân tích:

Dockerfile
package.json
nest-cli.json
tsconfig.json
file docker-compose nếu có
script npm

Viết section:

# Setup & Run Project

Bao gồm:

Cài dependencies
npm install
Chạy development

Dựa trên script thật trong package.json.

npm run start:dev
Build production
npm run build
Run production
npm run start:prod
Chạy Docker

Dựa trên Dockerfile thật.

docker build -t backend .
docker run -p 3000:3000 backend

Chỉ viết command đúng với project thật. Nếu không chắc, ghi Cần kiểm tra thêm.

13. Hướng dẫn developer mới đọc source code

Tạo section:

# Hướng dẫn đọc source code cho developer mới

Đề xuất thứ tự đọc:

package.json
src/main.ts
src/app.module.ts
src/interface/
src/application/
src/domain/
src/infrastructure/
src/shared/
.env.example
Dockerfile

Giải thích:

Đọc package.json để biết scripts và dependencies.
Đọc main.ts để hiểu app bootstrap.
Đọc app.module.ts để biết module nào được load.
Đọc interface/ để hiểu API đi vào đâu.
Đọc application/ để hiểu use case.
Đọc domain/ để hiểu nghiệp vụ lõi.
Đọc infrastructure/ để hiểu database/external services.
Đọc shared/ để hiểu guard/filter/helper dùng chung.
14. Kiểm tra mức độ tuân thủ Clean Architecture

Vì project có các thư mục application, domain, infrastructure, interface, shared, hãy thêm section:

# Đánh giá nhanh kiến trúc hiện tại

Phân tích:

Code có đang tách layer rõ không
domain/ có bị phụ thuộc vào NestJS/database không
application/ có chứa business workflow không
interface/ có bị chứa quá nhiều logic nghiệp vụ không
infrastructure/ có đang chịu trách nhiệm database/external service không
Có dependency ngược chiều không
Có điểm nào nên refactor trong tương lai không

Lưu ý: Chỉ đánh giá và ghi nhận trong tài liệu, không được tự refactor.

Format:

## Điểm tốt
- ...

## Điểm cần kiểm tra thêm
- ...

## Gợi ý cải thiện sau này
- ...
15. Quy tắc viết tài liệu

Khi viết tài liệu:

Luôn dựa trên code thật.
Không đoán bừa.
Nếu không chắc, ghi rõ Cần kiểm tra thêm.
Luôn ghi rõ file path liên quan.
Không bỏ qua module nhỏ.
Không viết chung chung.
Ưu tiên mô tả theo flow request → controller → use case/service → domain → repository → database → response.
Viết bằng tiếng Việt dễ hiểu.
Có thể dùng bảng Markdown.
Có thể dùng Mermaid diagram.
Không expose secret thật.
Không thay đổi source code.
````
