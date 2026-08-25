'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface ProviderInfo {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  healthStatus: string;
  _count: { models: number };
}

export default function AdminProvidersPage() {
  const { authFetch } = useAuth();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', baseUrl: '', apiKey: '' });

  useEffect(() => { loadProviders(); }, []);

  async function loadProviders() {
    const res = await authFetch('/api/admin/providers');
    if (res.ok) {
      const data = await res.json();
      setProviders(data.providers || []);
    }
  }

  async function addProvider() {
    await authFetch('/api/admin/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: '', displayName: '', baseUrl: '', apiKey: '' });
    loadProviders();
  }

  async function toggleProvider(id: string, isActive: boolean) {
    await authFetch('/api/admin/providers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    loadProviders();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">供应商管理</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          {showForm ? '取消' : '添加供应商'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="标识名（如 deepseek）" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <input placeholder="显示名（如 DeepSeek）" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <input placeholder="Base URL" value={form.baseUrl} onChange={e => setForm({...form, baseUrl: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
            <input placeholder="API Key" type="password" value={form.apiKey} onChange={e => setForm({...form, apiKey: e.target.value})}
              className="px-3 py-2 border border-input rounded-lg text-sm" />
          </div>
          <button onClick={addProvider} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">保存</button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">供应商</th>
              <th className="text-left px-4 py-3 font-medium">Base URL</th>
              <th className="text-right px-4 py-3 font-medium">模型数</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(p => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{p.displayName}<span className="text-muted-foreground ml-1 text-xs">({p.name})</span></td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground max-w-[200px] truncate">{p.baseUrl}</td>
                <td className="px-4 py-3 text-right">{p._count.models}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleProvider(p.id, p.isActive)} className="text-xs text-primary hover:underline">
                    {p.isActive ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无供应商，请添加</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
