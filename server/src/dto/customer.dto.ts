import { z } from "zod";
import { User, CompanyUser, CustomerTier, CompanyUserRole } from "@prisma/client";
import { customerListQuerySchema } from "../schemas/customer.schema";

export type CustomerListQueryDto = z.infer<typeof customerListQuerySchema>;

export interface CustomerResponseDto {
  id: string;
  companyUserId?: string | null;
  companyId: string;
  name: string;
  email: string;
  avatar: string | null;
  customerTier: CustomerTier | null;
  role: CompanyUserRole;
  createdAt: Date;
  updatedAt: Date;
}

export const toCustomerDto = (
  user: User & {
    companyUsers?: CompanyUser[];
  },
  companyId: string,
): CustomerResponseDto => {
  const membership = user.companyUsers?.find((cu) => cu.companyId === companyId);

  return {
    id: user.id,
    companyUserId: membership?.id ?? null,
    companyId,
    name: user.userName,
    email: user.email,
    avatar: user.avatar ?? null,
    customerTier: membership?.customerTier ?? null,
    role: membership?.role ?? CompanyUserRole.CUSTOMER,
    createdAt: membership?.createdAt ?? user.createdAt,
    updatedAt: membership?.updatedAt ?? user.updatedAt,
  };
};
