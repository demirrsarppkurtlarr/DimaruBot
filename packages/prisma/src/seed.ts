import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const guildId = 999999999999999999n;
  const userId = BigInt(process.env.GOD_MODE_USER_IDS?.split(',')[0] ?? '1228369441683931149');

  // Create a test guild
  await prisma.guild.upsert({
    where: { id: guildId },
    create: {
      id: guildId,
      name: 'DimaruBot Test Server',
      ownerId: userId,
      locale: 'en',
      settings: {},
      enabledModules: ['moderation', 'economy', 'levels', 'tickets'],
    },
    update: {},
  });

  // Create default economy settings
  await prisma.economyAdvancedSettings.upsert({
    where: { guildId },
    create: {
      guildId,
      currencyName: 'DimaCoin',
      currencySymbol: '🪙',
    },
    update: {},
  });

  // Create default security settings
  await prisma.securitySettings.upsert({
    where: { guildId },
    create: {
      guildId,
      raidEnabled: true,
      spamEnabled: true,
      scamEnabled: true,
    },
    update: {},
  });

  // Create default welcome settings
  await prisma.welcomeSettings.upsert({
    where: { guildId },
    create: {
      guildId,
      enabled: false,
    },
    update: {},
  });

  // Create test user
  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      username: 'dimaru_admin',
      locale: 'en',
    },
    update: {},
  });

  // Create test DimaCoin account
  await prisma.dimaCoinAccount.upsert({
    where: {
      guildId_userId: {
        guildId,
        userId,
      },
    },
    create: {
      guildId,
      userId,
      wallet: 10000,
      bank: 5000,
      trustScore: 100,
    },
    update: {},
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
