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

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, balance: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

export async function PUT(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const { userId, balance, isActive, role } = await request.json();
  if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (balance !== undefined) data.balance = balance;
  if (isActive !== undefined) data.isActive = isActive;
  if (role !== undefined) data.role = role;

  const user = await prisma.user.update({ where: { id: userId }, data });

  return NextResponse.json({ user });
}
