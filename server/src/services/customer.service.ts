import { StatusCodes } from "http-status-codes";
import { CustomerTier, CompanyUserRole, CompanyUser, User } from "@prisma/client";
import {
  CustomerRepository,
  customerRepository as defaultCustomerRepository,
} from "../repositories/customer.repository";
import {
  CompanyRepository,
  companyRepository as defaultCompanyRepository,
} from "../repositories/company.repository";
import {
  UserRepository,
  userRepository as defaultUserRepository,
} from "../repositories/user.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CustomerListQueryDto,
  CustomerResponseDto,
  CreateCustomerDto,
  toCustomerDto,
} from "../dto/customer.dto";

export class CustomerService {
  private customerRepo: CustomerRepository;
  private companyRepo: CompanyRepository;
  private userRepo: UserRepository;

  public constructor(
    customerRepo: CustomerRepository = defaultCustomerRepository,
    companyRepo: CompanyRepository = defaultCompanyRepository,
    userRepo: UserRepository = defaultUserRepository,
  ) {
    this.customerRepo = customerRepo;
    this.companyRepo = companyRepo;
    this.userRepo = userRepo;
  }

  public async listCustomers(
    companyId: string,
    filters: CustomerListQueryDto,
  ): Promise<PaginatedResult<CustomerResponseDto>> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const result = await this.customerRepo.findCustomers(
      companyId,
      {
        search: filters.search,
        customerTier: filters.customerTier,
      },
      { page, limit },
    );

    return {
      ...result,
      docs: result.docs.map((user) => toCustomerDto(user, companyId)),
    };
  }

  public async getCustomer(
    companyId: string,
    customerId: string,
  ): Promise<CustomerResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const customer = await this.customerRepo.findById(companyId, customerId);
    if (!customer) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
    }

    return toCustomerDto(customer, companyId);
  }

  public async addCustomer(
    companyId: string,
    dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const targetUser = await this.userRepo.findByEmail(dto.userEmail);
    if (!targetUser) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User with this email not found. Customers must already be registered DealFlow360 users.",
      );
    }

    const customerTier = dto.customerTier || CustomerTier.BRONZE;

    const existingMembership = await this.companyRepo.findCompanyUser(
      companyId,
      targetUser.id,
    );

    let membershipRecord: CompanyUser;

    if (existingMembership) {
      membershipRecord = await this.companyRepo.updateCompanyUserCustomerTier(
        companyId,
        targetUser.id,
        customerTier,
      );
    } else {
      membershipRecord = await this.companyRepo.addCompanyUser(
        companyId,
        targetUser.id,
        CompanyUserRole.CUSTOMER,
        customerTier,
      );
    }

    return toCustomerDto(
      {
        ...targetUser,
        companyUsers: [membershipRecord],
      },
      companyId,
    );
  }
}

export const customerService = new CustomerService();
