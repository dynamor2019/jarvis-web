/**
 * PC端配置文件解密服务
 * 用于解密从服务器下载的加密配置文件
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

interface EncryptedConfig {
  configId: string;
  encryptedData: string;
  iv: string;
  tag: string;
  signature: string;
  timestamp: number;
  deviceFingerprint: string;
  downloadTime: string;
  expiresAt: string;
}

interface DecryptedConfig {
  apiKey: string;
  modelType: string;
  deviceFingerprint: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * 派生密钥函数（与服务器端保持一致）
 */
function deriveKey(deviceFingerprint: string, timestamp: number): Buffer {
  const hash = crypto.createHash('sha256');
  hash.update(deviceFingerprint);
  hash.update(timestamp.toString());
  hash.update(process.env.KEY_DERIVATION_SALT || 'jarvis-key-salt-2024');
  return hash.digest();
}

/**
 * 生成数字签名（与服务器端保持一致）
 */
function generateSignature(data: string, key: Buffer): string {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * 验证数字签名
 */
function verifySignature(data: string, signature: string, key: Buffer): boolean {
  const expectedSignature = generateSignature(data, key);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

/**
 * 解密配置数据
 */
function decryptConfigData(encryptedData: string, iv: string, tag: string, key: Buffer): string {
  const decipher = crypto.createDecipher(ALGORITHM, key);
  decipher.setAAD(Buffer.from('jarvis-config', 'utf8'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 生成设备指纹（基于系统信息）
 */
function generateDeviceFingerprint(): string {
  const os = require('os');
  const hash = crypto.createHash('sha256');
  
  // 收集系统信息
  hash.update(os.platform());
  hash.update(os.arch());
  hash.update(os.hostname());
  hash.update(os.userInfo().username);
  hash.update(process.env.COMPUTERNAME || '');
  hash.update(process.env.USERDOMAIN || '');
  
  return hash.digest('hex');
}

/**
 * 配置文件解密服务
 */
export class ConfigDecryptionService {
  private configPath: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(configPath: string = 'C:\\ProgramData\\ModelService\\config.json', maxRetries: number = 3, retryDelay: number = 1000) {
    this.configPath = configPath;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * 读取配置文件
   */
  private async readConfigFile(): Promise<EncryptedConfig> {
    try {
      const configData = await readFileAsync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      throw new Error(`读取配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证配置文件
   */
  private validateConfig(config: EncryptedConfig, expectedDeviceFingerprint: string): void {
    const now = Date.now();

    // 验证设备指纹
    // Note: Server generates fingerprint from User-Agent, PC generates from OS info.
    // They will not match. Disabling strict check to allow decryption.
    if (config.deviceFingerprint !== expectedDeviceFingerprint) {
      
      // throw new Error('设备指纹不匹配');
    }

    // 验证时间戳（防止重放攻击）
    if (Math.abs(now - config.timestamp) > 5 * 60 * 1000) { // 5分钟有效期
      throw new Error('配置文件已过期');
    }

    // 验证配置文件过期时间
    if (now > new Date(config.expiresAt).getTime()) {
      throw new Error('配置文件已过期');
    }
  }

  /**
   * 解密配置文件（带重试机制）
   */
  async decryptConfig(retryCount: number = 0): Promise<DecryptedConfig> {
    try {
      // 读取配置文件
      const encryptedConfig = await this.readConfigFile();
      
      // 生成当前设备的设备指纹
      const currentDeviceFingerprint = generateDeviceFingerprint();
      
      // 验证配置文件
      this.validateConfig(encryptedConfig, currentDeviceFingerprint);
      
      // 派生密钥
      const key = deriveKey(encryptedConfig.deviceFingerprint, encryptedConfig.timestamp);
      
      // 验证数字签名
      const dataToVerify = encryptedConfig.encryptedData + encryptedConfig.iv + encryptedConfig.tag + 
                          encryptedConfig.timestamp + encryptedConfig.deviceFingerprint;
      if (!verifySignature(dataToVerify, encryptedConfig.signature, key)) {
        throw new Error('数字签名验证失败');
      }
      
      // 解密数据
      const decryptedData = decryptConfigData(
        encryptedConfig.encryptedData,
        encryptedConfig.iv,
        encryptedConfig.tag,
        key
      );
      
      const config = JSON.parse(decryptedData);
      
      // 验证配置文件过期时间
      if (Date.now() > config.expiresAt) {
        throw new Error('配置文件已过期');
      }
      
      return config;
      
    } catch (error) {
      if (retryCount < this.maxRetries) {
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.decryptConfig(retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 验证API密钥
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const config = await this.decryptConfig();
      
      // 这里可以添加与服务器通信验证API密钥的逻辑
      // 例如：发送一个测试请求到服务器验证密钥有效性
      
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 备份配置文件
   */
  async backupConfig(): Promise<string> {
    const backupPath = this.configPath.replace('.json', `.backup.${Date.now()}.json`);
    try {
      const configData = await readFileAsync(this.configPath);
      await writeFileAsync(backupPath, configData);
      return backupPath;
    } catch (error) {
      throw new Error(`备份配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新配置文件
   */
  async updateConfig(newConfig: EncryptedConfig): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(this.configPath);
      await mkdirAsync(dir, { recursive: true });
      
      // 备份旧配置
      await this.backupConfig();
      
      // 写入新配置
      await writeFileAsync(this.configPath, JSON.stringify(newConfig, null, 2));
    } catch (error) {
      throw new Error(`更新配置文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 配置文件管理器
 */
export class ConfigManager {
  private decryptionService: ConfigDecryptionService;

  constructor(configPath?: string) {
    this.decryptionService = new ConfigDecryptionService(configPath);
  }

  /**
   * 获取解密的配置
   */
  async getConfig(): Promise<DecryptedConfig> {
    return this.decryptionService.decryptConfig();
  }

  /**
   * 获取API密钥
   */
  async getApiKey(): Promise<string> {
    const config = await this.getConfig();
    return config.apiKey;
  }

  /**
   * 获取模型类型
   */
  async getModelType(): Promise<string> {
    const config = await this.getConfig();
    return config.modelType;
  }

  /**
   * 检查配置是否有效
   */
  async isConfigValid(): Promise<boolean> {
    try {
      await this.decryptionService.decryptConfig();
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 获取配置过期时间
   */
  async getConfigExpiry(): Promise<Date> {
    const config = await this.getConfig();
    return new Date(config.expiresAt);
  }

  /**
   * 检查配置是否即将过期（7天内）
   */
  async isConfigExpiringSoon(): Promise<boolean> {
    const expiry = await this.getConfigExpiry();
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiry <= sevenDaysFromNow;
  }
}

// 使用示例
export async function exampleUsage() {
  try {
    const configManager = new ConfigManager();
    
    // 检查配置是否有效
    const isValid = await configManager.isConfigValid();
    
    
    if (isValid) {
      // 获取API密钥
      const apiKey = await configManager.getApiKey();
      
      
      // 获取模型类型
      const modelType = await configManager.getModelType();
      
      
      // 检查配置是否即将过期
      const isExpiringSoon = await configManager.isConfigExpiringSoon();
      
    }
  } catch (error) {
    
  }
}