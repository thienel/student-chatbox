import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { MessageSource } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export interface StreamMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: MessageSource[];
  createdAt: string;
}

interface UseChatStreamReturn {
  sendMessage: (
    chatId: string,
    content: string,
    onChunk: (chunk: string) => void,
    onDone: (sources: MessageSource[], fullContent: string) => void,
    onError: (error: string) => void
  ) => Promise<void>;
  isStreaming: boolean;
  currentStreamContent: string;
}

export function useChatStream(): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');

  const sendMessage = useCallback(
    async (
      chatId: string,
      content: string,
      onChunk: (chunk: string) => void,
      onDone: (sources: MessageSource[], fullContent: string) => void,
      onError: (error: string) => void
    ) => {
      const token = useAuthStore.getState().accessToken;
      setIsStreaming(true);
      setCurrentStreamContent('');
      let fullContent = '';

      try {
        const response = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as {
            error?: { message?: string; code?: string };
          };
          const errorMessage =
            errorData?.error?.message ?? `HTTP ${response.status}`;
          onError(errorMessage);
          return;
        }

        if (!response.body) {
          onError('No response body');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data) as {
                  type: string;
                  content?: string;
                  sources?: MessageSource[];
                };
                if (parsed.type === 'chunk' && parsed.content) {
                  fullContent += parsed.content;
                  setCurrentStreamContent(fullContent);
                  onChunk(parsed.content);
                } else if (parsed.type === 'done') {
                  onDone(parsed.sources ?? [], fullContent);
                }
              } catch {
                // skip malformed events
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream error';
        onError(message);
      } finally {
        setIsStreaming(false);
        setCurrentStreamContent('');
      }
    },
    []
  );

  return { sendMessage, isStreaming, currentStreamContent };
}
