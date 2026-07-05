import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUserStore } from '@/store/useUserStore'
import { authApi } from '@/api/endpoints/auth'
import { AppShell } from '@/components/layout/AppShell'
import { SubjectShell } from '@/components/layout/SubjectShell'
import { AdminShell } from '@/components/layout/AdminShell'
import { LecturerShell } from '@/components/layout/LecturerShell'

import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import VerifyOtpPage from '@/features/auth/VerifyOtpPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import HomePage from '@/features/subjects/HomePage'
import SubjectsPage from '@/features/subjects/SubjectsPage'
import SubjectDocumentsPage from '@/features/subjects/SubjectDocumentsPage'
import SubjectChatPage from '@/features/subjects/SubjectChatPage'
import SubjectMembersPage from '@/features/subjects/SubjectMembersPage'
import SubjectFlashcardsPage from '@/features/flashcards/SubjectFlashcardsPage'
import FlashcardStudyPage from '@/features/flashcards/FlashcardStudyPage'
import StudySessionPage from '@/features/flashcards/StudySessionPage'
import SubjectExamsPage from '@/features/exams/SubjectExamsPage'
import CreateOfficialExamPage from '@/features/exams/CreateOfficialExamPage'
import WeakTopicsPage from '@/features/exams/WeakTopicsPage'
import BoardPage from '@/features/board/BoardPage'
import ClassesPage from '@/features/classes/ClassesPage'
import StudentsPage from '@/features/classes/StudentsPage'
import EngagementPage from '@/features/classes/EngagementPage'
import ExamDetailPage from '@/features/exams/ExamDetailPage'
import TakeExamPage from '@/features/exams/TakeExamPage'
import ExamResultPage from '@/features/exams/ExamResultPage'
import ExamHistoryPage from '@/features/exams/ExamHistoryPage'
import BookmarksPage from '@/features/bookmarks/BookmarksPage'
import CommunityPage from '@/features/community/CommunityPage'
import StudyPlanPage from '@/features/plan/StudyPlanPage'
import MyBadgesPage from '@/features/badges/MyBadgesPage'
import ChatsPage from '@/features/chat/ChatsPage'
import AdminDashboardPage from '@/features/admin/AdminDashboardPage'
import AdminUsersPage from '@/features/admin/AdminUsersPage'
import AdminSubjectsPage from '@/features/admin/AdminSubjectsPage'
import AdminSettingsPage from '@/features/admin/AdminSettingsPage'
import AdminAuditLogsPage from '@/features/admin/AdminAuditLogsPage'
import AdminAnalyticsPage from '@/features/admin/AdminAnalyticsPage'
import AdminRbacPage from '@/features/admin/AdminRbacPage'
import SettingsPage from '@/features/settings/SettingsPage'
import AdminStudentVerificationsPage from '@/features/admin/AdminStudentVerificationsPage'
import LecturerDashboardPage from '@/features/lecturer/LecturerDashboardPage'

interface ProtectedProps {
  children: React.ReactNode
  roles?: Array<'admin' | 'lecturer' | 'student'>
}

function Protected({ children, roles }: ProtectedProps) {
  const { accessToken } = useAuthStore()
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken && !user) {
      authApi.me()
        .then(data => setUser(data))
        .catch(() => { })
        .finally(() => setLoading(false))
    } else {
      loading && setLoading(false)
    }
  }, [accessToken, user, setUser, loading])

  if (!accessToken) return <Navigate to="/login" replace />
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/home" replace />
  if (!roles && user && user.role === 'admin') return <Navigate to="/admin" replace />
  if (!roles && user && user.role === 'lecturer') return <Navigate to="/lecturer" replace />

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
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Main shell — all authenticated routes */}
      <Route element={<Protected><AppShell /></Protected>}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/study-plan" element={<StudyPlanPage />} />
        <Route path="/badges" element={<MyBadgesPage />} />
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
        <Route path="/subjects/:id/classes" element={<ClassesPage />} />
        <Route path="/subjects/:id/students" element={<StudentsPage />} />
        <Route path="/subjects/:id/engagement" element={<EngagementPage />} />
        <Route path="/subjects/:id/flashcards" element={<SubjectFlashcardsPage />} />
        <Route path="/subjects/:id/flashcards/:setId" element={<FlashcardStudyPage />} />
        <Route path="/subjects/:id/flashcards/:setId/study" element={<StudySessionPage />} />
        <Route path="/subjects/:id/exams" element={<SubjectExamsPage />} />
        <Route path="/subjects/:id/exams/new" element={<CreateOfficialExamPage />} />
        <Route path="/subjects/:id/exam-history" element={<ExamHistoryPage />} />
        <Route path="/subjects/:id/weak-topics" element={<WeakTopicsPage />} />
        <Route path="/subjects/:id/board" element={<BoardPage />} />
        <Route path="/subjects/:id/exams/:examId" element={<ExamDetailPage />} />
        <Route path="/subjects/:id/exams/:examId/attempt/:attemptId" element={<TakeExamPage />} />
        <Route path="/subjects/:id/exams/:examId/result/:attemptId" element={<ExamResultPage />} />
      </Route>

      {/* Admin shell */}
      <Route element={<Protected roles={['admin']}><AdminShell /></Protected>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/verifications" element={<AdminStudentVerificationsPage />} />
        <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/rbac" element={<AdminRbacPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Lecturer shell */}
      <Route element={<Protected roles={['lecturer']}><LecturerShell /></Protected>}>
        <Route path="/lecturer" element={<Navigate to="dashboard" replace />} />
        <Route path="/lecturer/dashboard" element={<LecturerDashboardPage />} />
        <Route path="/lecturer/subjects" element={<SubjectsPage />} />
        <Route path="/lecturer/settings" element={<SettingsPage />} />

        {/* Nested subject contextual routes */}
        <Route path="/lecturer/subjects/:id/documents" element={<SubjectDocumentsPage />} />
        <Route path="/lecturer/subjects/:id/classes" element={<ClassesPage />} />
        <Route path="/lecturer/subjects/:id/students" element={<StudentsPage />} />
        <Route path="/lecturer/subjects/:id/engagement" element={<EngagementPage />} />
        <Route path="/lecturer/subjects/:id/board" element={<BoardPage />} />
        <Route path="/lecturer/subjects/:id/exams" element={<SubjectExamsPage />} />
        <Route path="/lecturer/subjects/:id/exams/new" element={<CreateOfficialExamPage />} />
        <Route path="/lecturer/subjects/:id/flashcards" element={<SubjectFlashcardsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
