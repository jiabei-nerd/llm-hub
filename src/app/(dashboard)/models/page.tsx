'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface ModelInfo {
  id: string;
  modelId: string;
  displayName: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number;
  contextWindow: number;
  category: string;
  provider: { displayName: string; name: string };
}

const MODEL_DESCRIPTIONS: Record<string, { desc: string; abilities: string[] }> = {
  'deepseek-chat': {
    desc: 'DeepSeek 最新通用对话模型，性价比极高，支持 64K 上下文。',
    abilities: ['通用对话', '代码生成', '文本创作', '逻辑推理', '知识问答'],
  },
  'deepseek-reasoner': {
    desc: 'DeepSeek 推理增强模型，擅长复杂逻辑、数学和编程任务。',
    abilities: ['深度推理', '数学解题', '代码调试', '逻辑分析', '学术写作'],
  },
  'qwen-turbo': {
    desc: '通义千问轻量版，速度快、成本低，适合简单任务和高并发场景。',
    abilities: ['快速对话', '文本摘要', '信息提取', '简单问答'],
  },
  'qwen-plus': {
    desc: '通义千问增强版，平衡性能与成本，支持 128K 超长上下文。',
    abilities: ['长文档理解', '代码生成', '创意写作', '多轮对话', '数据分析'],
  },
  'qwen-max': {
    desc: '通义千问旗舰版，阿里最强模型，适合复杂任务。',
    abilities: ['复杂推理', '专业写作', '代码架构', '深度分析', '创意生成'],
  },
  'glm-4-flash': {
    desc: '智谱 GLM-4 轻量版，免费额度多，适合轻量级应用。',
    abilities: ['基础对话', '文本处理', '知识问答', '翻译'],
  },
  'glm-4-plus': {
    desc: '智谱 GLM-4 增强版，中文理解能力强，支持 128K 上下文。',
    abilities: ['中文理解', '长文档分析', '创意写作', '代码生成', '逻辑推理'],
  },
  'moonshot-v1-8k': {
    desc: 'Kimi 8K 版本，月之暗面出品，擅长中文对话和内容创作。',
    abilities: ['中文对话', '内容创作', '知识问答', '文本改写'],
  },
  'moonshot-v1-32k': {
    desc: 'Kimi 32K 版本，支持长文档处理，适合论文和报告分析。',
    abilities: ['长文档理解', '论文分析', '内容总结', '创意写作', '翻译'],
  },
  'ernie-speed': {
    desc: '百度文心一言 Speed 版，高速响应，支持 128K 上下文。',
    abilities: ['快速对话', '文本生成', '信息抽取', '基础问答'],
  },
  'ernie-4.0': {
    desc: '百度文心一言 4.0 旗舰版，百度最强模型。',
    abilities: ['复杂推理', '专业创作', '代码生成', '多模态理解', '深度分析'],
  },
  'qwen-vl-plus': {
    desc: '通义千问视觉语言模型，能看懂图片并进行分析。',
    abilities: ['图片理解', '图文对话', 'OCR识别', '图表分析', '视觉问答'],
  },
};

function formatContext(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(0)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return `${tokens}`;
}

export default function ModelsPage() {
  const { authFetch } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    authFetch('/api/models').then(async res => {
      const data = await res.json();
      setModels(data.models || []);
    });
  }, [authFetch]);

  const categories = ['all', ...Array.from(new Set(models.map(m => m.category)))];
  const filtered = selectedCategory === 'all' ? models : models.filter(m => m.category === selectedCategory);

  const grouped = filtered.reduce((acc, m) => {
    const provider = m.provider.displayName;
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(m);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">模型广场</h1>
      <p className="text-muted-foreground text-sm mb-6">浏览所有可用模型，了解能力和定价</p>

      <div className="flex gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-sm ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'all' ? '全部' : cat === 'chat' ? '对话' : cat === 'vision' ? '视觉' : cat}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([provider, providerModels]) => (
        <div key={provider} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{provider}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providerModels.map(model => {
              const info = MODEL_DESCRIPTIONS[model.modelId];
              return (
                <div key={model.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{model.displayName}</h3>
                      <code className="text-xs text-muted-foreground">{model.modelId}</code>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      model.category === 'vision' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {model.category === 'vision' ? '视觉' : '对话'}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {info?.desc || '通用大语言模型'}
                  </p>

                  {info?.abilities && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {info.abilities.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-3 mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">输入</div>
                      <div className="text-sm font-mono font-medium">¥{model.inputPrice}/1K</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">输出</div>
                      <div className="text-sm font-mono font-medium">¥{model.outputPrice}/1K</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">上下文</div>
                      <div className="text-sm font-mono font-medium">{formatContext(model.contextWindow)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {models.length === 0 && (
        <div className="text-center text-muted-foreground py-20">暂无可用模型</div>
      )}
    </div>
  );
}
