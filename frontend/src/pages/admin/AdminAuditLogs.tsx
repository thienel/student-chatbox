import { useEffect, useState } from 'react';
import { systemApi } from '../../api/chat.api';
import { Activity, Search } from 'lucide-react';
import type { AuditLog } from '../../types';

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'Đăng nhập',
  USER_LOGIN_FAILED: 'Đăng nhập thất bại',
  USER_CREATED: 'Tạo tài khoản',
  USER_SUSPENDED: 'Khóa tài khoản',
  USER_ACTIVATED: 'Mở khóa tài khoản',
  DOCUMENT_UPLOADED: 'Upload tài liệu',
  DOCUMENT_DELETED: 'Xóa tài liệu',
  SUBJECT_CREATED: 'Tạo môn học',
  LECTURER_ASSIGNED: 'Phân công giảng viên',
  SETTINGS_UPDATED: 'Cập nhật cài đặt',
  AI_RATE_LIMIT_HIT: 'Vượt giới hạn AI',
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await systemApi.getAuditLogs({
        action: actionFilter || undefined,
        page,
        limit,
      });
      const data = res.data as { data?: { items?: AuditLog[]; total?: number } };
      setLogs(data?.data?.items ?? []);
      setTotal(data?.data?.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-600" />
          Audit Log
        </h1>
        <p className="text-sm text-gray-500 mt-1">Nhật ký hoạt động hệ thống</p>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-white"
            >
              <option value="">Tất cả hành động</option>
              {Object.keys(ACTION_LABELS).map((action) => (
                <option key={action} value={action}>{ACTION_LABELS[action]}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Thời gian</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Hành động</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Người dùng</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-800">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-gray-800">{log.userFullName ?? '—'}</p>
                          <p className="text-xs text-gray-400">{log.userEmail ?? ''}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{log.ipAddress ?? '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-gray-400">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-500">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAuditLogs;
