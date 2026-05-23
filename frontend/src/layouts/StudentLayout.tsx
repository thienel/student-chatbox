import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth.api';
import {
  Home,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

const StudentLayout = () => {
  const { user, clearAuth, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login');
    showToast('Đã đăng xuất', 'success');
  };

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/student/dashboard' },
    { icon: BookOpen, label: 'Môn học', path: '/student/subjects' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } relative shrink-0`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 text-gray-500 rounded-full p-1 shadow-sm hover:text-indigo-600 z-10"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo / User */}
        <div className={`p-5 border-b border-gray-200 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mb-2 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <>
              <h2 className="font-bold text-gray-900 text-sm leading-tight truncate">{user?.fullName}</h2>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Sinh viên
              </span>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-gray-400 px-3 py-1 uppercase tracking-wider">Menu</p>
          )}
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : ''}
                className={`w-full flex items-center p-3 rounded-xl transition-colors ${
                  active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title="Đăng xuất"
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm w-full p-4 rounded-xl shadow-lg border z-50 flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => setToast({ ...toast, show: false })} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;
