import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const payload = await verifyAccessToken(token);
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (payload.role !== 'admin') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  const { userId, amount, description } = await request.json();
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  const newBalance = user.balance + amount;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { balance: newBalance } }),
    prisma.transaction.create({
      data: {
        userId,
        type: 'topup',
        amount,
        balanceAfter: newBalance,
        description: description || '管理员充值',
      },
    }),
  ]);

  return NextResponse.json({ balance: newBalance, message: '充值成功' });
}
