import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { documentsApi } from '../../api/documents.api';
import { subjectsApi } from '../../api/subjects.api';
import BackButton from '../../components/BackButton';
import { Upload, Trash2, FileText, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { Document, Subject } from '../../types';
import type { AxiosError } from 'axios';

const StatusBadge = ({ status }: { status: Document['status'] }) => {
  const config = {
    processing: { icon: Clock, label: 'Đang xử lý', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    ready: { icon: CheckCircle, label: 'Sẵn sàng', cls: 'bg-green-50 text-green-700 border-green-200' },
    failed: { icon: AlertCircle, label: 'Lỗi', cls: 'bg-red-50 text-red-700 border-red-200' },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.cls}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LecturerDocuments = () => {
  const { id: subjectId } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDocuments = async () => {
    if (!subjectId) return;
    try {
      const res = await documentsApi.list(subjectId);
      const items = res.data.data.items ?? [];
      setDocuments(items);
      return items;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!subjectId) return;

    const init = async () => {
      try {
        const [subRes] = await Promise.all([
          subjectsApi.getById(subjectId),
          fetchDocuments(),
        ]);
        setSubject(subRes.data.data);
      } catch {
        showToast('Không thể tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [subjectId]);

  // Poll while any document is processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (hasProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        const items = await fetchDocuments();
        if (Array.isArray(items) && !items.some((d) => d.status === 'processing')) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }, 3000);
    } else if (!hasProcessing && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [documents]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subjectId) return;

    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!allowed.includes(file.type)) {
      showToast('Chỉ chấp nhận file PDF, DOCX, PPTX', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('File không được vượt quá 50MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const res = await documentsApi.upload(subjectId, file);
      setDocuments((prev) => [res.data.data, ...prev]);
      showToast('Upload thành công, đang xử lý...', 'success');
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      showToast(axiosErr.response?.data?.error?.message ?? 'Upload thất bại', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Xóa tài liệu "${docName}"?`)) return;
    if (!subjectId) return;
    try {
      await documentsApi.delete(subjectId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      showToast('Đã xóa tài liệu', 'success');
    } catch {
      showToast('Không thể xóa tài liệu', 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-5 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center gap-4">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tài liệu — {subject?.name}</h1>
            <p className="text-xs text-gray-400">{subject?.code}</p>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-4xl mx-auto">
        {/* Upload Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-700">
            {documents.length} tài liệu
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDocuments()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Đang upload...' : 'Upload tài liệu'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Chưa có tài liệu nào</p>
            <p className="text-gray-400 text-xs mt-1">Upload PDF, DOCX hoặc PPTX để bắt đầu</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tên file</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Kích thước</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Chunks</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Trạng thái</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Ngày upload</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-800 max-w-xs truncate">{doc.originalName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatBytes(doc.fileSizeBytes)}</td>
                      <td className="px-5 py-3 text-gray-500">{doc.chunkCount}</td>
                      <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDelete(doc.id, doc.originalName)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

export default LecturerDocuments;
