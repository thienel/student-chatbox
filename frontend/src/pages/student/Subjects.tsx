import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectsApi } from '../../api/subjects.api';
import { BookOpen, CheckCircle, Plus, Minus } from 'lucide-react';
import type { Subject } from '../../types';
import type { AxiosError } from 'axios';

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    subjectsApi
      .list()
      .then((res) => setSubjects(res.data.data.items ?? []))
      .catch(() => showToast('Không thể tải danh sách môn học', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (subject: Subject) => {
    setEnrolling(subject.id);
    try {
      if (subject.isEnrolled) {
        await subjectsApi.unenroll(subject.id);
        setSubjects((prev) =>
          prev.map((s) => (s.id === subject.id ? { ...s, isEnrolled: false } : s))
        );
        showToast(`Đã hủy đăng ký ${subject.name}`, 'success');
      } else {
        await subjectsApi.enroll(subject.id);
        setSubjects((prev) =>
          prev.map((s) => (s.id === subject.id ? { ...s, isEnrolled: true } : s))
        );
        showToast(`Đã đăng ký ${subject.name}`, 'success');
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      showToast(axiosErr.response?.data?.error?.message ?? 'Thao tác thất bại', 'error');
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Danh sách môn học</h1>
        <p className="text-sm text-gray-500 mt-1">Đăng ký các môn học để truy cập tài liệu và AI</p>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p>Hiện chưa có môn học nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                  subject.isEnrolled ? 'border-indigo-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => subject.isEnrolled && navigate(`/student/subjects/${subject.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {subject.code}
                      </span>
                      {subject.isEnrolled && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã đăng ký
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{subject.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{subject.description}</p>
                    {subject.lecturers && subject.lecturers.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        GV: {subject.lecturers.map((l) => l.fullName).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEnroll(subject)}
                    disabled={enrolling === subject.id}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      subject.isEnrolled
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                    }`}
                  >
                    {enrolling === subject.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : subject.isEnrolled ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {subject.isEnrolled ? 'Hủy đăng ký' : 'Đăng ký'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Subjects;
