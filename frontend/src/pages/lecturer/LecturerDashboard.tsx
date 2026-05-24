import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { subjectsApi } from '../../api/subjects.api';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';
import type { Subject } from '../../types';

const LecturerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subjectsApi
      .list()
      .then((res) => setSubjects(res.data.data.items ?? []))
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName}!</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý tài liệu giảng dạy của bạn</p>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Môn học được phân công
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p>Bạn chưa được phân công vào môn học nào</p>
            <p className="text-sm mt-1 text-gray-400">Liên hệ Admin để được phân công</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {subject.code}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-1 mb-1">{subject.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{subject.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/lecturer/subjects/${subject.id}/documents`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Tài liệu
                  </button>
                  <button
                    onClick={() => navigate(`/lecturer/subjects/${subject.id}/chat/new`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Chat AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LecturerDashboard;
