// Environment Variable Validation Logic
// Enforces security best practices and prevents hardcoded secrets

export function validateEnv() {
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'NEXT_PUBLIC_BASE_URL',
    // Add other critical variables here
  ];

  const missingVars = requiredVars.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === ''
  );

  if (missingVars.length > 0) {
    throw new Error(
      `FATAL ERROR: Missing critical environment variables: ${missingVars.join(
        ', '
      )}. Please configure them in your .env file.`
    );
  }

  // Security Check: JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET || '';
  if (
    jwtSecret === 'your-secret-key' ||
    jwtSecret === 'jarvis-dev-secret' ||
    jwtSecret.length < 32
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL SECURITY ERROR: JWT_SECRET is too weak or using a default value in production. It must be at least 32 characters long and random.'
      );
    } else {
      
    }
  }
}

// Helper to get environment variables with type safety
export const env = {
  get JWT_SECRET() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Should be caught by validateEnv() on startup, but fail safe here
      throw new Error('JWT_SECRET is not defined');
    }
    return secret;
  },

  get NEXT_PUBLIC_BASE_URL() {
    const url = process.env.NEXT_PUBLIC_BASE_URL;
    if (!url) throw new Error('NEXT_PUBLIC_BASE_URL is not defined');
    return url;
  },
  
  get PKG_SIGN_SECRET() {
     return process.env.PKG_SIGN_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('PKG_SIGN_SECRET missing in production') })() : 'dev-pkg-secret');
  },

  get PKG_RSA_PUBLIC_PEM() {
    return process.env.PKG_RSA_PUBLIC_PEM;
  },
  
  get PKG_RSA_PRIVATE_PEM() {
    return process.env.PKG_RSA_PRIVATE_PEM;
  },
  
  get PKG_RSA_PUBLIC_PEM_ID() {
    return process.env.PKG_RSA_PUBLIC_PEM_ID;
  }
};
