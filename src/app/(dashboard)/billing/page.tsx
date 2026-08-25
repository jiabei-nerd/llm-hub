'use client';

import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export default function BillingPage() {
  const { user, authFetch } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    authFetch('/api/billing/usage?page=1&pageSize=50').then(async res => {
      // For now just show balance info
    });
  }, [authFetch]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">账单与余额</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground">当前余额</div>
          <div className="text-3xl font-bold text-primary mt-2">¥{(user?.balance ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground">充值方式</div>
          <div className="mt-2 text-sm text-muted-foreground">
            请联系管理员充值，或等待自助充值功能上线。
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">计费说明</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• 按实际使用的 token 数计费，不同模型价格不同</li>
          <li>• 新注册用户赠送 ¥1.00 体验额度</li>
          <li>• 余额不足时 API 调用将返回 402 错误</li>
          <li>• 可在"用量"页面查看每次调用的详细费用</li>
        </ul>
      </div>
    </div>
  );
}
