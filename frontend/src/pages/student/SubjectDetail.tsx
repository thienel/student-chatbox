import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectsApi } from '../../api/subjects.api';
import { chatApi } from '../../api/chat.api';
import BackButton from '../../components/BackButton';
import { BookOpen, MessageSquarePlus, Trash2, MessageSquare } from 'lucide-react';
import type { Subject, Chat } from '../../types';
import type { AxiosError } from 'axios';

const SubjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [subjectRes, chatsRes] = await Promise.all([
          subjectsApi.getById(id),
          chatApi.list(id),
        ]);
        setSubject(subjectRes.data.data);
        setChats(Array.isArray(chatsRes.data.data) ? chatsRes.data.data : []);
      } catch {
        showToast('Không thể tải thông tin môn học', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCreateChat = async () => {
    if (!id) return;
    setCreating(true);
    try {
      const res = await chatApi.create({ subjectId: id, title: 'Cuộc trò chuyện mới' });
      const newChat = res.data.data;
      navigate(`/student/subjects/${id}/chat/${newChat.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      showToast(axiosErr.response?.data?.error?.message ?? 'Không thể tạo chat', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    try {
      await chatApi.delete(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } catch {
      showToast('Không thể xóa chat', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-5 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center gap-4">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{subject?.name}</h1>
            <p className="text-xs text-gray-400">{subject?.code}</p>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Subject Info */}
        {subject?.description && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-2">Mô tả môn học</h2>
            <p className="text-sm text-gray-600">{subject.description}</p>
            {subject.lecturers && subject.lecturers.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-medium">Giảng viên:</span>{' '}
                {subject.lecturers.map((l) => l.fullName).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Chats Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Lịch sử trò chuyện ({chats.length})
            </h2>
            <button
              onClick={handleCreateChat}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageSquarePlus className="w-4 h-4" />
              )}
              Tạo chat mới
            </button>
          </div>

          {chats.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</p>
              <button
                onClick={handleCreateChat}
                className="mt-3 px-4 py-2 text-sm text-indigo-600 font-medium hover:text-indigo-700"
              >
                Bắt đầu ngay
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/student/subjects/${id}/chat/${chat.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{chat.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(chat.updatedAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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

export default SubjectDetail;
