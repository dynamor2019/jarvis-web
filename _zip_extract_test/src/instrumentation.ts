export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env');
    try {
      validateEnv();
      
    } catch (error) {
      
      // In production, we might want to exit. In dev, we just log error.
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}
