
export interface AllowlistRecordInput { email: string; note?: string; isActive?: boolean }
export interface BulkImportAllowlistRequest { records: AllowlistRecordInput[] }
export interface RegisterStudentRequest { email: string; password: string; fullName: string; }
export interface CreateBoardQuestionRequest { title: string; content: string; subjectId: string; classId: string; isAnonymous?: boolean; }
export interface CreateBoardAnswerRequest { content: string; isAnonymous?: boolean; }
export interface AddBookmarkRequest { resourceType: string; resourceId: string; note?: string; }
export interface CreateChatRequest { subjectId: string; classId?: string; title?: string; }
export interface CreateClassRequest { name: string; description?: string; code: string; subjectId: string; instructorId: string; maxCapacity?: number; isActive?: boolean; }
export interface EnrollClassRequest { code: string; }
export interface GenerateExamRequest { subjectId: string; classId?: string; durationMinutes?: number; totalQuestions?: number; type?: string; }
export interface SubmitAttemptRequest { answers: { questionId: string; selectedOptionId: string }[] }
export interface SubmitExamAttemptRequest { answers: { questionId: string; selectedOptionId: string }[] }
export interface GenerateFlashcardsRequest { subjectId: string; title: string; count?: number; sourceMaterial?: string; }
export interface CreateRoleRequest { name: string; permissions: string[] }
export interface CreateSubjectRequest { code: string; name: string; description?: string; credits?: number; }
export interface UpdateSubjectRequest { name?: string; description?: string; credits?: number; }
export interface CreateUserRequest { email: string; fullName: string; password?: string; roles?: string[] }
export interface LoginRequest { email: string; password?: string; }
