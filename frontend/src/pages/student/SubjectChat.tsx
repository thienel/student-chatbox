import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chat.api';
import { subjectsApi } from '../../api/subjects.api';
import ChatContainer from '../../components/ChatContainer';
import { MessageSquarePlus, PanelLeft, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import type { Chat, Message, Subject } from '../../types';
import type { AxiosError } from 'axios';

const SubjectChat = () => {
  const { id: subjectId, chatId } = useParams<{ id: string; chatId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isStudent = useParams().id !== undefined;
  const backPath = isStudent ? `/student/subjects/${subjectId ?? ''}` : `/lecturer/dashboard`;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!subjectId) return;
    const fetchBase = async () => {
      try {
        const [subRes, chatsRes] = await Promise.all([
          subjectsApi.getById(subjectId),
          chatApi.list(subjectId),
        ]);
        setSubject(subRes.data.data);
        const chatList = Array.isArray(chatsRes.data.data) ? chatsRes.data.data : [];
        setChats(chatList);
      } catch {
        showToast('Không thể tải dữ liệu', 'error');
      }
    };
    fetchBase();
  }, [subjectId]);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    chatApi
      .getById(chatId)
      .then((res) => {
        setCurrentChat(res.data.data.chat);
        setMessages(res.data.data.messages ?? []);
      })
      .catch(() => showToast('Không thể tải cuộc trò chuyện', 'error'))
      .finally(() => setLoading(false));
  }, [chatId]);

  const handleCreateChat = async () => {
    if (!subjectId) return;
    try {
      const res = await chatApi.create({ subjectId, title: 'Cuộc trò chuyện mới' });
      const newChat = res.data.data;
      setChats((prev) => [newChat, ...prev]);
      navigate(`/student/subjects/${subjectId}/chat/${newChat.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      showToast(axiosErr.response?.data?.error?.message ?? 'Không thể tạo chat mới', 'error');
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    try {
      await chatApi.delete(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (chatId === id) {
        navigate(`/student/subjects/${subjectId ?? ''}`);
      }
    } catch {
      showToast('Không thể xóa', 'error');
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Chat Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 shrink-0 bg-gray-50 border-r border-gray-200 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-bold text-gray-800 truncate text-sm">{subject?.name ?? 'Môn học'}</span>
        </div>

        <div className="p-3">
          <button
            onClick={handleCreateChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700 transition text-sm font-medium"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Chat mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {chats.map((chat) => (
            <div key={chat.id} className="relative group flex items-center">
              <button
                onClick={() => navigate(`/student/subjects/${subjectId}/chat/${chat.id}`)}
                className={`w-full text-left truncate px-3 py-2 rounded-lg text-sm transition-colors pr-8 ${
                  chatId === chat.id
                    ? 'bg-indigo-100 text-indigo-800 font-medium'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                {chat.title}
              </button>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="absolute right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 flex items-center gap-3 px-4 bg-white shrink-0">
          <button
            onClick={() => navigate(backPath)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Môn học</span>
          </button>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800 truncate">
              {currentChat?.title ?? 'Chọn hoặc tạo chat mới'}
            </span>
          </div>
        </header>

        {/* Chat Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !chatId || !currentChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 bg-gray-50">
            <BookOpen className="w-14 h-14 text-indigo-100" />
            <p className="text-base font-semibold text-gray-600">Chọn một cuộc trò chuyện</p>
            <p className="text-sm text-gray-400">hoặc tạo mới từ thanh bên</p>
          </div>
        ) : (
          <ChatContainer
            chatId={chatId}
            initialMessages={messages}
            chatTitle={currentChat.title}
            subjectName={subject?.name}
          />
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SubjectChat;
