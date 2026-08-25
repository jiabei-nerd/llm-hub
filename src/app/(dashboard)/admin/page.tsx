'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

// ============ Types ============

interface Stats { totalUsers: number; totalRequests: number; todayRequests: number; totalRevenue: number }
interface UserInfo { id: string; email: string; name: string | null; role: string; balance: number; isActive: boolean; createdAt: string }
interface ProviderInfo { id: string; name: string; displayName: string; baseUrl: string; apiKey: string; isActive: boolean; _count: { models: number } }
interface ModelInfo { id: string; modelId: string; displayName: string; upstreamModelId: string; inputPrice: number; outputPrice: number; isActive: boolean; provider: { displayName: string } }
interface UsageItem { id: string; inputTokens: number; outputTokens: number; totalCost: number; latencyMs: number | null; createdAt: string; model: { modelId: string; displayName: string }; user?: { email: string } }
interface ProviderOption { id: string; displayName: string }

type Tab = 'overview' | 'activity' | 'users' | 'providers' | 'models';

// ============ Main Page ============

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: '概览' },
    { key: 'activity', label: '实时活动' },
    { key: 'users', label: '用户管理' },
    { key: 'providers', label: '供应商' },
    { key: 'models', label: '模型管理' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台</h1>
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'activity' && <ActivityTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'providers' && <ProvidersTab />}
      {tab === 'models' && <ModelsTab />}
    </div>
  );
}

// ============ Overview Tab ============

function OverviewTab() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalRequests: 0, todayRequests: 0, totalRevenue: 0 });

  useEffect(() => {
    authFetch('/api/admin/stats').then(async res => {
      if (res.ok) setStats(await res.json());
    });
  }, [authFetch]);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="总用户数" value={`${stats.totalUsers}`} />
      <StatCard label="今日请求" value={`${stats.todayRequests}`} />
      <StatCard label="总请求" value={`${stats.totalRequests}`} />
      <StatCard label="总充值" value={`¥${stats.totalRevenue.toFixed(2)}`} />
    </div>
  );
}

// ============ Activity Tab (Real-time) ============

function ActivityTab() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState<UsageItem[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = useCallback(async () => {
    const res = await authFetch('/api/admin/activity');
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
    }
  }, [authFetch]);

  useEffect(() => {
    loadLogs();
    if (!autoRefresh) return;
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, [loadLogs, autoRefresh]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">最近 50 条请求{autoRefresh ? '（每5秒刷新）' : ''}</p>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-3 py-1 rounded text-xs font-medium ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}
        >
          {autoRefresh ? '自动刷新中' : '已暂停'}
        </button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">时间</th>
              <th className="text-left px-4 py-3 font-medium">用户</th>
              <th className="text-left px-4 py-3 font-medium">模型</th>
              <th className="text-right px-4 py-3 font-medium">Token</th>
              <th className="text-right px-4 py-3 font-medium">费用</th>
              <th className="text-right px-4 py-3 font-medium">延迟</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString('zh-CN')}</td>
                <td className="px-4 py-2 text-xs">{log.user?.email || '-'}</td>
                <td className="px-4 py-2 text-xs font-medium">{log.model?.displayName || '-'}</td>
                <td className="px-4 py-2 text-right text-xs font-mono">{log.inputTokens + log.outputTokens}</td>
                <td className="px-4 py-2 text-right text-xs font-mono">¥{log.totalCost.toFixed(4)}</td>
                <td className="px-4 py-2 text-right text-xs text-muted-foreground">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无请求记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Users Tab ============

function UsersTab() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await authFetch('/api/admin/users');
    if (res.ok) setUsers((await res.json()).users || []);
  }

  async function topUp(userId: string) {
    const amount = prompt('充值金额（元）：');
    if (!amount || isNaN(Number(amount))) return;
    await authFetch('/api/billing/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: Number(amount) }),
    });
    loadUsers();
  }

  async function toggleUser(userId: string, isActive: boolean) {
    await authFetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });
    loadUsers();
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="text-left px-4 py-3 font-medium">邮箱</th>
            <th className="text-left px-4 py-3 font-medium">角色</th>
            <th className="text-right px-4 py-3 font-medium">余额</th>
            <th className="text-left px-4 py-3 font-medium">状态</th>
            <th className="text-left px-4 py-3 font-medium">注册时间</th>
            <th className="text-left px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono">¥{u.balance.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {u.isActive ? '正常' : '已禁用'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
              <td className="px-4 py-3 space-x-2">
                <button onClick={() => topUp(u.id)} className="text-primary text-xs hover:underline">充值</button>
                <button onClick={() => toggleUser(u.id, u.isActive)} className="text-destructive text-xs hover:underline">
                  {u.isActive ? '禁用' : '启用'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ Providers Tab ============

function ProvidersTab() {
  const { authFetch } = useAuth();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', baseUrl: '', apiKey: '' });

  useEffect(() => { loadProviders(); }, []);

  async function loadProviders() {
    const res = await authFetch('/api/admin/providers');
    if (res.ok) setProviders((await res.json()).providers || []);
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

  async function editApiKey(id: string) {
    const newKey = prompt('输入新的 API Key：');
    if (!newKey) return;
    await authFetch('/api/admin/providers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, apiKey: newKey }),
    });
    loadProviders();
    alert('API Key 已更新');
  }

  async function editBaseUrl(id: string, currentUrl: string) {
    const newUrl = prompt('修改 Base URL：', currentUrl);
    if (!newUrl || newUrl === currentUrl) return;
    await authFetch('/api/admin/providers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, baseUrl: newUrl }),
    });
    loadProviders();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          {showForm ? '取消' : '添加供应商'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-4 space-y-3">
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
                <td className="px-4 py-3 font-medium">{p.displayName} <span className="text-muted-foreground text-xs">({p.name})</span></td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground max-w-[200px] truncate">{p.baseUrl}</td>
                <td className="px-4 py-3 text-right">{p._count.models}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.isActive ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => editApiKey(p.id)} className="text-xs text-primary hover:underline">改Key</button>
                  <button onClick={() => editBaseUrl(p.id, p.baseUrl)} className="text-xs text-primary hover:underline">改URL</button>
                  <button onClick={() => toggleProvider(p.id, p.isActive)} className="text-xs text-destructive hover:underline">
                    {p.isActive ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无供应商</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Models Tab ============

function ModelsTab() {
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
      if (res.ok) setProviders((await res.json()).providers || []);
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

  async function editPrice(id: string, currentInput: number, currentOutput: number) {
    const inputPrice = prompt('输入价格（CNY/1K tokens）：', String(currentInput));
    if (!inputPrice) return;
    const outputPrice = prompt('输出价格（CNY/1K tokens）：', String(currentOutput));
    if (!outputPrice) return;
    await authFetch('/api/admin/models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, inputPrice: parseFloat(inputPrice), outputPrice: parseFloat(outputPrice) }),
    });
    loadModels();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          {showForm ? '取消' : '添加模型'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-4 space-y-3">
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
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => editPrice(m.id, m.inputPrice, m.outputPrice)} className="text-xs text-primary hover:underline">改价</button>
                  <button onClick={() => toggleModel(m.id, m.isActive)} className="text-xs text-destructive hover:underline">
                    {m.isActive ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
            {models.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">暂无模型</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Shared ============

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
