import 'dotenv/config';
import { PrismaClient, Plan, Role, TicketPriority } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const demoCredentials = {
  email: process.env.DEMO_USER_EMAIL ?? 'demo@opsflow.local',
  password: process.env.DEMO_USER_PASSWORD ?? 'OpsFlowDemo2026!',
};

const defaultPolicies = [
  { priority: TicketPriority.URGENT, resolutionHours: 4 },
  { priority: TicketPriority.HIGH, resolutionHours: 8 },
  { priority: TicketPriority.MEDIUM, resolutionHours: 24 },
  { priority: TicketPriority.LOW, resolutionHours: 72 },
];

async function main() {
  const company = await prisma.company.upsert({
    where: { slug: 'opsflow-demo' },
    update: { name: 'OpsFlow Demo', plan: Plan.BUSINESS, deletedAt: null },
    create: { name: 'OpsFlow Demo', slug: 'opsflow-demo', plan: Plan.BUSINESS },
  });

  const passwordHash = await argon2.hash(demoCredentials.password);
  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: demoCredentials.email } },
    update: {
      name: 'OpsFlow Demo',
      passwordHash,
      role: Role.COMPANY_ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      companyId: company.id,
      name: 'OpsFlow Demo',
      email: demoCredentials.email,
      passwordHash,
      role: Role.COMPANY_ADMIN,
    },
  });

  for (const policy of defaultPolicies) {
    await prisma.sLAPolicy.upsert({
      where: { companyId_priority: { companyId: company.id, priority: policy.priority } },
      update: { resolutionHours: policy.resolutionHours },
      create: { companyId: company.id, ...policy },
    });
  }

  console.log(
    `Seeded company ${company.slug}, demo user ${demoCredentials.email}, and ${defaultPolicies.length} SLA policies.`,
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
