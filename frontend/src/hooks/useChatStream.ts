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
      let finalSources: MessageSource[] = [];

      try {
        // Step 1: Save user message and receive stream token from NestJS
        const prepareRes = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content }),
        });

        if (!prepareRes.ok) {
          const errorData = await prepareRes.json().catch(() => ({})) as {
            error?: { message?: string };
          };
          onError(errorData?.error?.message ?? `HTTP ${prepareRes.status}`);
          return;
        }

        const { streamToken, streamUrl, streamPayload } = await prepareRes.json() as {
          streamToken: string;
          streamUrl: string;
          streamPayload: object;
        };

        // Step 2: Open SSE stream directly to Python AI service
        const streamRes = await fetch(`${streamUrl}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${streamToken}`,
          },
          body: JSON.stringify(streamPayload),
        });

        if (!streamRes.ok) {
          const errorData = await streamRes.json().catch(() => ({})) as { detail?: string };
          onError(errorData?.detail ?? `AI service error: ${streamRes.status}`);
          return;
        }

        if (!streamRes.body) {
          onError('No response body from AI service');
          return;
        }

        const reader = streamRes.body.getReader();
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
              };
              if (parsed.type === 'chunk' && parsed.content) {
                fullContent += parsed.content;
                setCurrentStreamContent(fullContent);
                onChunk(parsed.content);
              } else if (parsed.type === 'done' && parsed.sources) {
                finalSources = parsed.sources;
              }
            } catch {
              // skip malformed events
            }
          }
        }

        // Step 3: Persist assistant message to NestJS (fire-and-forget is fine here)
        fetch(`${BASE_URL}/chats/${chatId}/messages/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: fullContent, sources: finalSources }),
        }).catch(() => {
          // non-critical: message already shown to user
        });

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
