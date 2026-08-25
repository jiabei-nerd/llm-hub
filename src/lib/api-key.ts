import { createHash } from 'crypto';
import { generateId } from './utils';
import { prisma } from './prisma';

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk-lh-${generateId()}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 12);
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function validateApiKey(key: string) {
  const keyHash = hashApiKey(key);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash, isActive: true },
    include: { user: true },
  });

  if (!apiKey || !apiKey.user.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { user: apiKey.user, apiKey };
}
