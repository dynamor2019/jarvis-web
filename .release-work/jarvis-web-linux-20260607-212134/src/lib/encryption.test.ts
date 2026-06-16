/**
 * 加密解密算法单元测试
 */

import { 
  generateKey, 
  generateDeviceFingerprint, 
  deriveKey, 
  encrypt, 
  decrypt, 
  generateSignature, 
  verifySignature,
  createEncryptedConfig,
  decryptConfig,
  generateApiKey,
  generateSecureRandom,
  hash
} from '@/lib/encryption';
import crypto from 'crypto';

// 模拟环境变量
process.env.DEVICE_FINGERPRINT_SALT = 'test-device-salt';
process.env.KEY_DERIVATION_SALT = 'test-key-salt';

describe('加密解密算法测试', () => {
  
  describe('密钥生成', () => {
    test('generateKey 应该生成256位密钥', () => {
      const key = generateKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits = 32 bytes
    });

    test('generateKey 应该生成不同的密钥', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('设备指纹生成', () => {
    test('generateDeviceFingerprint 应该生成一致的指纹', () => {
      const userAgent = 'Mozilla/5.0 Test Browser';
      const timestamp = 1234567890;
      
      const fingerprint1 = generateDeviceFingerprint(userAgent, timestamp);
      const fingerprint2 = generateDeviceFingerprint(userAgent, timestamp);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // SHA256 hex = 64 chars
    });

    test('generateDeviceFingerprint 应该生成不同的指纹', () => {
      const userAgent1 = 'Browser1';
      const userAgent2 = 'Browser2';
      const timestamp = 1234567890;
      
      const fingerprint1 = generateDeviceFingerprint(userAgent1, timestamp);
      const fingerprint2 = generateDeviceFingerprint(userAgent2, timestamp);
      
      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });

  describe('密钥派生', () => {
    test('deriveKey 应该生成一致的密钥', () => {
      const deviceFingerprint = 'test_fingerprint_12345';
      const timestamp = 1234567890;
      
      const key1 = deriveKey(deviceFingerprint, timestamp);
      const key2 = deriveKey(deviceFingerprint, timestamp);
      
      expect(key1.equals(key2)).toBe(true);
      expect(key1.length).toBe(32); // SHA256 = 32 bytes
    });

    test('deriveKey 应该生成不同的密钥', () => {
      const deviceFingerprint = 'test_fingerprint_12345';
      const timestamp1 = 1234567890;
      const timestamp2 = 1234567891;
      
      const key1 = deriveKey(deviceFingerprint, timestamp1);
      const key2 = deriveKey(deviceFingerprint, timestamp2);
      
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('加密解密', () => {
    test('encrypt/decrypt 应该正确加密解密数据', () => {
      const key = generateKey();
      const originalData = 'Hello, World! This is a test message.';
      
      const encrypted = encrypt(originalData, key);
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.tag).toBeTruthy();
      
      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe(originalData);
    });

    test('encrypt 应该生成不同的IV', () => {
      const key = generateKey();
      const data = 'Test data';
      
      const encrypted1 = encrypt(data, key);
      const encrypted2 = encrypt(data, key);
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    test('decrypt 应该失败当密钥不正确', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      const data = 'Test data';
      
      const encrypted = encrypt(data, key1);
      
      expect(() => {
        decrypt(encrypted, key2);
      }).toThrow();
    });
  });

  describe('数字签名', () => {
    test('generateSignature/verifySignature 应该正确签名验证', () => {
      const key = generateKey();
      const data = 'Test data for signature';
      
      const signature = generateSignature(data, key);
      expect(signature).toBeTruthy();
      expect(signature).toHaveLength(64); // SHA256 hex = 64 chars
      
      const isValid = verifySignature(data, signature, key);
      expect(isValid).toBe(true);
    });

    test('verifySignature 应该失败当数据被篡改', () => {
      const key = generateKey();
      const originalData = 'Original data';
      const tamperedData = 'Tampered data';
      
      const signature = generateSignature(originalData, key);
      const isValid = verifySignature(tamperedData, signature, key);
      
      expect(isValid).toBe(false);
    });

    test('verifySignature 应该失败当签名不正确', () => {
      const key = generateKey();
      const data = 'Test data';
      const wrongSignature = 'wrong_signature_123456789012345678901234567890123456789012345678901234567890';
      
      const isValid = verifySignature(data, wrongSignature, key);
      
      expect(isValid).toBe(false);
    });
  });

  describe('配置文件加密解密', () => {
    test('createEncryptedConfig/decryptConfig 应该正确加密解密配置', () => {
      const apiKey = 'jv_test_api_key_123456789';
      const modelType = 'deepseek';
      const deviceFingerprint = 'test_device_fingerprint_12345';
      const timestamp = Date.now();
      
      const encryptedConfig = createEncryptedConfig(apiKey, modelType, deviceFingerprint, timestamp);
      
      expect(encryptedConfig.configId).toMatch(/^config_/);
      expect(encryptedConfig.encryptedData).toBeTruthy();
      expect(encryptedConfig.iv).toBeTruthy();
      expect(encryptedConfig.tag).toBeTruthy();
      expect(encryptedConfig.signature).toBeTruthy();
      expect(encryptedConfig.timestamp).toBe(timestamp);
      expect(encryptedConfig.deviceFingerprint).toBe(deviceFingerprint);
      
      const decryptedConfig = decryptConfig(encryptedConfig, deviceFingerprint);
      
      expect(decryptedConfig.apiKey).toBe(apiKey);
      expect(decryptedConfig.modelType).toBe(modelType);
      expect(decryptedConfig.deviceFingerprint).toBe(deviceFingerprint);
      expect(decryptedConfig.timestamp).toBe(timestamp);
      expect(decryptedConfig.expiresAt).toBe(timestamp + 7 * 24 * 60 * 60 * 1000);
    });

    test('decryptConfig 应该失败当设备指纹不匹配', () => {
      const apiKey = 'jv_test_api_key_123456789';
      const modelType = 'deepseek';
      const deviceFingerprint = 'test_device_fingerprint_12345';
      const wrongDeviceFingerprint = 'wrong_device_fingerprint_67890';
      const timestamp = Date.now();
      
      const encryptedConfig = createEncryptedConfig(apiKey, modelType, deviceFingerprint, timestamp);
      
      expect(() => {
        decryptConfig(encryptedConfig, wrongDeviceFingerprint);
      }).toThrow('设备指纹不匹配');
    });

    test('decryptConfig 应该失败当签名不正确', () => {
      const apiKey = 'jv_test_api_key_123456789';
      const modelType = 'deepseek';
      const deviceFingerprint = 'test_device_fingerprint_12345';
      const timestamp = Date.now();
      
      const encryptedConfig = createEncryptedConfig(apiKey, modelType, deviceFingerprint, timestamp);
      
      // 篡改签名
      encryptedConfig.signature = 'tampered_signature_123456789012345678901234567890123456789012345678901234567890';
      
      expect(() => {
        decryptConfig(encryptedConfig, deviceFingerprint);
      }).toThrow('数字签名验证失败');
    });

    test('decryptConfig 应该失败当时间戳过期', () => {
      const apiKey = 'jv_test_api_key_123456789';
      const modelType = 'deepseek';
      const deviceFingerprint = 'test_device_fingerprint_12345';
      const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10分钟前
      
      const encryptedConfig = createEncryptedConfig(apiKey, modelType, deviceFingerprint, oldTimestamp);
      
      expect(() => {
        decryptConfig(encryptedConfig, deviceFingerprint);
      }).toThrow('配置文件已过期');
    });

    test('decryptConfig 应该失败当配置过期', () => {
      const apiKey = 'jv_test_api_key_123456789';
      const modelType = 'deepseek';
      const deviceFingerprint = 'test_device_fingerprint_12345';
      const timestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8天前
      
      const encryptedConfig = createEncryptedConfig(apiKey, modelType, deviceFingerprint, timestamp);
      
      // 手动设置过期时间
      encryptedConfig.timestamp = Date.now();
      
      expect(() => {
        decryptConfig(encryptedConfig, deviceFingerprint);
      }).toThrow('配置文件已过期');
    });
  });

  describe('API密钥生成', () => {
    test('generateApiKey 应该生成有效的API密钥', () => {
      const apiKey = generateApiKey();
      
      expect(apiKey).toMatch(/^jv_[a-f0-9]{64}$/);
      expect(apiKey).toHaveLength(67); // "jv_" + 64 hex chars
    });

    test('generateApiKey 应该生成不同的密钥', () => {
      const apiKey1 = generateApiKey();
      const apiKey2 = generateApiKey();
      
      expect(apiKey1).not.toBe(apiKey2);
    });
  });

  describe('随机数生成', () => {
    test('generateSecureRandom 应该生成指定长度的随机数', () => {
      const random1 = generateSecureRandom(16);
      const random2 = generateSecureRandom(32);
      const random3 = generateSecureRandom(64);
      
      expect(random1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(random2).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(random3).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    test('generateSecureRandom 应该生成不同的随机数', () => {
      const random1 = generateSecureRandom(32);
      const random2 = generateSecureRandom(32);
      
      expect(random1).not.toBe(random2);
    });
  });

  describe('哈希函数', () => {
    test('hash 应该生成一致的哈希值', () => {
      const data = 'Test data for hashing';
      
      const hash1 = hash(data);
      const hash2 = hash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex = 64 chars
    });

    test('hash 应该生成不同的哈希值', () => {
      const data1 = 'Test data 1';
      const data2 = 'Test data 2';
      
      const hash1 = hash(data1);
      const hash2 = hash(data2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('hash 应该对相同输入生成相同输出', () => {
      const data = 'Same input data';
      
      const hashes = Array.from({ length: 10 }, () => hash(data));
      const uniqueHashes = new Set(hashes);
      
      expect(uniqueHashes.size).toBe(1);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理空字符串', () => {
      const key = generateKey();
      
      const encrypted = encrypt('', key);
      const decrypted = decrypt(encrypted, key);
      
      expect(decrypted).toBe('');
    });

    test('应该处理大文本', () => {
      const key = generateKey();
      const largeText = 'A'.repeat(10000);
      
      const encrypted = encrypt(largeText, key);
      const decrypted = decrypt(encrypted, key);
      
      expect(decrypted).toBe(largeText);
    });

    test('应该处理特殊字符', () => {
      const key = generateKey();
      const specialText = 'Hello 世界! 🌍 Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const encrypted = encrypt(specialText, key);
      const decrypted = decrypt(encrypted, key);
      
      expect(decrypted).toBe(specialText);
    });
  });

  describe('性能测试', () => {
    test('加密解密应该在合理时间内完成', () => {
      const key = generateKey();
      const data = 'Performance test data';
      
      const startTime = Date.now();
      const encrypted = encrypt(data, key);
      const encryptedTime = Date.now() - startTime;
      
      const decryptStartTime = Date.now();
      const decrypted = decrypt(encrypted, key);
      const decryptTime = Date.now() - decryptStartTime;
      
      expect(encryptedTime).toBeLessThan(100); // 小于100ms
      expect(decryptTime).toBeLessThan(100); // 小于100ms
      expect(decrypted).toBe(data);
    });

    test('批量加密解密应该保持性能', () => {
      const key = generateKey();
      const testData = Array.from({ length: 100 }, (_, i) => `Test data ${i}`);
      
      const startTime = Date.now();
      
      const encryptedData = testData.map(data => encrypt(data, key));
      const decryptedData = encryptedData.map(encrypted => decrypt(encrypted, key));
      
      const totalTime = Date.now() - startTime;
      
      expect(decryptedData).toEqual(testData);
      expect(totalTime).toBeLessThan(1000); // 小于1秒
    });
  });

  describe('安全测试', () => {
    test('不应该从加密数据泄露原始数据信息', () => {
      const key = generateKey();
      const sensitiveData = 'password123';
      
      const encrypted1 = encrypt(sensitiveData, key);
      const encrypted2 = encrypt(sensitiveData, key);
      
      // 两次加密结果应该完全不同
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.tag).not.toBe(encrypted2.tag);
    });

    test('签名验证应该抵抗时序攻击', () => {
      const key = generateKey();
      const data = 'Test data';
      const signature = generateSignature(data, key);
      
      const startTime = Date.now();
      const isValid = verifySignature(data, signature, key);
      const validTime = Date.now() - startTime;
      
      const wrongSignature = signature.slice(0, -1) + 'X';
      const wrongStartTime = Date.now();
      const isInvalid = verifySignature(data, wrongSignature, key);
      const invalidTime = Date.now() - wrongStartTime;
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
      expect(Math.abs(validTime - invalidTime)).toBeLessThan(50); // 时序差异应该很小
    });
  });
});