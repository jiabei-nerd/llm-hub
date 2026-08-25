'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface UsageItem {
  id: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  latencyMs: number | null;
  createdAt: string;
  model: { modelId: string; displayName: string };
}

export default function UsagePage() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState<UsageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => { loadUsage(); }, [page]);

  async function loadUsage() {
    const res = await authFetch(`/api/billing/usage?page=${page}&pageSize=20`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用量记录</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">时间</th>
              <th className="text-left px-4 py-3 font-medium">模型</th>
              <th className="text-right px-4 py-3 font-medium">输入</th>
              <th className="text-right px-4 py-3 font-medium">输出</th>
              <th className="text-right px-4 py-3 font-medium">费用</th>
              <th className="text-right px-4 py-3 font-medium">延迟</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3">{log.model?.displayName || '-'}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{log.inputTokens}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{log.outputTokens}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">¥{log.totalCost.toFixed(6)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无使用记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">上一页</button>
          <span className="px-3 py-1 text-sm text-muted-foreground">第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  );
}
