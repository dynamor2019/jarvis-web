# Jarvis 订阅配置文件解密服务

## 功能概述

该服务用于解密从服务器下载的加密配置文件，包含API密钥和模型信息。

## 安装和配置

### 1. 安装依赖

```bash
npm install crypto fs path util
```

### 2. 配置文件路径

默认配置文件路径：`C:\ProgramData\ModelService\config.json`

### 3. 环境变量设置

```bash
# 密钥派生盐值（必须与服务器端一致）
KEY_DERIVATION_SALT=jarvis-key-salt-2024

# 设备指纹盐值（必须与服务器端一致）
DEVICE_FINGERPRINT_SALT=jarvis-device-salt-2024
```

## 使用方法

### 基本使用

```typescript
import { ConfigManager } from './pcConfigService';

async function main() {
  try {
    const configManager = new ConfigManager();
    
    // 检查配置是否有效
    const isValid = await configManager.isConfigValid();
    console.log('配置有效:', isValid);
    
    if (isValid) {
      // 获取API密钥
      const apiKey = await configManager.getApiKey();
      console.log('API密钥:', apiKey);
      
      // 获取模型类型
      const modelType = await configManager.getModelType();
      console.log('模型类型:', modelType);
      
      // 检查配置是否即将过期
      const isExpiringSoon = await configManager.isConfigExpiringSoon();
      console.log('配置即将过期:', isExpiringSoon);
    }
  } catch (error) {
    console.error('配置管理错误:', error);
  }
}

main();
```

### 高级使用

```typescript
import { ConfigDecryptionService } from './pcConfigService';

async function advancedUsage() {
  try {
    // 创建解密服务实例
    const decryptionService = new ConfigDecryptionService(
      'C:\\custom\\path\\config.json',  // 自定义配置文件路径
      5,  // 最大重试次数
      2000  // 重试延迟（毫秒）
    );
    
    // 解密配置（带重试机制）
    const config = await decryptionService.decryptConfig();
    console.log('解密后的配置:', config);
    
    // 备份配置文件
    const backupPath = await decryptionService.backupConfig();
    console.log('备份文件路径:', backupPath);
    
    // 更新配置文件
    await decryptionService.updateConfig(newEncryptedConfig);
    console.log('配置文件已更新');
    
  } catch (error) {
    console.error('高级使用错误:', error);
  }
}
```

## API 参考

### ConfigManager 类

#### 方法

- `isConfigValid(): Promise<boolean>` - 检查配置是否有效
- `getApiKey(): Promise<string>` - 获取API密钥
- `getModelType(): Promise<string>` - 获取模型类型
- `getConfigExpiry(): Promise<Date>` - 获取配置过期时间
- `isConfigExpiringSoon(): Promise<boolean>` - 检查配置是否即将过期

### ConfigDecryptionService 类

#### 构造函数参数

- `configPath: string` - 配置文件路径（可选，默认：`C:\ProgramData\ModelService\config.json`）
- `maxRetries: number` - 最大重试次数（可选，默认：3）
- `retryDelay: number` - 重试延迟（毫秒，可选，默认：1000）

#### 方法

- `decryptConfig(retryCount?: number): Promise<DecryptedConfig>` - 解密配置（带重试机制）
- `validateApiKey(): Promise<boolean>` - 验证API密钥
- `backupConfig(): Promise<string>` - 备份配置文件
- `updateConfig(newConfig: EncryptedConfig): Promise<void>` - 更新配置文件

## 错误处理

### 常见错误

1. **设备指纹不匹配**
   - 原因：配置文件与当前设备不匹配
   - 解决方案：重新下载配置文件

2. **数字签名验证失败**
   - 原因：配置文件被篡改
   - 解决方案：重新下载配置文件

3. **配置文件已过期**
   - 原因：配置文件超过5分钟有效期
   - 解决方案：重新下载配置文件

4. **解密失败**
   - 原因：配置文件损坏或密钥错误
   - 解决方案：重试解密（自动重试3次）或重新下载配置文件

### 错误代码

```typescript
interface ConfigError {
  code: string;
  message: string;
  details?: any;
}

// 错误代码示例
const errors = {
  DEVICE_FINGERPRINT_MISMATCH: '设备指纹不匹配',
  SIGNATURE_VERIFICATION_FAILED: '数字签名验证失败',
  CONFIG_EXPIRED: '配置文件已过期',
  DECRYPTION_FAILED: '解密失败',
  FILE_NOT_FOUND: '配置文件不存在',
  INVALID_CONFIG_FORMAT: '配置文件格式错误'
};
```

## 安全特性

1. **AES-256-GCM 加密** - 使用行业标准的加密算法
2. **设备指纹绑定** - 配置文件只能用于特定设备
3. **数字签名验证** - 防止配置文件被篡改
4. **时间戳验证** - 防止重放攻击
5. **自动重试机制** - 处理临时性错误
6. **备份机制** - 更新配置前自动备份

## 性能优化

1. **缓存机制** - 解密后的配置可以缓存
2. **异步操作** - 所有文件操作都是异步的
3. **错误重试** - 自动重试失败的解密操作
4. **内存管理** - 及时清理敏感数据

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持基本的配置文件解密
- 实现设备指纹验证
- 添加数字签名验证
- 实现自动重试机制

## 支持与联系

如有问题，请联系技术支持或提交Issue。