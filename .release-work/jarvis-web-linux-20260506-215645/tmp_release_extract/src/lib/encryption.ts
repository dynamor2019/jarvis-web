/**
 * AES-256 加密解密工具
 * 用于配置文件的安全传输
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
// const TAG_LENGTH = 16; // GCM only

/**
 * 生成安全的随机密钥
 */
export function generateKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * 生成设备指纹（基于用户代理、屏幕分辨率等）
 */
export function generateDeviceFingerprint(userAgent: string, timestamp: number): string {
  const hash = crypto.createHash('sha256');
  hash.update(userAgent);
  hash.update(timestamp.toString());
  hash.update(process.env.DEVICE_FINGERPRINT_SALT || 'jarvis-device-salt-2024');
  return hash.digest('hex');
}

/**
 * 使用设备指纹和时间戳生成派生密钥
 */
export function deriveKey(deviceFingerprint: string, timestamp: number): Buffer {
  const hash = crypto.createHash('sha256');
  hash.update(deviceFingerprint);
  hash.update(timestamp.toString());
  hash.update(process.env.KEY_DERIVATION_SALT || 'jarvis-key-salt-2024');
  return hash.digest();
}

/**
 * 加密数据
 */
export function encrypt(text: string, key: Buffer): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

/**
 * 解密数据
 */
export function decrypt(encryptedData: { encrypted: string; iv: string }, key: Buffer): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(encryptedData.iv, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 生成数字签名
 */
export function generateSignature(data: string, key: Buffer): string {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * 验证数字签名
 */
export function verifySignature(data: string, signature: string, key: Buffer): boolean {
  const expectedSignature = generateSignature(data, key);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

/**
 * 生成API密钥
 */
export function generateApiKey(): string {
  return 'jv_' + crypto.randomBytes(32).toString('hex');
}

/**
 * 生成配置ID
 */
export function generateConfigId(): string {
  return 'config_' + crypto.randomBytes(16).toString('hex');
}

/**
 * 创建加密配置文件
 */
export function createEncryptedConfig(apiKey: string, modelType: string, deviceFingerprint: string, timestamp: number): {
  configId: string;
  encryptedData: string;
  iv: string;
  signature: string;
  timestamp: number;
  deviceFingerprint: string;
} {
  const key = deriveKey(deviceFingerprint, timestamp);
  const configData = JSON.stringify({
    apiKey,
    modelType,
    deviceFingerprint,
    timestamp,
    expiresAt: timestamp + 7 * 24 * 60 * 60 * 1000, // 7天后过期
  });
  
  const { encrypted, iv } = encrypt(configData, key);
  // Signature covers encrypted data + IV + timestamp + fingerprint to ensure integrity
  const signature = generateSignature(encrypted + iv + timestamp + deviceFingerprint, key);
  
  return {
    configId: generateConfigId(),
    encryptedData: encrypted,
    iv,
    signature,
    timestamp,
    deviceFingerprint
  };
}

/**
 * 解密配置文件
 */
export function decryptConfig(encryptedConfig: {
  encryptedData: string;
  iv: string;
  signature: string;
  timestamp: number;
  deviceFingerprint: string;
}, expectedDeviceFingerprint: string): {
  apiKey: string;
  modelType: string;
  deviceFingerprint: string;
  timestamp: number;
  expiresAt: number;
} {
  const key = deriveKey(encryptedConfig.deviceFingerprint, encryptedConfig.timestamp);
  
  // 验证设备指纹
  if (encryptedConfig.deviceFingerprint !== expectedDeviceFingerprint) {
    throw new Error('设备指纹不匹配');
  }
  
  // 验证数字签名
  const dataToVerify = encryptedConfig.encryptedData + encryptedConfig.iv + 
                      encryptedConfig.timestamp + encryptedConfig.deviceFingerprint;
  if (!verifySignature(dataToVerify, encryptedConfig.signature, key)) {
    throw new Error('数字签名验证失败');
  }
  
  // 验证时间戳（防止重放攻击）
  const now = Date.now();
  if (Math.abs(now - encryptedConfig.timestamp) > 5 * 60 * 1000) { // 5分钟有效期
    throw new Error('配置文件已过期');
  }
  
  // 解密数据
  const decryptedData = decrypt({
    encrypted: encryptedConfig.encryptedData,
    iv: encryptedConfig.iv
  }, key);
  
  const config = JSON.parse(decryptedData);
  
  // 验证配置文件过期时间
  if (now > config.expiresAt) {
    throw new Error('配置文件已过期');
  }
  
  return config;
}

/**
 * 生成安全的随机字符串
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 哈希函数（用于设备指纹等）
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
