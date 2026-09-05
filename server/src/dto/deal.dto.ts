import { z } from "zod";
import { Deal, DealStage, DealStatus, User, Company } from "@prisma/client";
import { UserResponseDto, toUserDto } from "./user.dto";
import {
  createDealSchema,
  updateDealSchema,
  dealFilterSchema,
} from "../schemas/deal.schema";

export type CreateDealDto = z.infer<typeof createDealSchema>;
export type UpdateDealDto = z.infer<typeof updateDealSchema>;
export type DealFilterDto = z.infer<typeof dealFilterSchema>;

export interface DealResponseDto {
  id: string;
  companyId: string;
  dealNo: string;
  customerId: string;
  salesRepId: string;
  name: string;
  stage: DealStage;
  status: DealStatus;
  expectedValue: number;
  probability: number;
  expectedCloseDate: Date | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: UserResponseDto;
  salesRep?: UserResponseDto;
  company?: {
    id: string;
    name: string;
  };
}

export const toDealDto = (
  deal: Deal & {
    customer?: User;
    salesRep?: User;
    company?: Company;
  },
): DealResponseDto => {
  return {
    id: deal.id,
    companyId: deal.companyId,
    dealNo: deal.dealNo,
    customerId: deal.customerId,
    salesRepId: deal.salesRepId,
    name: deal.name,
    stage: deal.stage,
    status: deal.status,
    expectedValue: Number(deal.expectedValue),
    probability: Number(deal.probability),
    expectedCloseDate: deal.expectedCloseDate,
    source: deal.source,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    customer: deal.customer ? toUserDto(deal.customer) : undefined,
    salesRep: deal.salesRep ? toUserDto(deal.salesRep) : undefined,
    company: deal.company
      ? { id: deal.company.id, name: deal.company.name }
      : undefined,
  };
};
