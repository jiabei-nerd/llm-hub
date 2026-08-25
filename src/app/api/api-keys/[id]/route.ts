import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const payload = await verifyAccessToken(token);
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;

  const key = await prisma.apiKey.findFirst({ where: { id, userId: payload.sub } });
  if (!key) return NextResponse.json({ error: '密钥不存在' }, { status: 404 });

  await prisma.apiKey.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ message: '已撤销' });
}
