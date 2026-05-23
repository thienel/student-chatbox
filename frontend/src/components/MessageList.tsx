import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { Message, MessageSource } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  streamingContent?: string;
  isStreaming?: boolean;
}

const SourceCitation = ({ sources }: { sources: MessageSource[] }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 text-xs border border-indigo-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
      >
        <span>Nguồn tham khảo ({sources.length})</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="divide-y divide-indigo-50">
          {sources.map((src, idx) => (
            <div key={idx} className="px-3 py-2 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-indigo-800">{src.originalName}</span>
                <span className="text-gray-400">Score: {(src.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-gray-600 line-clamp-2 italic">"{src.excerpt}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageList = ({ messages, isLoading, streamingContent, isStreaming }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Đang tải tin nhắn...
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
        <Bot className="w-12 h-12 text-indigo-200" />
        <p className="text-base font-medium text-gray-500">Bắt đầu cuộc trò chuyện</p>
        <p className="text-xs">Hỏi bất kỳ điều gì về nội dung môn học</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
          >
            {msg.role === 'user' ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      ),
                      code: ({ className, children, ...props }) => {
                        const isBlock = !!(className ?? '').match(/language-/);
                        return isBlock ? (
                          <pre className="p-3 bg-gray-900 text-gray-50 rounded-lg my-2 overflow-x-auto text-xs">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                        ) : (
                          <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div className="w-full mt-1">
                <SourceCitation sources={msg.sources} />
              </div>
            )}
            <span className="text-xs text-gray-400 mt-1">
              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}

      {/* Streaming message */}
      {isStreaming && streamingContent !== undefined && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col max-w-[85%] items-start">
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-gray-200 text-gray-800 shadow-sm text-sm leading-relaxed">
              {streamingContent ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
