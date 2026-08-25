'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await authFetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
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
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
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
    </div>
  );
}
