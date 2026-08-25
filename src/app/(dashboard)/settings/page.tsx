'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';

export default function SettingsPage() {
  const { user, authFetch } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    // TODO: implement settings update API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      <div className="bg-card border border-border rounded-xl p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-3 py-2 border border-input rounded-lg bg-secondary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">昵称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm" />
          </div>
          <button onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            保存
          </button>
          {saved && <span className="ml-2 text-sm text-green-600">已保存</span>}
        </div>
      </div>
    </div>
  );
}
