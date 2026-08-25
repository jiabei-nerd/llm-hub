import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const logs = await prisma.usageLog.findMany({
    include: {
      model: { select: { modelId: true, displayName: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ logs });
}
