# Jarvis 订阅配置 API 文档

## 概述

本文档描述了 Jarvis 订阅配置相关的 API 接口，用于生成、下载和管理用户的订阅配置文件。

## 基础信息

- **Base URL**: `https://your-domain.com/api`
- **认证方式**: Bearer Token
- **Content-Type**: `application/json`
- **响应格式**: JSON

## 认证

所有 API 请求都需要在请求头中包含有效的 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

## API 端点

### 1. 生成订阅配置

生成加密的订阅配置文件，包含 API 密钥和模型信息。

**POST** `/subscription/config/generate`

#### 请求参数

```json
{
  "orderId": "order_123456",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080",
    "timezone": "Asia/Shanghai",
    "language": "zh-CN"
  }
}
```

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID |
| deviceInfo | object | 否 | 设备信息 |
| deviceInfo.userAgent | string | 否 | 用户代理字符串 |
| deviceInfo.screenResolution | string | 否 | 屏幕分辨率 |
| deviceInfo.timezone | string | 否 | 时区 |
| deviceInfo.language | string | 否 | 语言 |

#### 响应示例

**成功响应 (200)**

```json
{
  "success": true,
  "config": {
    "configId": "config_abc123",
    "encryptedData": "encrypted_data_here",
    "iv": "initialization_vector",
    "tag": "authentication_tag",
    "signature": "digital_signature",
    "timestamp": 1704067200000,
    "deviceFingerprint": "device_fingerprint_hash",
    "downloadUrl": "/api/subscription/config/config_abc123/download"
  },
  "apiKey": {
    "id": "key_123",
    "modelType": "deepseek",
    "expiresAt": "2024-01-12T00:00:00.000Z"
  }
}
```

**错误响应 (400)**

```json
{
  "success": false,
  "error": "缺少订单ID"
}
```

**错误响应 (401)**

```json
{
  "success": false,
  "error": "未授权访问"
}
```

**错误响应 (404)**

```json
{
  "success": false,
  "error": "订单不存在或无权限"
}
```

**错误响应 (410)**

```json
{
  "success": false,
  "error": "订单未支付"
}
```

### 2. 下载订阅配置

下载加密的订阅配置文件。

**GET** `/subscription/config/{configId}/download`

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| configId | string | 是 | 配置ID |

#### 响应示例

**成功响应 (200)**

响应头：
```http
Content-Type: application/json
Content-Disposition: attachment; filename="jarvis-config-config_abc123.json"
Cache-Control: no-cache, no-store, must-revalidate
```

响应体：
```json
{
  "configId": "config_abc123",
  "encryptedData": "encrypted_data_here",
  "iv": "initialization_vector",
  "tag": "authentication_tag",
  "signature": "digital_signature",
  "timestamp": 1704067200000,
  "deviceFingerprint": "device_fingerprint_hash",
  "downloadTime": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

**错误响应 (401)**

```json
{
  "success": false,
  "error": "未授权访问"
}
```

**错误响应 (404)**

```json
{
  "success": false,
  "error": "配置不存在或无权限"
}
```

**错误响应 (410)**

```json
{
  "success": false,
  "error": "配置已过期"
}
```

### 3. 验证 API 密钥

验证 API 密钥的有效性。

**POST** `/api/validate-key`

#### 请求参数

```json
{
  "apiKey": "jv_abc123def456",
  "deviceFingerprint": "device_fingerprint_hash"
}
```

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| apiKey | string | 是 | API 密钥 |
| deviceFingerprint | string | 否 | 设备指纹 |

#### 响应示例

**成功响应 (200)**

```json
{
  "success": true,
  "data": {
    "id": "key_123",
    "userId": "user_456",
    "modelType": "deepseek",
    "isActive": true,
    "expiresAt": "2024-01-12T00:00:00.000Z",
    "deviceFingerprint": "device_fingerprint_hash",
    "usageCount": 42,
    "lastUsedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误响应 (401)**

```json
{
  "success": false,
  "error": "API 密钥无效或已过期"
}
```

## 数据模型

### 配置对象 (Config)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| configId | string | 配置唯一标识符 |
| encryptedData | string | 加密的数据 |
| iv | string | 初始化向量 |
| tag | string | 认证标签 |
| signature | string | 数字签名 |
| timestamp | number | 时间戳 |
| deviceFingerprint | string | 设备指纹 |
| downloadUrl | string | 下载链接 |

### API 密钥对象 (ApiKey)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 密钥ID |
| userId | string | 用户ID |
| modelType | string | 模型类型 |
| isActive | boolean | 是否激活 |
| expiresAt | string | 过期时间 |
| deviceFingerprint | string | 设备指纹 |
| usageCount | number | 使用次数 |
| lastUsedAt | string | 最后使用时间 |

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| missing_order_id | 缺少订单ID |
| order_not_found | 订单不存在 |
| order_not_paid | 订单未支付 |
| config_not_found | 配置不存在 |
| config_expired | 配置已过期 |
| unauthorized | 未授权访问 |
| internal_error | 服务器内部错误 |

## 安全说明

1. **加密算法**: 使用 AES-256-GCM 加密算法
2. **设备绑定**: 配置文件与设备指纹绑定
3. **数字签名**: 配置文件包含数字签名，防止篡改
4. **有效期**: 配置文件默认 7 天过期
5. **重放保护**: 时间戳验证，防止重放攻击

## 使用示例

### JavaScript/TypeScript

```typescript
// 生成配置
const generateConfig = async () => {
  const response = await fetch('/api/subscription/config/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderId: 'order_123456',
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // 下载配置文件
    window.open(data.config.downloadUrl, '_blank');
  }
};
```

### cURL

```bash
# 生成配置
curl -X POST https://your-domain.com/api/subscription/config/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "orderId": "order_123456",
    "deviceInfo": {
      "userAgent": "Mozilla/5.0...",
      "screenResolution": "1920x1080",
      "timezone": "Asia/Shanghai",
      "language": "zh-CN"
    }
  }'

# 下载配置
curl -X GET https://your-domain.com/api/subscription/config/config_abc123/download \
  -H "Authorization: Bearer your-jwt-token" \
  -o config.json
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持配置生成和下载
- 实现设备指纹绑定
- 添加数字签名验证

## 支持与联系

如有问题，请联系技术支持或提交Issue。