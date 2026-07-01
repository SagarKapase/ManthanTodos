import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default Inbox project (FR-23)
  let inbox = await prisma.project.findFirst({ where: { isInbox: true } });
  if (!inbox) {
    inbox = await prisma.project.create({
      data: { name: "Inbox", isInbox: true, colour: "#64748b" },
    });
    console.log("Created Inbox project");
  }

  // Seed admin account for first login
  const adminUsername = "admin@manthan.app";
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin",
        username: adminUsername,
        passwordHash: await bcrypt.hash("admin123", 10),
        role: Role.ADMIN,
        mustChangePassword: false, // demo convenience
      },
    });
    console.log(`Created admin: ${adminUsername} / admin123`);
  }

  // A couple of sample projects for context
  for (const [name, colour] of [
    ["Website", "#3b82f6"],
    ["Client A", "#22c55e"],
  ] as const) {
    const exists = await prisma.project.findFirst({ where: { name } });
    if (!exists) await prisma.project.create({ data: { name, colour } });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
