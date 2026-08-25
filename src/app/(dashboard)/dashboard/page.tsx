'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface Stats {
  todayRequests: number;
  totalRequests: number;
  balance: number;
  apiKeyCount: number;
}

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState<Stats>({ todayRequests: 0, totalRequests: 0, balance: 0, apiKeyCount: 0 });

  useEffect(() => {
    async function load() {
      const [balanceRes, keysRes] = await Promise.all([
        authFetch('/api/billing/balance'),
        authFetch('/api/api-keys'),
      ]);
      const balanceData = await balanceRes.json();
      const keysData = await keysRes.json();
      setStats(prev => ({
        ...prev,
        balance: balanceData.balance || 0,
        apiKeyCount: keysData.keys?.length || 0,
      }));
    }
    load();
  }, [authFetch]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">控制台</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="余额" value={`¥${(user?.balance ?? stats.balance).toFixed(2)}`} />
        <StatCard label="API密钥" value={`${stats.apiKeyCount} 个`} />
        <StatCard label="今日请求" value={`${stats.todayRequests}`} />
        <StatCard label="总请求" value={`${stats.totalRequests}`} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">快速开始</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>前往 <span className="text-primary">API密钥</span> 页面创建你的密钥</li>
          <li>在代码中设置 <code className="bg-secondary px-1 rounded">base_url</code> 为本平台地址</li>
          <li>选择模型（如 <code className="bg-secondary px-1 rounded">deepseek-chat</code>）开始调用</li>
          <li>在 <span className="text-primary">用量</span> 页面查看调用记录和费用</li>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
