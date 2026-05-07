/**
 * PC端配置文件解密服务
 * C#客户端使用的解密算法
 */

using System;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;

namespace Jarvis.ModelService
{
    /// <summary>
    /// 配置文件解密器
    /// </summary>
    public class ConfigDecryptor
    {
        private const string ALGORITHM = "AES-256-GCM";
        private const int KEY_LENGTH = 32; // 256 bits
        private const int IV_LENGTH = 16; // 128 bits
        private const int TAG_LENGTH = 16; // 128 bits
        private const string AAD = "jarvis-config";
        private const int MAX_RETRY_ATTEMPTS = 3;

        /// <summary>
        /// 配置数据模型
        /// </summary>
        public class ConfigData
        {
            public string ApiKey { get; set; }
            public string ModelType { get; set; }
            public string DeviceFingerprint { get; set; }
            public long Timestamp { get; set; }
            public long ExpiresAt { get; set; }
        }

        /// <summary>
        /// 加密配置模型
        /// </summary>
        public class EncryptedConfig
        {
            public string ConfigId { get; set; }
            public string EncryptedData { get; set; }
            public string Iv { get; set; }
            public string Tag { get; set; }
            public string Signature { get; set; }
            public long Timestamp { get; set; }
            public string DeviceFingerprint { get; set; }
        }

        /// <summary>
        /// 使用设备指纹和时间戳生成派生密钥
        /// </summary>
        private byte[] DeriveKey(string deviceFingerprint, long timestamp)
        {
            using (var sha256 = SHA256.Create())
            {
                var data = Encoding.UTF8.GetBytes(deviceFingerprint + timestamp + GetSalt());
                return sha256.ComputeHash(data);
            }
        }

        /// <summary>
        /// 生成数字签名
        /// </summary>
        private string GenerateSignature(string data, byte[] key)
        {
            using (var hmac = new HMACSHA256(key))
            {
                var dataBytes = Encoding.UTF8.GetBytes(data);
                var hash = hmac.ComputeHash(dataBytes);
                return Convert.ToHexString(hash).ToLower();
            }
        }

        /// <summary>
        /// 验证数字签名
        /// </summary>
        private bool VerifySignature(string data, string signature, byte[] key)
        {
            var expectedSignature = GenerateSignature(data, key);
            return string.Equals(expectedSignature, signature, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// 解密配置数据（带重试机制）
        /// </summary>
        public ConfigData DecryptConfig(EncryptedConfig encryptedConfig, string expectedDeviceFingerprint)
        {
            int attempts = 0;
            Exception lastException = null;

            while (attempts < MAX_RETRY_ATTEMPTS)
            {
                try
                {
                    return DecryptConfigInternal(encryptedConfig, expectedDeviceFingerprint);
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    attempts++;
                    
                    if (attempts < MAX_RETRY_ATTEMPTS)
                    {
                        // 等待一段时间后重试
                        System.Threading.Thread.Sleep(1000 * attempts);
                    }
                }
            }

            throw new Exception($"配置解密失败，已重试{MAX_RETRY_ATTEMPTS}次。最后一次错误：{lastException?.Message}");
        }

        /// <summary>
        /// 内部解密方法
        /// </summary>
        private ConfigData DecryptConfigInternal(EncryptedConfig encryptedConfig, string expectedDeviceFingerprint)
        {
            // 验证设备指纹
            if (encryptedConfig.DeviceFingerprint != expectedDeviceFingerprint)
            {
                throw new Exception("设备指纹不匹配");
            }

            // 生成派生密钥
            var key = DeriveKey(encryptedConfig.DeviceFingerprint, encryptedConfig.Timestamp);

            // 验证数字签名
            var dataToVerify = encryptedConfig.EncryptedData + encryptedConfig.Iv + encryptedConfig.Tag + 
                             encryptedConfig.Timestamp + encryptedConfig.DeviceFingerprint;
            if (!VerifySignature(dataToVerify, encryptedConfig.Signature, key))
            {
                throw new Exception("数字签名验证失败");
            }

            // 验证时间戳（防止重放攻击）
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (Math.Abs(now - encryptedConfig.Timestamp) > 5 * 60 * 1000) // 5分钟有效期
            {
                throw new Exception("配置文件已过期");
            }

            // 解密数据
            var decryptedData = DecryptData(encryptedConfig, key);
            var config = JsonConvert.DeserializeObject<ConfigData>(decryptedData);

            // 验证配置文件过期时间
            if (now > config.ExpiresAt)
            {
                throw new Exception("配置文件已过期");
            }

            return config;
        }

        /// <summary>
        /// 使用AES-256-GCM解密数据
        /// </summary>
        private string DecryptData(EncryptedConfig encryptedConfig, byte[] key)
        {
            try
            {
                var encryptedBytes = Convert.FromHexString(encryptedConfig.EncryptedData);
                var iv = Convert.FromHexString(encryptedConfig.Iv);
                var tag = Convert.FromHexString(encryptedConfig.Tag);

                using (var aes = new AesGcm(key))
                {
                    var plaintextBytes = new byte[encryptedBytes.Length];
                    var aadBytes = Encoding.UTF8.GetBytes(AAD);

                    aes.Decrypt(iv, encryptedBytes, tag, plaintextBytes, aadBytes);
                    return Encoding.UTF8.GetString(plaintextBytes);
                }
            }
            catch (CryptographicException ex)
            {
                throw new Exception($"AES解密失败：{ex.Message}");
            }
        }

        /// <summary>
        /// 获取盐值（从配置文件或环境变量）
        /// </summary>
        private string GetSalt()
        {
            // 实际实现中应该从配置文件或环境变量读取
            return "jarvis-key-salt-2024";
        }

        /// <summary>
        /// 验证API密钥有效性
        /// </summary>
        public async Task<bool> ValidateApiKey(string apiKey, string modelType)
        {
            try
            {
                // 这里应该调用后端API验证密钥
                // 示例实现：
                var validationService = new ApiKeyValidationService();
                return await validationService.ValidateApiKey(apiKey, modelType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"API密钥验证失败：{ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// 生成设备指纹
        /// </summary>
        public string GenerateDeviceFingerprint(string userAgent, long timestamp)
        {
            using (var sha256 = SHA256.Create())
            {
                var data = Encoding.UTF8.GetBytes(userAgent + timestamp + GetDeviceSalt());
                var hash = sha256.ComputeHash(data);
                return Convert.ToHexString(hash).ToLower();
            }
        }

        /// <summary>
        /// 获取设备盐值
        /// </summary>
        private string GetDeviceSalt()
        {
            // 实际实现中应该从配置文件或环境变量读取
            return "jarvis-device-salt-2024";
        }
    }

    /// <summary>
    /// API密钥验证服务
    /// </summary>
    public class ApiKeyValidationService
    {
        private readonly HttpClient _httpClient;

        public ApiKeyValidationService()
        {
            _httpClient = new HttpClient();
        }

        /// <summary>
        /// 验证API密钥
        /// </summary>
        public async Task<bool> ValidateApiKey(string apiKey, string modelType)
        {
            try
            {
                var requestData = new
                {
                    apiKey,
                    modelType,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                var json = JsonConvert.SerializeObject(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("https://api.jarvis.com/validate-api-key", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<dynamic>(responseContent);
                    return result?.success == true;
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"API验证请求失败：{ex.Message}");
                return false;
            }
        }
    }
}