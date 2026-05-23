import { useState, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChatStream } from '../hooks/useChatStream';
import type { Message, MessageSource } from '../types';

interface ChatContainerProps {
  chatId: string;
  initialMessages: Message[];
  chatTitle?: string;
  subjectName?: string;
}

const ChatContainer = ({ chatId, initialMessages, chatTitle, subjectName }: ChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage, isStreaming, currentStreamContent } = useChatStream();

  const handleSend = useCallback(
    async (content: string) => {
      setError(null);

      // Optimistically add user message
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      await sendMessage(
        chatId,
        content,
        (_chunk) => {
          // chunks are accumulated in currentStreamContent via the hook
        },
        (sources: MessageSource[], fullContent: string) => {
          // Replace streaming with finalized assistant message
          const assistantMsg: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            sources,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        (errMsg: string) => {
          setError(errMsg);
          // Remove optimistic user message on error
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        }
      );
    },
    [chatId, sendMessage]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-800 truncate">{chatTitle ?? 'Cuộc trò chuyện'}</h2>
        {subjectName && <p className="text-xs text-gray-400">{subjectName}</p>}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        streamingContent={currentStreamContent}
        isStreaming={isStreaming}
      />

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        isDisabled={isStreaming}
        placeholder={subjectName ? `Hỏi về ${subjectName}...` : 'Nhập câu hỏi...'}
      />
    </div>
  );
};

export default ChatContainer;
