import { ChatCompletionRequest, ChatCompletionResponse, StreamChunk, ProviderConfig } from './types';

export abstract class BaseLLMProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<StreamChunk, void, unknown>;
  abstract healthCheck(): Promise<boolean>;
}
