import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg shadow-sm hover:bg-secondary hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Quay lại
    </button>
  );
};

export default BackButton;
