import {
  Company,
  CompanySetting,
  CompanyUser,
  CompanyUserRole,
  User,
} from "@prisma/client";

export type CompanyWithRelations = Company & {
  owner?: User;
  settings?: CompanySetting | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
      company?: CompanyWithRelations;
      companyUser?: CompanyUser | null;
      companyRole?: CompanyUserRole;
    }
  }
}

