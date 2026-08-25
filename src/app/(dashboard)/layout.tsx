'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: '概览', icon: '📊' },
  { href: '/playground', label: '对话', icon: '💬' },
  { href: '/api-keys', label: 'API密钥', icon: '🔑' },
  { href: '/usage', label: '用量', icon: '📈' },
  { href: '/billing', label: '账单', icon: '💰' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

const adminItems = [
  { href: '/admin', label: '管理后台', icon: '🛠️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">加载中...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="text-lg font-bold text-primary">LLM Hub</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                pathname === item.href ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {user.role === 'admin' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs text-muted-foreground font-medium">管理</div>
              {adminItems.map(item => (
                <Link
                  key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    pathname === item.href ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-sm font-medium">{user.name || user.email}</div>
          <div className="text-xs text-muted-foreground">余额: ¥{user.balance.toFixed(2)}</div>
          <button onClick={logout} className="mt-2 text-xs text-destructive hover:underline">
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
