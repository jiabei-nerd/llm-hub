import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

async function checkAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const [totalUsers, totalRequests, todayRequests, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.usageLog.count(),
    prisma.usageLog.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.transaction.aggregate({
      where: { type: 'topup' },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalRequests,
    todayRequests,
    totalRevenue: totalRevenue._sum.amount || 0,
  });
}
