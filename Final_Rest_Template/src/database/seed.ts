import bcrypt from 'bcrypt';
import prisma from '../config/database';

const BCRYPT_ROUNDS = 10;

type SeedResult = { inserted: number; skipped: boolean };

async function seedRoles(): Promise<SeedResult> {
  const minCount = 3;
  const existing = await prisma.role.count();
  if (existing >= minCount) {
    return { inserted: 0, skipped: true };
  }

  const roles = [
    { name: 'Admin', description: 'Full system access' },
    { name: 'Staff', description: 'Staff operations access' },
    { name: 'User', description: 'Standard user access' },
  ];

  let inserted = 0;
  for (const role of roles) {
    const found = await prisma.role.findUnique({ where: { name: role.name } });
    if (!found) {
      await prisma.role.create({ data: role });
      inserted++;
    }
  }

  return { inserted, skipped: inserted === 0 };
}

async function seedDepartments(): Promise<SeedResult> {
  const minCount = 2;
  const existing = await prisma.department.count();
  if (existing >= minCount) {
    return { inserted: 0, skipped: true };
  }

  const departments = [
    { name: 'General Studies', description: 'General academic department' },
    { name: 'Science & Technology', description: 'STEM department' },
  ];

  let inserted = 0;
  for (const dept of departments) {
    const found = await prisma.department.findUnique({ where: { name: dept.name } });
    if (!found) {
      await prisma.department.create({ data: dept });
      inserted++;
    }
  }

  return { inserted, skipped: inserted === 0 };
}

async function seedResources(): Promise<SeedResult> {
  const minCount = 4;
  const existing = await prisma.resource.count();
  if (existing >= minCount) {
    return { inserted: 0, skipped: true };
  }

  const departments = await prisma.department.findMany();
  if (departments.length === 0) {
    return { inserted: 0, skipped: true };
  }

  const resources = [
    { name: 'Introduction to Programming', code: 'CS101', departmentId: departments[0].id },
    { name: 'Database Systems', code: 'CS201', departmentId: departments[0].id },
    { name: 'Physics Fundamentals', code: 'PHY101', departmentId: departments[1]?.id ?? departments[0].id },
    { name: 'Organic Chemistry', code: 'CHEM101', departmentId: departments[1]?.id ?? departments[0].id },
  ];

  let inserted = 0;
  for (const resource of resources) {
    const found = await prisma.resource.findUnique({ where: { code: resource.code } });
    if (!found) {
      await prisma.resource.create({ data: resource });
      inserted++;
    }
  }

  return { inserted, skipped: inserted === 0 };
}

async function seedAdminUser(): Promise<SeedResult> {
  const minCount = 1;
  const existing = await prisma.user.count();
  if (existing >= minCount) {
    return { inserted: 0, skipped: true };
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!adminRole) {
    return { inserted: 0, skipped: true };
  }

  const email = 'admin@institution.local';
  const found = await prisma.user.findUnique({ where: { email } });
  if (found) {
    return { inserted: 0, skipped: true };
  }

  const password = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      email,
      password,
      roleId: adminRole.id,
      isEmailVerified: true,
    },
  });

  return { inserted: 1, skipped: false };
}

async function seedTransactions(): Promise<SeedResult> {
  const minCount = 2;
  const existing = await prisma.transaction.count();
  if (existing >= minCount) {
    return { inserted: 0, skipped: true };
  }

  const user = await prisma.user.findFirst();
  const resources = await prisma.resource.findMany({ take: 2 });
  if (!user || resources.length < 2) {
    return { inserted: 0, skipped: true };
  }

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        resourceId: resources[0].id,
        transactionDate: new Date(),
        status: 'Pending',
      },
      {
        userId: user.id,
        resourceId: resources[1].id,
        transactionDate: new Date(),
        status: 'Active',
      },
    ],
    skipDuplicates: true,
  });

  return { inserted: 2, skipped: false };
}

async function main() {
  const results: Record<string, SeedResult> = {};

  results.roles = await seedRoles();
  results.departments = await seedDepartments();
  results.resources = await seedResources();
  results.users = await seedAdminUser();
  results.transactions = await seedTransactions();

  for (const [model, result] of Object.entries(results)) {
    if (result.skipped && result.inserted === 0) {
      console.log(`[seed] ${model}: skipped (minimum already met)`);
    } else {
      console.log(`[seed] ${model}: inserted ${result.inserted} record(s)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
