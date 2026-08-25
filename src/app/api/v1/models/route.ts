import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models = await prisma.model.findMany({
    where: { isActive: true, provider: { isActive: true } },
    include: { provider: { select: { displayName: true, name: true } } },
  });

  const data = models.map(m => ({
    id: m.modelId,
    object: 'model',
    created: Math.floor(m.createdAt.getTime() / 1000),
    owned_by: m.provider.name,
    provider: m.provider.displayName,
    pricing: {
      input: m.inputPrice,
      output: m.outputPrice,
      unit: 'CNY/1K tokens',
    },
    context_window: m.contextWindow,
    max_tokens: m.maxTokens,
  }));

  return NextResponse.json({ object: 'list', data });
}
