import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { AppShell } from '@/components/layout/AppShell'
import { SubjectShell } from '@/components/layout/SubjectShell'
import { AdminShell } from '@/components/layout/AdminShell'

import LoginPage from '@/features/auth/LoginPage'
import HomePage from '@/features/subjects/HomePage'
import SubjectsPage from '@/features/subjects/SubjectsPage'
import SubjectDocumentsPage from '@/features/subjects/SubjectDocumentsPage'
import SubjectChatPage from '@/features/subjects/SubjectChatPage'
import SubjectMembersPage from '@/features/subjects/SubjectMembersPage'
import SubjectFlashcardsPage from '@/features/flashcards/SubjectFlashcardsPage'
import FlashcardStudyPage from '@/features/flashcards/FlashcardStudyPage'
import SubjectExamsPage from '@/features/exams/SubjectExamsPage'
import ExamDetailPage from '@/features/exams/ExamDetailPage'
import TakeExamPage from '@/features/exams/TakeExamPage'
import ExamResultPage from '@/features/exams/ExamResultPage'
import ExamHistoryPage from '@/features/exams/ExamHistoryPage'
import BookmarksPage from '@/features/bookmarks/BookmarksPage'
import ChatsPage from '@/features/chat/ChatsPage'
import AdminDashboardPage from '@/features/admin/AdminDashboardPage'
import AdminUsersPage from '@/features/admin/AdminUsersPage'
import AdminSubjectsPage from '@/features/admin/AdminSubjectsPage'
import AdminSettingsPage from '@/features/admin/AdminSettingsPage'
import AdminAuditLogsPage from '@/features/admin/AdminAuditLogsPage'
import AdminAnalyticsPage from '@/features/admin/AdminAnalyticsPage'
import AdminRbacPage from '@/features/admin/AdminRbacPage'
import SettingsPage from '@/features/settings/SettingsPage'

interface ProtectedProps {
  children: React.ReactNode
  roles?: Array<'admin' | 'lecturer' | 'student'>
}

function Protected({ children, roles }: ProtectedProps) {
  const { accessToken, user } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/home" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { accessToken } = useAuthStore()
  return accessToken ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Main shell — all authenticated routes */}
      <Route element={<Protected><AppShell /></Protected>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/exam-history" element={<ExamHistoryPage />} />
        <Route path="/exam-attempts/:attemptId" element={<ExamResultPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Subject shell — subject-scoped routes with sub-tabs */}
      <Route element={<Protected><SubjectShell /></Protected>}>
        <Route path="/subjects/:id" element={<Navigate to="documents" replace />} />
        <Route path="/subjects/:id/documents" element={<SubjectDocumentsPage />} />
        <Route path="/subjects/:id/chat" element={<SubjectChatPage />} />
        <Route path="/subjects/:id/chat/:chatId" element={<SubjectChatPage />} />
        <Route path="/subjects/:id/members" element={<SubjectMembersPage />} />
        <Route path="/subjects/:id/flashcards" element={<SubjectFlashcardsPage />} />
        <Route path="/subjects/:id/flashcards/:setId" element={<FlashcardStudyPage />} />
        <Route path="/subjects/:id/exams" element={<SubjectExamsPage />} />
        <Route path="/subjects/:id/exam-history" element={<ExamHistoryPage />} />
        <Route path="/subjects/:id/exams/:examId" element={<ExamDetailPage />} />
        <Route path="/subjects/:id/exams/:examId/attempt/:attemptId" element={<TakeExamPage />} />
        <Route path="/subjects/:id/exams/:examId/result/:attemptId" element={<ExamResultPage />} />
      </Route>

      {/* Admin shell */}
      <Route element={<Protected roles={['admin']}><AdminShell /></Protected>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/rbac" element={<AdminRbacPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
