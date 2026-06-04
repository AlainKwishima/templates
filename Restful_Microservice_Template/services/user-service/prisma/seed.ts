import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  ADMIN_ROLE_NAME,
  DEFAULT_USER_ROLE_NAME,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_USER_ID,
} from "@restful/shared";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: ADMIN_ROLE_NAME },
    update: {},
    create: {
      name: ADMIN_ROLE_NAME,
      description: "System administrator",
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: DEFAULT_USER_ROLE_NAME },
    update: {},
    create: {
      name: DEFAULT_USER_ROLE_NAME,
      description: "Standard user",
      isSystem: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { id: SEED_ADMIN_USER_ID },
    update: {},
    create: {
      id: SEED_ADMIN_USER_ID,
      email: SEED_ADMIN_EMAIL,
      firstName: "System",
      lastName: "Admin",
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: userRole.id },
  });

  // eslint-disable-next-line no-console
  console.log("Seeded user-service roles and admin profile:", SEED_ADMIN_EMAIL);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
