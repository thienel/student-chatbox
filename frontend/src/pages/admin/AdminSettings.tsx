import { useEffect, useState } from 'react';
import { systemApi } from '../../api/chat.api';
import { Settings, Save } from 'lucide-react';

const SETTING_LABELS: Record<string, string> = {
  'ai_daily_limit.student.chat_rag': 'Giới hạn chat RAG/ngày — Sinh viên',
  'ai_daily_limit.lecturer.chat_rag': 'Giới hạn chat RAG/ngày — Giảng viên',
  'ai_daily_limit.admin.chat_rag': 'Giới hạn chat RAG/ngày — Admin (-1 = không giới hạn)',
  'rag.top_k': 'RAG Top-K (số chunks lấy từ Qdrant)',
  'rag.min_score': 'RAG Min Score (ngưỡng điểm tương đồng tối thiểu)',
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    systemApi
      .getSettings()
      .then((res) => setSettings(res.data.data ?? {}))
      .catch(() => showToast('Không thể tải cài đặt', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await systemApi.updateSettings(settings);
      showToast('Đã lưu cài đặt', 'success');
    } catch {
      showToast('Lưu cài đặt thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const settingKeys = Object.keys(SETTING_LABELS);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-gray-500 mt-1">Cấu hình giới hạn AI và thông số RAG</p>
      </header>

      <main className="p-8 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-gray-900 mb-2">Thông số cấu hình</h2>

            {settingKeys.map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {SETTING_LABELS[key] ?? key}
                </label>
                <input
                  type="text"
                  value={String(settings[key] ?? '')}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            ))}

            {/* Show any extra settings returned from server */}
            {Object.keys(settings)
              .filter((k) => !settingKeys.includes(k))
              .map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                  <input
                    type="text"
                    value={String(settings[key] ?? '')}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </form>
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

export default AdminSettings;
