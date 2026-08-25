'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-primary">LLM Hub</div>
        <div className="flex gap-3">
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
              控制台
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-primary">
                登录
              </Link>
              <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                免费注册
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          国产大模型<span className="text-primary">统一API</span>平台
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          一个API密钥，接入通义千问、智谱GLM、百度文心、DeepSeek、Kimi等主流大模型。
          兼容OpenAI格式，无缝切换。
        </p>
        <div className="flex gap-4 justify-center mb-20">
          <Link href="/register" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-lg hover:opacity-90">
            立即开始
          </Link>
          <Link href="/playground" className="px-8 py-3 border border-border rounded-lg font-medium text-lg hover:bg-accent">
            在线体验
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-primary text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">OpenAI 兼容</h3>
            <p className="text-muted-foreground text-sm">
              完全兼容 OpenAI API 格式，现有代码改一行 base_url 即可迁移，支持流式输出。
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-primary text-xl">🔗</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">多模型聚合</h3>
            <p className="text-muted-foreground text-sm">
              通义千问、智谱GLM、文心一言、DeepSeek、Kimi 一站式接入，统一计费管理。
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-primary text-xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">安全合规</h3>
            <p className="text-muted-foreground text-sm">
              全部接入国内已备案大模型，合规无忧。API密钥加密存储，用量实时监控。
            </p>
          </div>
        </div>

        <div className="mt-20 p-8 rounded-xl bg-card border border-border text-left">
          <h3 className="text-lg font-semibold mb-4">快速开始</h3>
          <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`from openai import OpenAI

client = OpenAI(
    api_key="sk-lh-你的密钥",
    base_url="http://your-domain.com/api/v1"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好！"}]
)

print(response.choices[0].message.content)`}
          </pre>
        </div>
      </main>
    </div>
  );
}
