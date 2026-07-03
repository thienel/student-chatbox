import { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

const MessageInput = ({ onSend, isDisabled = false, placeholder = 'Nhập câu hỏi... (Enter để gửi)' }: MessageInputProps) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={isDisabled}
          className="flex-1 resize-none border border-border bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={isDisabled || !value.trim()}
          className="p-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          title="Gửi tin nhắn"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
