import { BaseLLMProvider } from './base';
import { ChatCompletionRequest, ChatCompletionResponse, StreamChunk } from './types';

export class OpenAICompatibleProvider extends BaseLLMProvider {
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: false,
        stop: request.stop,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Provider error ${res.status}: ${error}`);
    }

    return await res.json() as ChatCompletionResponse;
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk> {
    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: true,
        stop: request.stop,
      }),
    });

    if (!res.ok || !res.body) {
      const error = await res.text();
      throw new Error(`Provider error ${res.status}: ${error}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            yield JSON.parse(trimmed.slice(6)) as StreamChunk;
          } catch {
            // skip malformed chunks
          }
        }
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
