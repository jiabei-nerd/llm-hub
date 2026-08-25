import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { invalidateProviderCache } from '@/providers/registry';

async function checkAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const providers = await prisma.provider.findMany({
    include: { _count: { select: { models: true } } },
    orderBy: { priority: 'desc' },
  });

  return NextResponse.json({ providers });
}

export async function POST(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const body = await request.json();
  const provider = await prisma.provider.create({ data: body });
  return NextResponse.json({ provider });
}

export async function PUT(request: Request) {
  if (!await checkAdmin(request)) return NextResponse.json({ error: '权限不足' }, { status: 403 });

  const { id, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

  const provider = await prisma.provider.update({ where: { id }, data });
  invalidateProviderCache(id);

  return NextResponse.json({ provider });
}
