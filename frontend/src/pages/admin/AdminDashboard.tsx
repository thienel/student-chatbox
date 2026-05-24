import { useEffect, useState } from 'react';
import { Users, BookOpen, FileText, BarChart3 } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { subjectsApi } from '../../api/subjects.api';

interface Stats {
  totalUsers: number;
  admins: number;
  lecturers: number;
  students: number;
  totalSubjects: number;
  totalDocuments: number;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm`}>
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-3xl font-black text-gray-900">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    admins: 0,
    lecturers: 0,
    students: 0,
    totalSubjects: 0,
    totalDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, subjectsRes] = await Promise.all([
          usersApi.list({ limit: 1000 }),
          subjectsApi.list(),
        ]);
        const users = usersRes.data.data.items ?? [];
        setStats({
          totalUsers: usersRes.data.data.total,
          admins: users.filter((u) => u.role === 'admin').length,
          lecturers: users.filter((u) => u.role === 'lecturer').length,
          students: users.filter((u) => u.role === 'student').length,
          totalSubjects: subjectsRes.data.data.total,
          totalDocuments: 0,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
        <p className="text-sm text-gray-500 mt-1">EduChat Admin Dashboard</p>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Thống kê
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard icon={Users} label="Tổng users" value={stats.totalUsers} color="bg-purple-100 text-purple-600" />
              <StatCard icon={Users} label="Admin" value={stats.admins} color="bg-purple-50 text-purple-500" />
              <StatCard icon={Users} label="Giảng viên" value={stats.lecturers} color="bg-emerald-100 text-emerald-600" />
              <StatCard icon={Users} label="Sinh viên" value={stats.students} color="bg-indigo-100 text-indigo-600" />
              <StatCard icon={BookOpen} label="Môn học" value={stats.totalSubjects} color="bg-blue-100 text-blue-600" />
              <StatCard icon={FileText} label="Tài liệu" value={stats.totalDocuments} color="bg-orange-100 text-orange-600" />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
