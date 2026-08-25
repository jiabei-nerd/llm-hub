import { BaseLLMProvider } from './base';
import { OpenAICompatibleProvider } from './openai-compatible';
import { ProviderConfig } from './types';
import { prisma } from '@/lib/prisma';

class QwenProvider extends OpenAICompatibleProvider {}
class ZhipuProvider extends OpenAICompatibleProvider {}
class WenxinProvider extends OpenAICompatibleProvider {}
class DeepSeekProvider extends OpenAICompatibleProvider {}
class MoonshotProvider extends OpenAICompatibleProvider {}

const constructors: Record<string, new (config: ProviderConfig) => BaseLLMProvider> = {
  qwen: QwenProvider,
  zhipu: ZhipuProvider,
  wenxin: WenxinProvider,
  deepseek: DeepSeekProvider,
  moonshot: MoonshotProvider,
};

const cache = new Map<string, BaseLLMProvider>();

export async function getProviderForModel(modelId: string) {
  const model = await prisma.model.findUnique({
    where: { modelId, isActive: true },
    include: { provider: true },
  });

  if (!model || !model.provider.isActive) {
    throw new Error(`模型 ${modelId} 不可用`);
  }

  let provider = cache.get(model.provider.id);
  if (!provider) {
    const Ctor = constructors[model.provider.name];
    if (!Ctor) throw new Error(`未知供应商: ${model.provider.name}`);
    provider = new Ctor({ baseUrl: model.provider.baseUrl, apiKey: model.provider.apiKey });
    cache.set(model.provider.id, provider);
  }

  return { provider, model };
}

export function invalidateProviderCache(providerId?: string) {
  if (providerId) cache.delete(providerId);
  else cache.clear();
}
