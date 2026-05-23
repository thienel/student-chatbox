import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi } from '../../api/users.api';
import BackButton from '../../components/BackButton';
import { User as UserIcon, Lock, ShieldOff, ShieldCheck } from 'lucide-react';
import type { User } from '../../types';
import type { AxiosError } from 'axios';

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({ fullName: '', role: '' as User['role'] });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!id) return;
    usersApi
      .getById(id)
      .then((res) => {
        setUser(res.data.data);
        setEditForm({ fullName: res.data.data.fullName, role: res.data.data.role });
      })
      .catch(() => showToast('Không thể tải thông tin người dùng', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setSaving(true);
    try {
      const res = await usersApi.update(id, {
        fullName: editForm.fullName,
        role: editForm.role,
      });
      setUser(res.data.data);
      showToast('Cập nhật thành công', 'success');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      showToast(axiosErr.response?.data?.error?.message ?? 'Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id || !user) return;
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await usersApi.updateStatus(id, { status: newStatus });
      setUser(res.data.data);
      showToast(newStatus === 'active' ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản', 'success');
    } catch {
      showToast('Thao tác thất bại', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newPassword.trim()) return;
    try {
      await usersApi.resetPassword(id, { newPassword });
      showToast('Đặt lại mật khẩu thành công', 'success');
      setShowResetModal(false);
      setNewPassword('');
    } catch {
      showToast('Đặt lại mật khẩu thất bại', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Không tìm thấy người dùng
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-5 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center gap-4">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <UserIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-2xl mx-auto space-y-6">
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              user.status === 'active'
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {user.status === 'active' ? (
              <><ShieldOff className="w-4 h-4" /> Khóa tài khoản</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Kích hoạt tài khoản</>
            )}
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Đặt lại mật khẩu
          </button>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Thông tin tài khoản</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="student">Sinh viên</option>
                <option value="lecturer">Giảng viên</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
              <p className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      </main>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Đặt lại mật khẩu</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  placeholder="NewPassword@123"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AdminUserDetail;
