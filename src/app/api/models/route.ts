import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const payload = await verifyAccessToken(token);
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const models = await prisma.model.findMany({
    where: { isActive: true, provider: { isActive: true } },
    include: { provider: { select: { displayName: true, name: true } } },
    orderBy: [{ provider: { priority: 'desc' } }, { inputPrice: 'asc' }],
  });

  return NextResponse.json({ models });
}
