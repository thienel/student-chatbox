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
    <div className="mt-2 text-xs border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
      >
        <span>Nguồn tham khảo ({sources.length})</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="divide-y divide-border">
          {sources.map((src, idx) => (
            <div key={idx} className="px-3 py-2 bg-card">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">{src.originalName}</span>
                <span className="text-muted-foreground">Score: {(src.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-muted-foreground line-clamp-2 italic">"{src.excerpt}"</p>
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
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Đang tải tin nhắn...
        </div>
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-3">
        <Bot className="w-12 h-12 opacity-30" />
        <p className="text-base font-medium text-muted-foreground">Bắt đầu cuộc trò chuyện</p>
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
              msg.role === 'user' ? 'bg-secondary' : 'bg-muted'
            }`}
          >
            {msg.role === 'user' ? (
              <User className="w-4 h-4 text-secondary-foreground" />
            ) : (
              <Bot className="w-4 h-4 text-foreground" />
            )}
          </div>
          <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-secondary text-secondary-foreground rounded-tr-sm'
                  : 'bg-card border text-foreground rounded-tl-sm'
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
                        <a href={href} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                          {children}
                        </a>
                      ),
                      code: ({ className, children, ...props }) => {
                        const isBlock = !!(className ?? '').match(/language-/);
                        return isBlock ? (
                          <pre className="p-3 bg-muted text-muted-foreground rounded-lg my-2 overflow-x-auto text-xs">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                        ) : (
                          <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
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
            <span className="text-xs text-muted-foreground mt-1">
              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}

      {/* Streaming message */}
      {isStreaming && streamingContent !== undefined && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4 text-foreground" />
          </div>
          <div className="flex flex-col max-w-[85%] items-start">
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border synapse-glow text-foreground shadow-sm text-sm leading-relaxed">
              {streamingContent ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
