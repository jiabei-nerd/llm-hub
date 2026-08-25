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

  const models = await prisma.model.findMany({
    include: { provider: { select: { displayName: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ models });
}

export async function POST(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const body = await request.json();
  const model = await prisma.model.create({ data: body });
  return NextResponse.json({ model });
}

export async function PUT(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const { id, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

  const model = await prisma.model.update({ where: { id }, data });
  return NextResponse.json({ model });
}

export async function DELETE(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

  await prisma.model.delete({ where: { id } });
  return NextResponse.json({ message: '已删除' });
}
