'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface ModelInfo {
  id: string;
  modelId: string;
  displayName: string;
  upstreamModelId: string;
  inputPrice: number;
  outputPrice: number;
  isActive: boolean;
  provider: { displayName: string };
}

interface ProviderOption {
  id: string;
  displayName: string;
}

export default function AdminModelsPage() {
  const { authFetch } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    modelId: '', displayName: '', providerId: '', upstreamModelId: '',
    inputPrice: '0.001', outputPrice: '0.002', maxTokens: '4096', contextWindow: '8192',
  });

  useEffect(() => {
    loadModels();
    authFetch('/api/admin/providers').then(async res => {
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    });
  }, []);

  async function loadModels() {
    const res = await authFetch('/api/admin/models');
    if (res.ok) setModels((await res.json()).models || []);
  }

  async function addModel() {
    await authFetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        inputPrice: parseFloat(form.inputPrice),
        outputPrice: parseFloat(form.outputPrice),
        maxTokens: parseInt(form.maxTokens),
        contextWindow: parseInt(form.contextWindow),
      }),
    });
    setShowForm(false);
    loadModels();
  }

  async function toggleModel(id: string, isActive: boolean) {
    await authFetch('/api/admin/models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    loadModels();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">模型管理</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          {showForm ? '取消' : '添加模型'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="模型ID（如 deepseek-chat）" value={form.modelId} onChange={e => setForm({...form, modelId: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <input placeholder="显示名称" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <select value={form.providerId} onChange={e => setForm({...form, providerId: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm">
              <option value="">选择供应商</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <input placeholder="上游模型ID" value={form.upstreamModelId} onChange={e => setForm({...form, upstreamModelId: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <input placeholder="输入价格(CNY/1K tokens)" value={form.inputPrice} onChange={e => setForm({...form, inputPrice: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <input placeholder="输出价格(CNY/1K tokens)" value={form.outputPrice} onChange={e => setForm({...form, outputPrice: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
          </div>
          <button onClick={addModel} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">保存</button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">模型ID</th>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">供应商</th>
              <th className="text-right px-4 py-3 font-medium">输入价</th>
              <th className="text-right px-4 py-3 font-medium">输出价</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{m.modelId}</td>
                <td className="px-4 py-3">{m.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.provider.displayName}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">¥{m.inputPrice}/1K</td>
                <td className="px-4 py-3 text-right font-mono text-xs">¥{m.outputPrice}/1K</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {m.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleModel(m.id, m.isActive)} className="text-xs text-primary hover:underline">
                    {m.isActive ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">暂无模型，请添加</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
