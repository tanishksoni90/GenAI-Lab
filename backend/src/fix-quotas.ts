/**
 * Quick script to fix users who have exceeded their token quotas
 * Run with: npx tsx src/fix-quotas.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding users with exceeded quotas...\n');

  // Find users with tokenUsed > tokenQuota
  const users = await prisma.user.findMany({
    where: {
      role: 'student',
    },
    select: {
      id: true,
      email: true,
      name: true,
      tokenUsed: true,
      tokenQuota: true,
    },
  });

  const exceededUsers = users.filter(u => u.tokenUsed > u.tokenQuota);

  if (exceededUsers.length === 0) {
    console.log('✅ No users have exceeded their quotas!');
    return;
  }

  console.log(`Found ${exceededUsers.length} user(s) with exceeded quotas:\n`);
  
  for (const user of exceededUsers) {
    const exceeded = user.tokenUsed - user.tokenQuota;
    console.log(`  - ${user.name} (${user.email})`);
    console.log(`    Used: ${user.tokenUsed} / Quota: ${user.tokenQuota} (exceeded by ${exceeded})`);
  }

  console.log('\n🔧 Fixing exceeded quotas...\n');

  // Fix each user
  for (const user of exceededUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tokenUsed: user.tokenQuota }, // Cap at quota
    });
    console.log(`  ✅ Fixed ${user.email}: tokenUsed set to ${user.tokenQuota}`);
  }

  console.log('\n✅ All exceeded quotas have been fixed!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
