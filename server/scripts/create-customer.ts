import bcrypt from "bcrypt";
import {
  CustomerTier,
  CompanyUserRole,
  UserRole,
  AuthProvider,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

// Default plain text password used for seeded customer accounts: Password123!
export const DEFAULT_CUSTOMER_PASSWORD = "Password123!";

export interface CreateCustomerOptions {
  companyId?: string;
  companyName?: string;
  email: string;
  userName?: string;
  customerTier?: CustomerTier;
  password?: string;
}

export async function createCustomerForCompany(options: CreateCustomerOptions) {
  const {
    companyId,
    companyName,
    email,
    userName,
    customerTier = CustomerTier.BRONZE,
    password = DEFAULT_CUSTOMER_PASSWORD,
  } = options;

  let targetCompanyId = companyId;

  if (!targetCompanyId && companyName) {
    const foundCompany = await prisma.company.findFirst({
      where: {
        name: {
          contains: companyName,
          mode: "insensitive",
        },
      },
    });

    if (!foundCompany) {
      throw new Error(`Company with name "${companyName}" not found.`);
    }
    targetCompanyId = foundCompany.id;
  }

  if (!targetCompanyId) {
    const fallbackCompany = await prisma.company.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!fallbackCompany) {
      throw new Error("No companies exist in the database.");
    }
    targetCompanyId = fallbackCompany.id;
  }

  const company = await prisma.company.findUnique({
    where: { id: targetCompanyId },
  });

  if (!company) {
    throw new Error(`Company with id "${targetCompanyId}" not found.`);
  }

  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedName =
      userName || email.split("@")[0].replace(/[._-]/g, " ");

    user = await prisma.user.create({
      data: {
        userName: resolvedName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        authBy: AuthProvider.LOCAL,
        isEmailVerified: true,
        role: UserRole.USER,
      },
    });
  }

  const companyUser = await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: targetCompanyId,
        userId: user.id,
      },
    },
    update: {
      role: CompanyUserRole.CUSTOMER,
      customerTier,
    },
    create: {
      companyId: targetCompanyId,
      userId: user.id,
      role: CompanyUserRole.CUSTOMER,
      customerTier,
    },
  });

  return {
    user,
    company,
    companyUser,
  };
}

function parseCliArgs(): CreateCustomerOptions | null {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    return null;
  }

  const options: Partial<CreateCustomerOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--companyId" && args[i + 1]) {
      options.companyId = args[++i];
    } else if (arg === "--company" && args[i + 1]) {
      options.companyName = args[++i];
    } else if (arg === "--email" && args[i + 1]) {
      options.email = args[++i];
    } else if (arg === "--name" && args[i + 1]) {
      options.userName = args[++i];
    } else if (arg === "--tier" && args[i + 1]) {
      const tier = args[++i].toUpperCase();
      if (tier === "GOLD" || tier === "SILVER" || tier === "BRONZE") {
        options.customerTier = tier as CustomerTier;
      }
    } else if (arg === "--password" && args[i + 1]) {
      options.password = args[++i];
    }
  }

  if (!options.email) {
    return null;
  }

  return options as CreateCustomerOptions;
}

async function runCli() {
  try {
    const cliOptions = parseCliArgs();

    if (cliOptions) {
      console.log(`Adding customer ${cliOptions.email}...`);
      const result = await createCustomerForCompany(cliOptions);
      console.log(`Successfully added customer:`);
      console.log(`- User: ${result.user.userName} (${result.user.email})`);
      console.log(`- Company: ${result.company.name} (${result.company.id})`);
      console.log(`- Role: ${result.companyUser.role}`);
      console.log(`- Tier: ${result.companyUser.customerTier}`);
    } else {
      console.log("Interactive / Demo mode: creating sample customer...");
      const randomId = Math.floor(Math.random() * 9000 + 1000);
      const result = await createCustomerForCompany({
        email: `client.partner${randomId}@external-enterprise.com`,
        userName: `External Partner ${randomId}`,
        customerTier: CustomerTier.GOLD,
      });
      console.log(`Demo customer created successfully:`);
      console.log(`- User: ${result.user.userName} (${result.user.email})`);
      console.log(`- Password: ${DEFAULT_CUSTOMER_PASSWORD}`);
      console.log(`- Company: ${result.company.name}`);
      console.log(`- Tier: ${result.companyUser.customerTier}`);
    }
  } catch (error) {
    console.error("Failed to create customer:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith("create-customer.ts")) {
  runCli();
}
