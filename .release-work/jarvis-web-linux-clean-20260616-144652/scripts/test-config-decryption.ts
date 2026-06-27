/**
 * PC端配置文件解密测试脚本
 * 用于验证从web端下载的配置文件解密流程
 */

import { ConfigManager } from '@/lib/pcConfigService';
import { createEncryptedConfig, generateDeviceFingerprint } from '@/lib/encryption';
import fs from 'fs';
import path from 'path';

// 模拟设备信息
const mockDeviceInfo = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  screenResolution: '1920x1080',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN'
};

// 模拟API密钥数据
const mockApiKeyData = {
  apiKey: 'jv_test_deepseek_api_key_123456789abcdef',
  modelType: 'deepseek',
  userId: 'test_user_123'
};

/**
 * 创建测试配置文件
 */
function createTestConfig() {
  const timestamp = Date.now();
  const deviceFingerprint = generateDeviceFingerprint(mockDeviceInfo.userAgent, timestamp);
  
  const encryptedConfig = createEncryptedConfig(
    mockApiKeyData.apiKey,
    mockApiKeyData.modelType,
    deviceFingerprint,
    timestamp
  );

  // 添加下载时间和过期时间
  const configFile = {
    ...encryptedConfig,
    downloadTime: new Date().toISOString(),
    expiresAt: new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  return configFile;
}

/**
 * 保存测试配置文件
 */
function saveTestConfig(configFile: any, filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(configFile, null, 2));
  console.log(`✅ 测试配置文件已保存到: ${filePath}`);
}

/**
 * 测试配置文件解密
 */
async function testConfigDecryption() {
  const configPath = 'C:\\ProgramData\\ModelService\\test-config.json';
  
  try {
    // 1. 创建并保存测试配置文件
    console.log('📝 创建测试配置文件...');
    const testConfig = createTestConfig();
    saveTestConfig(testConfig, configPath);
    
    // 2. 创建配置管理器
    console.log('🔑 创建配置管理器...');
    const configManager = new ConfigManager(configPath);
    
    // 3. 验证配置有效性
    console.log('✅ 验证配置有效性...');
    const isValid = await configManager.isConfigValid();
    console.log(`配置有效性: ${isValid ? '✅ 有效' : '❌ 无效'}`);
    
    if (!isValid) {
      throw new Error('配置文件无效');
    }
    
    // 4. 获取API密钥
    console.log('🔐 获取API密钥...');
    const apiKey = await configManager.getApiKey();
    console.log(`API密钥: ${apiKey.substring(0, 10)}...`);
    
    // 5. 获取模型类型
    console.log('🤖 获取模型类型...');
    const modelType = await configManager.getModelType();
    console.log(`模型类型: ${modelType}`);
    
    // 6. 检查配置过期时间
    console.log('⏰ 检查配置过期时间...');
    const expiry = await configManager.getConfigExpiry();
    console.log(`配置过期时间: ${expiry.toLocaleString()}`);
    
    // 7. 检查是否即将过期
    console.log('📅 检查是否即将过期...');
    const isExpiringSoon = await configManager.isConfigExpiringSoon();
    console.log(`即将过期: ${isExpiringSoon ? '是' : '否'}`);
    
    // 8. 验证API密钥格式
    console.log('🔍 验证API密钥格式...');
    if (!apiKey.startsWith('jv_')) {
      throw new Error('API密钥格式不正确');
    }
    
    if (apiKey.length < 20) {
      throw new Error('API密钥长度不足');
    }
    
    console.log('✅ API密钥格式验证通过');
    
    // 9. 模拟API调用测试
    console.log('🌐 模拟API调用测试...');
    await simulateApiCall(apiKey, modelType);
    
    console.log('\n🎉 配置文件解密测试完成！所有测试通过 ✅');
    
    return {
      success: true,
      apiKey,
      modelType,
      expiry: expiry.toISOString(),
      isExpiringSoon
    };
    
  } catch (error) {
    console.error('\n❌ 配置文件解密测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 模拟API调用
 */
async function simulateApiCall(apiKey: string, modelType: string) {
  // 这里模拟调用AI模型的API
  console.log(`🔄 使用 ${modelType} 模型进行API调用测试...`);
  
  // 模拟不同的模型API端点
  const modelEndpoints = {
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    kimi: 'https://api.moonshot.cn/v1/chat/completions',
    qwen: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    doubao: 'https://ark.cn-beijing.volces.com/api/v1/chat/completions',
    zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    gpt4: 'https://api.openai.com/v1/chat/completions'
  };
  
  const endpoint = modelEndpoints[modelType as keyof typeof modelEndpoints];
  if (!endpoint) {
    throw new Error(`不支持的模型类型: ${modelType}`);
  }
  
  // 模拟API请求头
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'User-Agent': 'Jarvis-Client/1.0.0'
  };
  
  // 模拟请求体
  const requestBody = {
    model: modelType,
    messages: [
      {
        role: 'user',
        content: '你好，这是一个测试消息。'
      }
    ],
    max_tokens: 100,
    temperature: 0.7
  };
  
  console.log(`📡 API端点: ${endpoint}`);
  console.log(`🔑 使用API密钥: ${apiKey.substring(0, 10)}...`);
  console.log(`📤 请求体:`, JSON.stringify(requestBody, null, 2));
  
  // 这里只是模拟，实际环境中会发送真实的HTTP请求
  console.log('✅ API调用测试完成（模拟）');
  
  return {
    success: true,
    endpoint,
    headers,
    requestBody
  };
}

/**
 * 运行完整测试
 */
async function runFullTest() {
  console.log('🚀 开始PC端配置文件解密测试...\n');
  
  try {
    // 测试基本加密解密功能
    console.log('🔬 测试基本加密解密功能...');
    const basicTestResult = await testBasicEncryption();
    console.log('✅ 基本加密解密测试通过\n');
    
    // 测试配置文件解密流程
    console.log('🔐 测试配置文件解密流程...');
    const configTestResult = await testConfigDecryption();
    
    if (configTestResult.success) {
      console.log('\n📊 测试结果汇总:');
      console.log(`✅ API密钥: ${configTestResult.apiKey?.substring(0, 10)}...`);
      console.log(`✅ 模型类型: ${configTestResult.modelType}`);
      console.log(`✅ 配置过期: ${configTestResult.expiry}`);
      console.log(`✅ 即将过期: ${configTestResult.isExpiringSoon}`);
      
      // 保存测试结果
      const testResult = {
        timestamp: new Date().toISOString(),
        basicTest: basicTestResult,
        configTest: configTestResult,
        status: 'PASSED'
      };
      
      fs.writeFileSync('test-results.json', JSON.stringify(testResult, null, 2));
      console.log('\n📝 测试结果已保存到 test-results.json');
      
      return testResult;
    } else {
      throw new Error(configTestResult.error);
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    
    const failedResult = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      status: 'FAILED'
    };
    
    fs.writeFileSync('test-results.json', JSON.stringify(failedResult, null, 2));
    return failedResult;
  }
}

/**
 * 测试基本加密解密功能
 */
async function testBasicEncryption() {
  const { encrypt, decrypt } = await import('@/lib/encryption');
  
  // 生成测试密钥
  const key = Buffer.from('0123456789abcdef0123456789abcdef'); // 32字节密钥
  
  // 测试数据
  const testData = {
    apiKey: 'jv_test_api_key_123456789',
    modelType: 'deepseek',
    timestamp: Date.now(),
    deviceFingerprint: 'test_device_fingerprint_12345'
  };
  
  const testString = JSON.stringify(testData);
  
  // 加密
  const encrypted = encrypt(testString, key);
  console.log('🔐 加密完成');
  console.log(`📊 加密数据长度: ${encrypted.encrypted.length}`);
  console.log(`🔑 IV: ${encrypted.iv.substring(0, 8)}...`);
  console.log(`🏷️ 标签: ${encrypted.tag.substring(0, 8)}...`);
  
  // 解密
  const decrypted = decrypt(encrypted, key);
  console.log('🔓 解密完成');
  
  // 验证
  const decryptedData = JSON.parse(decrypted);
  if (JSON.stringify(decryptedData) !== JSON.stringify(testData)) {
    throw new Error('解密数据与原始数据不匹配');
  }
  
  console.log('✅ 加密解密验证通过');
  
  return {
    success: true,
    encryptedLength: encrypted.encrypted.length,
    decryptedData
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  runFullTest().then(result => {
    if (result.status === 'PASSED') {
      console.log('\n🎉 所有测试通过！系统运行正常 ✅');
      process.exit(0);
    } else {
      console.log('\n❌ 测试失败，请检查错误信息');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 测试执行失败:', error);
    process.exit(1);
  });
}

export { testConfigDecryption, runFullTest, createTestConfig, simulateApiCall };