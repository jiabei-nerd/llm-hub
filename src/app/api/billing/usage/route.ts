import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const payload = await verifyAccessToken(token);
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where: { userId: payload.sub },
      include: { model: { select: { modelId: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.usageLog.count({ where: { userId: payload.sub } }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}
