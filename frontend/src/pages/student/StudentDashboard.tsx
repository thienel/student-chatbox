import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { subjectsApi } from '../../api/subjects.api';
import { chatApi } from '../../api/chat.api';
import { BookOpen, MessageSquare, ChevronRight, GraduationCap } from 'lucide-react';
import type { Subject, Chat } from '../../types';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, chatsRes] = await Promise.all([
          subjectsApi.list(),
          chatApi.list(),
        ]);
        const allSubjects = subjectsRes.data.data.items ?? [];
        setEnrolledSubjects(allSubjects.filter((s) => s.isEnrolled));
        const chats = Array.isArray(chatsRes.data.data) ? chatsRes.data.data : [];
        setRecentChats(chats.slice(0, 5));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Chào mừng, {user?.fullName}!</h1>
        <p className="text-sm text-gray-500 mt-1">Tiếp tục hành trình học tập của bạn</p>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-10">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Enrolled Subjects */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Môn học đã đăng ký
                </h2>
                <button
                  onClick={() => navigate('/student/subjects')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {enrolledSubjects.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 p-12 rounded-2xl text-center">
                  <GraduationCap className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-800 mb-1">Chưa đăng ký môn học nào</h3>
                  <p className="text-gray-500 text-sm mb-4">Đăng ký môn học để bắt đầu học cùng AI</p>
                  <button
                    onClick={() => navigate('/student/subjects')}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Tìm môn học
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledSubjects.slice(0, 6).map((subject) => (
                    <div
                      key={subject.id}
                      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group"
                      onClick={() => navigate(`/student/subjects/${subject.id}`)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="mb-1">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {subject.code}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{subject.description ?? 'Môn học'}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/subjects/${subject.id}`);
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Trò chuyện
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Chats */}
            {recentChats.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Cuộc trò chuyện gần đây
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                  {recentChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/student/subjects/${chat.subjectId}/chat/${chat.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{chat.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(chat.updatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
