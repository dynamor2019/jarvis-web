import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AI Models...');

  const models = [
    // Free Models (免费版)
    {
      name: 'Qwen 2.5 7B (Free)',
      value: 'Qwen/Qwen2.5-7B-Instruct',
      provider: 'siliconflow',
      tier: 'free',
      sortOrder: 1,
      isActive: true
    },
    {
      name: 'GLM-4 9B (Free)',
      value: 'THUDM/glm-4-9b-chat',
      provider: 'siliconflow',
      tier: 'free',
      sortOrder: 2,
      isActive: true
    },
    // Pro Models (充值版/订阅版)
    {
      name: 'DeepSeek V3 (Pro)',
      value: 'deepseek-ai/DeepSeek-V3',
      provider: 'siliconflow',
      tier: 'pro',
      sortOrder: 10,
      isActive: true
    },
    {
      name: 'Qwen 2.5 72B (Pro)',
      value: 'Qwen/Qwen2.5-72B-Instruct',
      provider: 'siliconflow',
      tier: 'pro',
      sortOrder: 11,
      isActive: true
    },
    {
      name: 'GPT-4o (Pro)',
      value: 'gpt-4o',
      provider: 'openai',
      tier: 'pro',
      sortOrder: 12,
      isActive: true
    },
    {
      name: 'Claude 3.5 Sonnet (Pro)',
      value: 'claude-3-5-sonnet-20240620',
      provider: 'anthropic',
      tier: 'pro',
      sortOrder: 13,
      isActive: true
    }
  ];

  for (const m of models) {
    const existing = await prisma.aIModel.findFirst({ where: { value: m.value } });
    if (existing) {
        await prisma.aIModel.update({
            where: { id: existing.id },
            data: m
        });
        console.log(`Updated ${m.name}`);
    } else {
        await prisma.aIModel.create({ data: m });
        console.log(`Created ${m.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
