import { PrismaClient } from "../src/generated/prisma/index.js";
import {
  hashPassword,
  initPassword,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_USER_ID,
} from "@restful/shared";

initPassword({ memoryCost: 19456, timeCost: 3, parallelism: 1 });

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword(SEED_ADMIN_PASSWORD);

  await prisma.credential.upsert({
    where: { id: SEED_ADMIN_USER_ID },
    update: { passwordHash },
    create: {
      id: SEED_ADMIN_USER_ID,
      email: SEED_ADMIN_EMAIL,
      passwordHash,
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seeded auth-service admin credential:", SEED_ADMIN_EMAIL);
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
