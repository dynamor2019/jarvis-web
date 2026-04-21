// Quick test to decode the encrypted data from the config file
const encryptedData = "ewogICAgImFwaUtleSI6ICJqdl90ZXN0X2RlZXBzZWVrXzQzMTI4N19rZXkiLAogICAgIm1vZGVsVHlwZSI6ICJkZWVwc2VlayIsCiAgICAidXNlcklkIjogInRlc3RfdXNlciIsCiAgICAiZXhwaXJlc0F0IjogIjIwMjYtMDItMTlUMTE6MzI6MDkuMTM2Mzg0OSswODowMCIKfQ==";

try {
  const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8');
  const parsed = JSON.parse(decoded);
  
  console.log('✅ Decoded config data:');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('\n✅ API Key extracted:', parsed.apiKey);
  console.log('✅ Model Type:', parsed.modelType);
  console.log('✅ User ID:', parsed.userId);
  console.log('✅ Expires At:', parsed.expiresAt);
} catch (error) {
  console.error('❌ Failed to decode:', error.message);
}