import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ error: '缺少刷新令牌' }, { status: 400 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: '令牌已过期' }, { status: 401 });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      return NextResponse.json({ error: '令牌无效' }, { status: 401 });
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = await signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    });
    const newRefreshToken = await signRefreshToken(stored.user.id);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    return NextResponse.json({ error: '刷新失败' }, { status: 500 });
  }
}
