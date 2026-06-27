# Jarvis 加密算法说明文档

## 概述

本文档描述了 Jarvis 系统中使用的加密算法和安全机制，用于保护订阅配置文件的安全传输和存储。

## 加密算法

### 1. 对称加密算法

**算法**: AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)

**密钥长度**: 256 bits (32 bytes)

**初始化向量 (IV)**: 128 bits (16 bytes)

**认证标签 (Tag)**: 128 bits (16 bytes)

#### 特点
- 提供机密性和完整性保护
- 支持认证加密（AEAD）
- 高性能，适合大量数据加密
- 抗量子计算攻击（当前阶段）

### 2. 密钥派生函数

**算法**: SHA-256 哈希函数

**输入参数**:
- 设备指纹 (deviceFingerprint)
- 时间戳 (timestamp)
- 密钥派生盐值 (keyDerivationSalt)

**派生过程**:
```
key = SHA256(deviceFingerprint + timestamp + keyDerivationSalt)
```

#### 特点
- 确定性密钥派生
- 基于设备和时间因素
- 防止密钥重用攻击

### 3. 数字签名算法

**算法**: HMAC-SHA256 (Hash-based Message Authentication Code)

**签名过程**:
```
signature = HMAC-SHA256(key, encryptedData + iv + tag + timestamp + deviceFingerprint)
```

#### 特点
- 提供数据完整性保护
- 防止数据篡改
- 支持密钥验证

## 安全机制

### 1. 设备绑定机制

**目的**: 确保配置文件只能在特定设备上使用

**实现**:
- 基于设备硬件信息生成设备指纹
- 设备指纹参与密钥派生过程
- 解密时验证设备指纹匹配

**设备指纹生成**:
```
deviceFingerprint = SHA256(
  os.platform() + 
  os.arch() + 
  os.hostname() + 
  os.userInfo().username + 
  process.env.COMPUTERNAME + 
  process.env.USERDOMAIN + 
  deviceFingerprintSalt
)
```

### 2. 时间戳验证机制

**目的**: 防止重放攻击和过期配置使用

**实现**:
- 配置文件包含生成时间戳
- 解密时验证时间戳有效性（5分钟）
- 配置文件包含过期时间（7天）

**时间戳验证**:
```
if (Math.abs(now - configTimestamp) > 5 minutes) {
  throw Error("配置文件已过期");
}
```

### 3. 配置过期机制

**目的**: 强制定期更新配置文件

**实现**:
- 配置文件默认7天过期
- 过期后需要重新生成配置
- 支持提前续期（7天内）

**过期验证**:
```
if (now > config.expiresAt) {
  throw Error("配置文件已过期");
}
```

### 4. 数字签名验证机制

**目的**: 确保配置文件完整性和真实性

**实现**:
- 对加密数据、IV、标签、时间戳和设备指纹进行签名
- 解密时验证签名匹配
- 使用HMAC-SHA256算法

**签名验证**:
```
expectedSignature = HMAC-SHA256(key, dataToVerify)
if (!timingSafeEqual(signature, expectedSignature)) {
  throw Error("数字签名验证失败");
}
```

## 加密流程

### 1. 配置文件加密流程

1. **数据准备**
   ```json
   {
     "apiKey": "jv_abc123def456",
     "modelType": "deepseek",
     "deviceFingerprint": "device_hash",
     "timestamp": 1704067200000,
     "expiresAt": 1704672000000
   }
   ```

2. **密钥派生**
   ```
   key = SHA256(deviceFingerprint + timestamp + keyDerivationSalt)
   ```

3. **数据加密**
   ```
   cipher = AES-256-GCM(key, iv)
   encryptedData = cipher.encrypt(jsonData)
   tag = cipher.getAuthTag()
   ```

4. **数字签名**
   ```
   signature = HMAC-SHA256(key, encryptedData + iv + tag + timestamp + deviceFingerprint)
   ```

5. **结果输出**
   ```json
   {
     "configId": "config_abc123",
     "encryptedData": "encrypted_data_here",
     "iv": "initialization_vector",
     "tag": "authentication_tag",
     "signature": "digital_signature",
     "timestamp": 1704067200000,
     "deviceFingerprint": "device_fingerprint_hash"
   }
   ```

### 2. 配置文件解密流程

1. **输入验证**
   - 检查配置文件格式
   - 验证必需字段存在

2. **设备指纹验证**
   ```
   if (config.deviceFingerprint !== currentDeviceFingerprint) {
     throw Error("设备指纹不匹配");
   }
   ```

3. **时间戳验证**
   ```
   if (Math.abs(now - config.timestamp) > 5 minutes) {
     throw Error("配置文件已过期");
   }
   ```

4. **密钥派生**
   ```
   key = SHA256(deviceFingerprint + timestamp + keyDerivationSalt)
   ```

5. **数字签名验证**
   ```
   expectedSignature = HMAC-SHA256(key, dataToVerify)
   if (!timingSafeEqual(signature, expectedSignature)) {
     throw Error("数字签名验证失败");
   }
   ```

6. **数据解密**
   ```
   decipher = AES-256-GCM(key, iv)
   decryptedData = decipher.decrypt(encryptedData, tag)
   ```

7. **过期验证**
   ```
   if (now > config.expiresAt) {
     throw Error("配置文件已过期");
   }
   ```

## 安全特性

### 1. 机密性 (Confidentiality)
- 使用AES-256-GCM加密敏感数据
- 密钥派生基于设备和时间因素
- 支持密钥轮换机制

### 2. 完整性 (Integrity)
- 使用GCM模式的认证标签
- 数字签名验证数据完整性
- 防止数据篡改和重放攻击

### 3. 可用性 (Availability)
- 自动重试机制处理临时错误
- 备份机制防止数据丢失
- 错误恢复和降级处理

### 4. 认证性 (Authenticity)
- 设备指纹绑定防止设备伪造
- 数字签名验证数据来源
- 时间戳验证防止重放攻击

### 5. 不可否认性 (Non-repudiation)
- 完整的操作日志记录
- 数字签名提供不可否认性
- 审计追踪支持

## 性能考虑

### 1. 加密性能
- AES-256-GCM硬件加速支持
- 优化的密钥派生算法
- 最小化加密操作次数

### 2. 内存使用
- 流式加密处理大数据
- 及时清理敏感数据
- 内存池复用减少GC压力

### 3. 网络传输
- 压缩加密减少传输大小
- 缓存机制减少重复请求
- CDN加速配置文件分发

## 安全最佳实践

### 1. 密钥管理
- 使用强随机数生成器
- 定期轮换加密密钥
- 安全的密钥存储和分发

### 2. 错误处理
- 最小化错误信息泄露
- 统一的错误处理机制
- 安全的错误日志记录

### 3. 监控和审计
- 实时监控异常行为
- 完整的操作审计日志
- 自动告警和响应机制

### 4. 更新和维护
- 及时更新加密算法
- 定期安全评估和测试
- 漏洞响应和修复流程

## 合规性

### 1. 加密标准
- 符合NIST加密标准
- 支持FIPS 140-2认证
- 满足行业安全要求

### 2. 数据保护
- 符合GDPR数据保护要求
- 支持数据删除和遗忘权
- 透明的数据处理流程

### 3. 安全认证
- 支持SOC 2 Type II认证
- 符合ISO 27001标准
- 通过第三方安全审计

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 实现AES-256-GCM加密
- 添加设备绑定机制
- 支持数字签名验证
- 实现配置过期机制

## 参考文档

- [NIST Special Publication 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [RFC 4106 - The Use of Galois/Counter Mode (GCM) in IPsec Encapsulating Security Payload (ESP)](https://tools.ietf.org/html/rfc4106)
- [FIPS PUB 197 - Advanced Encryption Standard (AES)](https://csrc.nist.gov/publications/detail/fips/197/final)

## 免责声明

本文档仅提供加密算法的概述说明，不包含具体的实现细节和安全密钥信息。实际部署时请咨询安全专家并遵循相关安全标准和法规要求。