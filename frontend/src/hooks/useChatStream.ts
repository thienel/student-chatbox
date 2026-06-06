import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { MessageSource } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

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
      let finalSources: MessageSource[] = [];

      try {
        // NestJS streams the AI response directly — single round trip
        const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({})) as { error?: { message?: string } };
          onError(errorData?.error?.message ?? `HTTP ${res.status}`);
          return;
        }

        if (!res.body) {
          onError('No response body from server');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as {
                type: string;
                content?: string;
                sources?: MessageSource[];
                message?: string;
              };
              if (parsed.type === 'chunk' && parsed.content) {
                fullContent += parsed.content;
                setCurrentStreamContent(fullContent);
                onChunk(parsed.content);
              } else if (parsed.type === 'done' && parsed.sources) {
                finalSources = parsed.sources;
              } else if (parsed.type === 'error') {
                onError(parsed.message ?? 'AI service error');
                return;
              }
            } catch {
              // skip malformed events
            }
          }
        }

        onDone(finalSources, fullContent);
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
