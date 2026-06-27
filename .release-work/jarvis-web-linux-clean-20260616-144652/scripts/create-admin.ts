
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@jarvis.com';
  const username = 'admin';
  const passwordRaw = 'admin123456';
  const passwordHash = await bcrypt.hash(passwordRaw, 10);

  console.log(`Creating/Updating admin user...`);
  console.log(`Email: ${email}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${passwordRaw}`);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: passwordHash,
      role: 'admin',
      email: email, // Ensure email matches
      isActive: true,
      userType: 'real',
      licenseType: 'lifetime', // Give admin lifetime access
    },
    create: {
      email,
      username,
      password: passwordHash,
      role: 'admin',
      name: 'Admin',
      balance: 999999,
      tokenBalance: 99999999,
      isActive: true,
      userType: 'real',
      licenseType: 'lifetime',
    },
  });

  console.log('Admin user ready:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
