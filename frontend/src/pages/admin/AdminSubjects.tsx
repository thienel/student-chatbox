import { useEffect, useState } from 'react';
import { subjectsApi } from '../../api/subjects.api';
import { usersApi } from '../../api/users.api';
import { BookOpen, Plus, Edit2, Trash2, UserPlus, X } from 'lucide-react';
import type { Subject, User } from '../../types';
import type { AxiosError } from 'axios';

interface SubjectForm {
  code: string;
  name: string;
  description: string;
}

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<SubjectForm>({ code: '', name: '', description: '' });
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [subjectsRes, usersRes] = await Promise.all([
        subjectsApi.list(),
        usersApi.list({ role: 'lecturer', limit: 200 }),
      ]);
      setSubjects(subjectsRes.data.data.items ?? []);
      setLecturers(usersRes.data.data.items ?? []);
    } catch {
      showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await subjectsApi.create(subjectForm);
      showToast('Tạo môn học thành công', 'success');
      setShowCreateModal(false);
      setSubjectForm({ code: '', name: '', description: '' });
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      showToast(axiosErr.response?.data?.error?.message ?? 'Tạo môn học thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setSaving(true);
    try {
      await subjectsApi.update(selectedSubject.id, {
        name: subjectForm.name,
        description: subjectForm.description,
      });
      showToast('Cập nhật môn học thành công', 'success');
      setShowEditModal(false);
      fetchData();
    } catch {
      showToast('Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Xóa môn học "${subject.name}"?`)) return;
    try {
      await subjectsApi.delete(subject.id);
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      showToast('Đã xóa môn học', 'success');
    } catch {
      showToast('Không thể xóa môn học', 'error');
    }
  };

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedLecturerId) return;
    try {
      await subjectsApi.assignLecturer(selectedSubject.id, { lecturerId: selectedLecturerId });
      showToast('Đã phân công giảng viên', 'success');
      setShowAssignModal(false);
      fetchData();
    } catch {
      showToast('Phân công thất bại', 'error');
    }
  };

  const handleRemoveLecturer = async (subjectId: string, lecturerId: string) => {
    try {
      await subjectsApi.removeLecturer(subjectId, lecturerId);
      showToast('Đã gỡ giảng viên', 'success');
      fetchData();
    } catch {
      showToast('Gỡ giảng viên thất bại', 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý môn học</h1>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} môn học</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo môn học
        </button>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p>Chưa có môn học nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Môn học</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Giảng viên</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{subject.name}</p>
                          <p className="text-xs text-indigo-600 font-medium">{subject.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {subject.lecturers?.map((l) => (
                          <div key={l.id} className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-xs text-emerald-700">
                            {l.fullName}
                            <button
                              onClick={() => handleRemoveLecturer(subject.id, l.id)}
                              className="text-emerald-400 hover:text-red-500 ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setSelectedSubject(subject);
                            setSelectedLecturerId('');
                            setShowAssignModal(true);
                          }}
                          className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full text-xs text-gray-500 hover:text-purple-600 hover:border-purple-200 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" /> Thêm GV
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          subject.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {subject.status === 'active' ? 'Đang hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubject(subject);
                            setSubjectForm({ code: subject.code, name: subject.name, description: subject.description ?? '' });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Tạo môn học mới</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn *</label>
                <input
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  placeholder="SWD392"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
                <input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Software Design"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                  placeholder="Mô tả môn học..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {saving ? 'Đang tạo...' : 'Tạo môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Chỉnh sửa môn học</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
                <input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Lecturer Modal */}
      {showAssignModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Phân công giảng viên — {selectedSubject.name}
            </h2>
            <form onSubmit={handleAssignLecturer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn giảng viên</label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => setSelectedLecturerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Chọn giảng viên --</option>
                  {lecturers
                    .filter((l) => !selectedSubject.lecturers?.find((sl) => sl.id === l.id))
                    .map((l) => (
                      <option key={l.id} value={l.id}>{l.fullName} ({l.email})</option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Phân công</button>
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

export default AdminSubjects;
