import { prisma } from './prisma';

interface PricingInfo {
  inputPrice: number;
  outputPrice: number;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: PricingInfo
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1000) * pricing.inputPrice;
  const outputCost = (outputTokens / 1000) * pricing.outputPrice;
  return {
    inputCost: Math.round(inputCost * 1000000) / 1000000,
    outputCost: Math.round(outputCost * 1000000) / 1000000,
    totalCost: Math.round((inputCost + outputCost) * 1000000) / 1000000,
  };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.7);
}

export async function deductBalance(
  userId: string,
  apiKeyId: string | null,
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  statusCode: number
): Promise<void> {
  const model = await prisma.model.findUnique({ where: { modelId } });
  if (!model) return;

  const { inputCost, outputCost, totalCost } = calculateCost(
    inputTokens,
    outputTokens,
    { inputPrice: model.inputPrice, outputPrice: model.outputPrice }
  );

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newBalance = user.balance - totalCost;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: 'deduction',
        amount: -totalCost,
        balanceAfter: newBalance,
        description: `API调用: ${model.displayName}`,
      },
    }),
    prisma.usageLog.create({
      data: {
        userId,
        apiKeyId,
        modelId: model.id,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCost,
        outputCost,
        totalCost,
        latencyMs,
        statusCode,
      },
    }),
  ]);
}
