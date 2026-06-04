import { PrismaClient } from "@prisma/client";
import { ADMIN_ROLE_NAME, DEFAULT_USER_ROLE_NAME } from "@/shared/constants/roles.js";
import { hashPassword } from "@/utils/password.js";

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

  const adminEmail = "admin@example.com";
  const passwordHash = await hashPassword("Admin123!"); // Replace in first deployment.

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: "System",
      lastName: "Admin",
      passwordHash,
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: userRole.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seeded default roles and admin user:", adminEmail);
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
