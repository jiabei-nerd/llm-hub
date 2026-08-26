import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProviderForModel } from '@/providers/registry';
import { deductBalance, estimateTokens } from '@/lib/billing';
import { ChatCompletionRequest } from '@/providers/types';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: { message: '未登录' } }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: { message: '登录已过期' } }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: { message: '账户不可用' } }, { status: 403 });
  }

  let body: ChatCompletionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: '请求格式错误' } }, { status: 400 });
  }

  if (!body.model || !body.messages?.length) {
    return NextResponse.json({ error: { message: '缺少 model 或 messages' } }, { status: 400 });
  }

  if (user.balance <= 0) {
    return NextResponse.json({ error: { message: '余额不足，请充值' } }, { status: 402 });
  }

  let providerResult;
  try {
    providerResult = await getProviderForModel(body.model);
  } catch {
    return NextResponse.json({ error: { message: `模型 ${body.model} 不可用` } }, { status: 404 });
  }

  const { provider, model } = providerResult;
  const startTime = Date.now();

  if (body.stream) {
    const encoder = new TextEncoder();
    let accumulatedContent = '';
    let finalPromptTokens = 0;
    let finalCompletionTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const upstreamRequest = { ...body, model: model.upstreamModelId };
          for await (const chunk of provider.chatCompletionStream(upstreamRequest)) {
            chunk.model = body.model;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

            const content = chunk.choices[0]?.delta?.content;
            if (content) accumulatedContent += content;
            if (chunk.usage) {
              finalPromptTokens = chunk.usage.prompt_tokens;
              finalCompletionTokens = chunk.usage.completion_tokens;
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          if (finalCompletionTokens === 0) {
            finalCompletionTokens = estimateTokens(accumulatedContent);
            finalPromptTokens = estimateTokens(JSON.stringify(body.messages));
          }

          await deductBalance(
            user.id, null, body.model,
            finalPromptTokens, finalCompletionTokens,
            Date.now() - startTime, 200
          );
        } catch (err) {
          const errMsg = err instanceof Error ? `${err.message}` : '上游服务异常';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: errMsg } })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  }

  try {
    const upstreamRequest = { ...body, model: model.upstreamModelId };
    const response = await provider.chatCompletion(upstreamRequest);
    response.model = body.model;

    await deductBalance(
      user.id, null, body.model,
      response.usage.prompt_tokens, response.usage.completion_tokens,
      Date.now() - startTime, 200
    );

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: { message: err instanceof Error ? err.message : '上游服务异常' } }, { status: 502 });
  }
}
