export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  analytics: {
    overview: ['analytics', 'overview'] as const,
    aiUsage: ['analytics', 'aiUsage'] as const,
  },
  system: {
    settings: ['system', 'settings'] as const,
    auditLogs: (params: any) => ['system', 'auditLogs', params] as const,
    stats: ['system', 'stats'] as const,
  },
  allowlist: {
    list: (params: any) => ['allowlist', 'list', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: any) => [...queryKeys.users.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    verifications: ['users', 'verifications'] as const,
    verificationDetail: (id: string) => ['users', 'verifications', id] as const,
  },
  rbac: {
    roles: ['rbac', 'roles'] as const,
    permissions: ['rbac', 'permissions'] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    list: (params: any) => [...queryKeys.subjects.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.subjects.all, 'detail', id] as const,
    documents: (id: string) => [...queryKeys.subjects.all, 'detail', id, 'documents'] as const,
    documentSummary: (subjectId: string, documentId: string) => [...queryKeys.subjects.all, 'detail', subjectId, 'documents', documentId, 'summary'] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: (subjectId: string) => [...queryKeys.classes.all, 'list', { subjectId }] as const,
    detail: (classId: string) => [...queryKeys.classes.all, 'detail', classId] as const,
    students: (subjectId: string, classId: string) => [...queryKeys.classes.all, 'detail', classId, 'students', { subjectId }] as const,
    stats: (subjectId: string, classId: string) => [...queryKeys.classes.all, 'detail', classId, 'stats', { subjectId }] as const,
    engagement: (subjectId: string, classId: string) => [...queryKeys.classes.all, 'detail', classId, 'engagement', { subjectId }] as const,
    studentEngagement: (subjectId: string, classId: string, studentId: string) => [...queryKeys.classes.all, 'detail', classId, 'engagement', studentId, { subjectId }] as const,
    availableClasses: (subjectId: string) => [...queryKeys.classes.all, 'available', { subjectId }] as const,
    lecturers: (subjectId: string) => [...queryKeys.classes.all, 'lecturers', { subjectId }] as const,
    myClass: (subjectId: string) => [...queryKeys.classes.all, 'myClass', { subjectId }] as const,
  },
  exams: {
    all: ['exams'] as const,
    list: (subjectId: string, classId?: string) => [...queryKeys.exams.all, 'list', { subjectId, classId }] as const,
    detail: (subjectId: string, examId: string) => [...queryKeys.exams.all, 'detail', { subjectId, examId }] as const,
    myWeakTopics: (subjectId: string) => [...queryKeys.exams.all, 'myWeakTopics', { subjectId }] as const,
    myAttempts: ['exams', 'myAttempts'] as const,
    attemptResult: (attemptId: string) => ['exams', 'attemptResult', attemptId] as const,
  },
  flashcards: {
    all: ['flashcards'] as const,
    list: (subjectId: string, classId?: string) => [...queryKeys.flashcards.all, 'list', { subjectId, classId }] as const,
    detail: (subjectId: string, setId: string) => [...queryKeys.flashcards.all, 'detail', { subjectId, setId }] as const,
    discover: (params: any) => [...queryKeys.flashcards.all, 'discover', params] as const,
    leaderboard: (subjectId?: string) => [...queryKeys.flashcards.all, 'leaderboard', { subjectId }] as const,
  },
  board: {
    all: ['board'] as const,
    questions: (subjectId: string, classId: string, params: any) => [...queryKeys.board.all, 'questions', { subjectId, classId, params }] as const,
    answers: (subjectId: string, classId: string, questionId: string) => [...queryKeys.board.all, 'questions', questionId, 'answers', { subjectId, classId }] as const,
  },
  bookmarks: {
    list: (resourceType?: string) => ['bookmarks', 'list', { resourceType }] as const,
  },
  chats: {
    all: ['chats'] as const,
    list: (params: any) => [...queryKeys.chats.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.chats.all, 'detail', id] as const,
  },
  study: {
    all: ['study'] as const,
    queue: (setId: string) => [...queryKeys.study.all, 'queue', setId] as const,
    settings: ['study', 'settings'] as const,
    stats: ['study', 'stats'] as const,
    currentPlan: ['study', 'plan', 'current'] as const,
    planHistory: (limit?: number) => ['study', 'plan', 'history', { limit }] as const,
  },
  badges: {
    all: ['badges'] as const,
    catalogue: [...['badges'], 'catalogue'] as const,
    my: [...['badges'], 'my'] as const,
    user: (userId: string) => [...queryKeys.badges.all, 'user', userId] as const,
  },
}
