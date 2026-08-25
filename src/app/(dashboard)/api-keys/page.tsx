'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { authFetch } = useAuth();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    const res = await authFetch('/api/api-keys');
    const data = await res.json();
    setKeys(data.keys || []);
  }

  async function createKey() {
    setLoading(true);
    const res = await authFetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName || '默认密钥' }),
    });
    const data = await res.json();
    setCreatedKey(data.key);
    setNewKeyName('');
    setLoading(false);
    loadKeys();
  }

  async function revokeKey(id: string) {
    if (!confirm('确定要撤销此密钥？撤销后无法恢复。')) return;
    await authFetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    loadKeys();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">API 密钥</h1>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">创建新密钥</h2>
        <div className="flex gap-3">
          <input
            type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
            placeholder="密钥名称（可选）"
            className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-sm"
          />
          <button onClick={createKey} disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            创建
          </button>
        </div>
        {createdKey && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium mb-1">密钥创建成功！请立即复制，它只显示一次：</p>
            <code className="text-sm bg-white px-2 py-1 rounded border break-all">{createdKey}</code>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">密钥前缀</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">创建时间</th>
              <th className="text-left px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(key => (
              <tr key={key.id} className="border-t border-border">
                <td className="px-4 py-3">{key.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{key.keyPrefix}...</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${key.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {key.isActive ? '活跃' : '已撤销'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(key.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="px-4 py-3">
                  {key.isActive && (
                    <button onClick={() => revokeKey(key.id)} className="text-destructive text-xs hover:underline">
                      撤销
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无密钥，请创建一个</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
