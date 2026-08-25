import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-key';
import { checkRateLimit } from '@/lib/rate-limiter';
import { deductBalance, estimateTokens } from '@/lib/billing';
import { getProviderForModel } from '@/providers/registry';
import { ChatCompletionRequest } from '@/providers/types';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.replace('Bearer ', '');
  if (!key) {
    return NextResponse.json({ error: { message: '缺少 API Key', type: 'auth_error' } }, { status: 401 });
  }

  const auth = await validateApiKey(key);
  if (!auth) {
    return NextResponse.json({ error: { message: 'API Key 无效', type: 'auth_error' } }, { status: 401 });
  }

  const { user, apiKey } = auth;

  const rateCheck = checkRateLimit(user.id, user.role);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { message: '请求过于频繁，请稍后重试', type: 'rate_limit_error' } },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.retryAfterMs || 1000) / 1000)) } }
    );
  }

  let body: ChatCompletionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: '请求体格式错误', type: 'invalid_request' } }, { status: 400 });
  }

  if (!body.model || !body.messages?.length) {
    return NextResponse.json({ error: { message: '缺少 model 或 messages', type: 'invalid_request' } }, { status: 400 });
  }

  if (user.balance <= 0) {
    return NextResponse.json({ error: { message: '余额不足，请充值', type: 'insufficient_balance' } }, { status: 402 });
  }

  let providerResult;
  try {
    providerResult = await getProviderForModel(body.model);
  } catch {
    return NextResponse.json({ error: { message: `模型 ${body.model} 不可用`, type: 'model_not_found' } }, { status: 404 });
  }

  const { provider, model } = providerResult;
  const startTime = Date.now();
  const requestId = generateId('req-');

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
            user.id, apiKey.id, body.model,
            finalPromptTokens, finalCompletionTokens,
            Date.now() - startTime, 200
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : '上游服务异常';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: errMsg } })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Request-Id': requestId,
      },
    });
  }

  try {
    const upstreamRequest = { ...body, model: model.upstreamModelId };
    const response = await provider.chatCompletion(upstreamRequest);
    response.model = body.model;

    await deductBalance(
      user.id, apiKey.id, body.model,
      response.usage.prompt_tokens, response.usage.completion_tokens,
      Date.now() - startTime, 200
    );

    return NextResponse.json(response, {
      headers: { 'X-Request-Id': requestId },
    });
  } catch {
    return NextResponse.json(
      { error: { message: '上游服务异常，请稍后重试', type: 'upstream_error' } },
      { status: 502 }
    );
  }
}
