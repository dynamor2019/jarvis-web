import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const configs = [
    // DashScope (Tongyi Qianwen)
    { key: 'platform_dashscope_key', value: 'sk-0d2c013f921b4b37ba7a5f2989ffdb83' },
    { key: 'platform_dashscope_model', value: 'qwen3-max' },

    // SiliconFlow
    { key: 'platform_siliconflow_key', value: 'sk-esadtefaysrjvnjtuuskjddbhafwpsmfsptytamnrxuqyozs' },
    // { key: 'platform_siliconflow_model', value: '' }, // Default

    // Doubao
    { key: 'platform_doubao_key', value: 'f6408a93-7938-4fa0-8e36-001284a534fb' },
    { key: 'platform_doubao_model', value: 'doubao-seed-1-6-251015' },

    // Zhipu (ChatGLM)
    { key: 'platform_zhipu_key', value: '1adf7422acf2495990514f0f48858508.WnIZgXZJPHbu3FmA' },
    { key: 'platform_zhipu_model', value: 'glm-4.7' },

    // Kimi (Moonshot)
    { key: 'platform_kimi_key', value: 'sk-c3kPKrhNQCnbkG2hTN88U5e5B3eVwJgT0mXKKb4pQLritGFk' },
    { key: 'platform_kimi_model', value: 'kimi-k2.5' },

    // DeepSeek (Official) - Key not provided in recent context, setting model only
    { key: 'platform_deepseek_model', value: 'deepseek-chat' },
  ];

  console.log('Configuring AI models...');

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value },
    });
    console.log(`✓ Configured ${config.key}`);
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
