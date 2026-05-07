const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Force using the specific database file
process.env.DATABASE_URL = `file:${path.join(__dirname, '../prisma/jarvis.db')}`;

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Cleaning up existing test data...');
    // Clean up existing admin user if exists
    const adminEmail = 'admin@jarvis.ai';
    
    // Create or update admin user
    console.log('Creating/Updating admin user...');
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'admin',
        username: 'admin',
        referralCode: 'ADMIN'
      },
      create: {
        email: adminEmail,
        username: 'admin',
        password: 'password_hash_placeholder', // In real app, this should be hashed
        name: 'System Admin',
        role: 'admin',
        referralCode: 'ADMIN'
      },
    });
    console.log('Admin user ready:', admin.id);

    // Create a specific referral code that the user mentioned
    // Code: admin-QL2KS1-20251222174436
    const targetCode = 'admin-QL2KS1-20251222174436';
    
    console.log(`Creating referral code: ${targetCode}`);
    
    await prisma.referralCode.upsert({
      where: { code: targetCode },
      update: {
        creatorId: admin.id,
        maxUses: 100,
      },
      create: {
        code: targetCode,
        creatorId: admin.id,
        maxUses: 100,
        uses: 0,
        source: 'manual_test'
      }
    });
    
    console.log('Referral code created successfully');

    // Verify
    const verify = await prisma.referralCode.findUnique({
      where: { code: targetCode }
    });
    console.log('Verification:', verify);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
