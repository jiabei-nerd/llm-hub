import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-key';

async function getUser(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return payload;
}

export async function GET(request: Request) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: payload.sub },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, keyPrefix: true, isActive: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const name = body.name || '默认密钥';

  const { key, hash, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: { name, keyHash: hash, keyPrefix: prefix, userId: payload.sub },
  });

  return NextResponse.json({ key, prefix, name, message: '请保存此密钥，它只会显示一次' });
}
