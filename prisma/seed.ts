import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaNeon } from '@prisma/adapter-neon';
import { hash } from 'bcryptjs';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@llmhub.com' },
    update: {},
    create: {
      email: 'admin@llmhub.com',
      passwordHash: adminPassword,
      name: '管理员',
      role: 'admin',
      balance: 100,
    },
  });
  console.log('Admin user created:', admin.email);

  const providers = [
    { name: 'deepseek', displayName: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder', priority: 10 },
    { name: 'qwen', displayName: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey: process.env.QWEN_API_KEY || 'sk-placeholder', priority: 9 },
    { name: 'zhipu', displayName: '智谱GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', apiKey: process.env.ZHIPU_API_KEY || 'sk-placeholder', priority: 8 },
    { name: 'moonshot', displayName: '月之暗面Kimi', baseUrl: 'https://api.moonshot.cn/v1', apiKey: process.env.MOONSHOT_API_KEY || 'sk-placeholder', priority: 7 },
    { name: 'wenxin', displayName: '百度文心', baseUrl: 'https://qianfan.baidubce.com/v2', apiKey: process.env.WENXIN_API_KEY || 'sk-placeholder', priority: 6 },
  ];

  for (const p of providers) {
    await prisma.provider.upsert({
      where: { name: p.name },
      update: { baseUrl: p.baseUrl },
      create: p,
    });
  }
  console.log('Providers created');

  const allProviders = await prisma.provider.findMany();
  const providerMap = Object.fromEntries(allProviders.map(p => [p.name, p.id]));

  const models = [
    { modelId: 'deepseek-chat', displayName: 'DeepSeek Chat', providerId: providerMap['deepseek'], upstreamModelId: 'deepseek-chat', inputPrice: 0.001, outputPrice: 0.002, contextWindow: 64000, maxTokens: 4096 },
    { modelId: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner', providerId: providerMap['deepseek'], upstreamModelId: 'deepseek-reasoner', inputPrice: 0.004, outputPrice: 0.016, contextWindow: 64000, maxTokens: 8192 },
    { modelId: 'qwen-turbo', displayName: '通义千问 Turbo', providerId: providerMap['qwen'], upstreamModelId: 'qwen-turbo', inputPrice: 0.001, outputPrice: 0.002, contextWindow: 131072, maxTokens: 8192 },
    { modelId: 'qwen-plus', displayName: '通义千问 Plus', providerId: providerMap['qwen'], upstreamModelId: 'qwen-plus', inputPrice: 0.004, outputPrice: 0.012, contextWindow: 131072, maxTokens: 8192 },
    { modelId: 'qwen-max', displayName: '通义千问 Max', providerId: providerMap['qwen'], upstreamModelId: 'qwen-max', inputPrice: 0.02, outputPrice: 0.06, contextWindow: 32768, maxTokens: 8192 },
    { modelId: 'glm-4-flash', displayName: 'GLM-4 Flash', providerId: providerMap['zhipu'], upstreamModelId: 'glm-4-flash', inputPrice: 0.0001, outputPrice: 0.0001, contextWindow: 128000, maxTokens: 4096 },
    { modelId: 'glm-4-plus', displayName: 'GLM-4 Plus', providerId: providerMap['zhipu'], upstreamModelId: 'glm-4-plus', inputPrice: 0.05, outputPrice: 0.05, contextWindow: 128000, maxTokens: 4096 },
    { modelId: 'moonshot-v1-8k', displayName: 'Kimi 8K', providerId: providerMap['moonshot'], upstreamModelId: 'moonshot-v1-8k', inputPrice: 0.012, outputPrice: 0.012, contextWindow: 8192, maxTokens: 4096 },
    { modelId: 'moonshot-v1-32k', displayName: 'Kimi 32K', providerId: providerMap['moonshot'], upstreamModelId: 'moonshot-v1-32k', inputPrice: 0.024, outputPrice: 0.024, contextWindow: 32768, maxTokens: 4096 },
    { modelId: 'ernie-speed', displayName: '文心一言 Speed', providerId: providerMap['wenxin'], upstreamModelId: 'ernie-speed-128k', inputPrice: 0.001, outputPrice: 0.002, contextWindow: 128000, maxTokens: 4096 },
    { modelId: 'ernie-4.0', displayName: '文心一言 4.0', providerId: providerMap['wenxin'], upstreamModelId: 'ernie-4.0-8k', inputPrice: 0.03, outputPrice: 0.09, contextWindow: 8192, maxTokens: 4096 },
  ];

  for (const m of models) {
    await prisma.model.upsert({
      where: { modelId: m.modelId },
      update: { inputPrice: m.inputPrice, outputPrice: m.outputPrice },
      create: m,
    });
  }
  console.log(`${models.length} models created`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
