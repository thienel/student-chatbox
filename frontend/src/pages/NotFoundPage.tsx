import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700">
      <h1 className="text-6xl font-black text-indigo-600 mb-4">404</h1>
      <p className="text-xl font-semibold mb-2">Trang không tồn tại</p>
      <p className="text-gray-500 mb-8 text-sm">Đường dẫn bạn truy cập không được tìm thấy.</p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Quay lại
      </button>
    </div>
  );
};

export default NotFoundPage;
